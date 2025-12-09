/**
 * @fileoverview TypeScript type generation from Solidity ABIs
 * @description Generates type-safe TypeScript interfaces and classes
 * from compiled Solidity contracts for use in TypeScript projects
 * @module typeGenerator
 */

import path from 'path';
import fs from 'fs';

/**
 * Generate TypeScript types from contract ABI
 * @param {string} contractName - Name of the contract
 * @param {Array} abi - Contract ABI array
 * @param {string} outputPath - Output directory for types
 * @returns {string} Path to generated type file
 */
export function generateContractTypes(contractName, abi, outputPath) {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    // Generate TypeScript interfaces
    const interfaces = generateInterfaces(contractName, abi);
    const typePath = path.join(outputPath, `${contractName}.ts`);
    
    fs.writeFileSync(typePath, interfaces);
    
    return typePath;
  } catch (error) {
    console.error(`Error generating types for ${contractName}:`, error.message);
    throw error;
  }
}

/**
 * Generate all TypeScript types from build artifacts
 * @param {string} buildPath - Path to build directory with ABIs
 * @param {string} typesOutputPath - Output directory for TypeScript types
 * @returns {Array} Array of generated type file paths
 */
export function generateAllTypes(buildPath, typesOutputPath = './src/types') {
  try {
    const abisPath = path.join(buildPath, 'abis');
    
    if (!fs.existsSync(abisPath)) {
      throw new Error(`ABIs directory not found at ${abisPath}`);
    }

    const abiFiles = fs.readdirSync(abisPath).filter(f => f.endsWith('.abi.json'));
    const generatedFiles = [];

    abiFiles.forEach(file => {
      const contractName = file.replace('.abi.json', '');
      const abiPath = path.join(abisPath, file);
      const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
      
      const typePath = generateContractTypes(contractName, abi, typesOutputPath);
      generatedFiles.push(typePath);
    });

    // Generate index.ts for barrel export
    generateIndexFile(typesOutputPath, abiFiles);

    return generatedFiles;
  } catch (error) {
    console.error('Error generating types:', error.message);
    throw error;
  }
}

/**
 * Generate TypeScript interface from ABI
 * @private
 */
function generateInterfaces(contractName, abi) {
  const functions = abi.filter(item => item.type === 'function');
  const events = abi.filter(item => item.type === 'event');
  const structs = extractStructTypes(abi);

  let typescript = `/**
 * Auto-generated types for ${contractName} contract
 * Generated from ABI
 */

// ============= TYPES =============
${generateStructTypes(structs)}

// ============= FUNCTION INPUTS =============
${generateFunctionTypes(functions, 'input')}

// ============= FUNCTION OUTPUTS =============
${generateFunctionTypes(functions, 'output')}

// ============= EVENT TYPES =============
${generateEventTypes(events)}

// ============= CONTRACT INTERFACE =============
export interface I${contractName} {
${generateContractMethods(functions)}
}

// ============= ABI EXPORT =============
export const ${contractName}ABI = ${JSON.stringify(abi, null, 2)} as const;
`;

  return typescript;
}

/**
 * Generate TypeScript types for function inputs/outputs
 * @private
 */
function generateFunctionTypes(functions, direction) {
  const lines = [];
  
  functions.forEach(func => {
    const params = direction === 'input' ? func.inputs : func.outputs;
    if (!params || params.length === 0) return;

    const funcName = func.name;
    const typeName = `${funcName.charAt(0).toUpperCase() + funcName.slice(1)}${direction === 'input' ? 'Params' : 'Result'}`;
    
    lines.push(`export interface ${typeName} {`);
    params.forEach((param, idx) => {
      const name = param.name || `param${idx}`;
      const type = solToTsType(param.type);
      lines.push(`  ${name}: ${type};`);
    });
    lines.push('}\n');
  });

  return lines.join('\n');
}

/**
 * Generate TypeScript types for events
 * @private
 */
function generateEventTypes(events) {
  const lines = [];
  
  events.forEach(event => {
    const typeName = `${event.name}Event`;
    lines.push(`export interface ${typeName} {`);
    
    event.inputs.forEach((input, idx) => {
      const name = input.name || `param${idx}`;
      const type = solToTsType(input.type);
      const indexed = input.indexed ? ' // indexed' : '';
      lines.push(`  ${name}: ${type};${indexed}`);
    });
    
    lines.push('}\n');
  });

  return lines.join('\n');
}

/**
 * Generate contract method signatures
 * @private
 */
function generateContractMethods(functions) {
  const lines = [];
  
  functions.forEach(func => {
    const inputs = func.inputs.map(inp => {
      const type = solToTsType(inp.type);
      return `${inp.name || 'param'}: ${type}`;
    }).join(', ');
    
    let returnType = 'Promise<void>';
    if (func.outputs && func.outputs.length > 0) {
      if (func.outputs.length === 1) {
        returnType = `Promise<${solToTsType(func.outputs[0].type)}>`;
      } else {
        returnType = `Promise<[${func.outputs.map(o => solToTsType(o.type)).join(', ')}]>`;
      }
    }

    const stateMutability = func.stateMutability || 'nonpayable';
    lines.push(`  ${func.name}(${inputs}): ${returnType}; // ${stateMutability}`);
  });

  return lines.join('\n');
}

/**
 * Convert Solidity type to TypeScript type
 * @private
 */
function solToTsType(solidityType) {
  // Handle arrays
  if (solidityType.endsWith(']')) {
    const baseType = solidityType.replace(/\[\d*\]/g, '');
    return `${solToTsType(baseType)}[]`;
  }

  // Handle base types
  if (solidityType.startsWith('uint')) return 'bigint';
  if (solidityType.startsWith('int')) return 'bigint';
  if (solidityType.startsWith('bytes')) return 'string | Uint8Array';
  if (solidityType === 'bool') return 'boolean';
  if (solidityType === 'address') return 'string'; // EVM address as checksum string
  if (solidityType === 'string') return 'string';
  
  // Fallback for custom types
  return 'any';
}

/**
 * Extract struct types from ABI
 * @private
 */
function extractStructTypes(abi) {
  // This would require more advanced parsing for tuple types
  return [];
}

/**
 * Generate struct type definitions
 * @private
 */
function generateStructTypes(structs) {
  if (structs.length === 0) return '// No custom structs\n';
  
  return structs.map(struct => `export interface ${struct.name} {\n  // struct fields\n}\n`).join('\n');
}

/**
 * Generate barrel export index.ts
 * @private
 */
function generateIndexFile(typesPath, abiFiles) {
  const exports = abiFiles
    .map(file => {
      const name = file.replace('.abi.json', '');
      return `export * from './${name}';`;
    })
    .join('\n');

  const indexPath = path.join(typesPath, 'index.ts');
  fs.writeFileSync(indexPath, `// Auto-generated barrel export\n${exports}\n`);
}
