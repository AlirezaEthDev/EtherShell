/**
 * @fileoverview Solidity compiler builder utilities
 * @description Handles Solidity compiler version loading, contract compilation,
 * and artifact generation including ABIs, bytecode, and metadata.
 * @module builder
 */
import { createRequire } from 'module';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import path from 'path';
import fs from 'fs';
import solc from 'solc';
import { check, findImports } from './dir.js';
import { getCompilerOptions } from '../services/build.js';
import semver from 'semver';

/**
 * The path of build.json to store ABIs & bytecodes paths
 */
export const buildJSONPath = "./ethershell/build.json";

const require = createRequire(import.meta.url);
export const compilersDir = './ethershell/compilers';
const BIN_URL = 'https://binaries.soliditylang.org/bin';
const loaded = new Map(); // full version -> solc instance
const LIST_FILE = () => path.resolve(compilersDir, 'list.json');

export const EVM_VERSIONS = ['homestead','tangerineWhistle','spuriousDragon','byzantium',
  'constantinople','petersburg','istanbul','berlin','london','paris','shanghai',
  'cancun','prague','osaka','amsterdam'];

// Minimum solc that accepts each name. Older names fall through as "supported".
export const EVM_MIN_SOLC = { paris: '0.8.18', shanghai: '0.8.20', cancun: '0.8.24',
  prague: '0.8.27', osaka: '0.8.29', amsterdam: '0.8.36' };

export const supportsEvm = (short, evm) => !EVM_MIN_SOLC[evm] || semver.gte(short, EVM_MIN_SOLC[evm]);

export function defaultEvm(short) {
  return semver.gte(short, '0.8.31') ? 'osaka'
       : semver.gte(short, '0.8.30') ? 'prague'
       : semver.gte(short, '0.8.25') ? 'cancun'
       : semver.gte(short, '0.8.20') ? 'shanghai'
       : semver.gte(short, '0.8.18') ? 'paris' : 'london';
}

function compilerFile(version) {
  // version like "v0.8.29+commit.ab55807c"
  return path.resolve(compilersDir, `soljson-${version}.cjs`);
}

async function downloadCompiler(version, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const res = await fetch(`${BIN_URL}/soljson-${version}.js`);
  if (!res.ok) throw new Error(`Download failed (${res.status}) for ${version}`);

  // Write to a temp file first so an interrupted download never leaves a corrupt cache file
  const tmp = `${dest}.part`;
  await pipeline(Readable.fromWeb(res.body), fs.createWriteStream(tmp));
  fs.renameSync(tmp, dest);
}

/**
 * Load a specific version of the Solidity compiler. Downloads only the first time; afterwards reads from disk.
 * @param {string} version - Solidity compiler version identifier
 * @returns {Promise} Promise resolving to solc instance
 * @throws {Error} If version loading fails
 * @example
 * loadSolcVersion('v0.8.20+commit.a1b79de6');
 */
export async function loadSolcVersion(version) {
  const file = compilerFile(version);

  if (!fs.existsSync(file)) {
    console.info(`Downloading compiler ${version} (first time only) ...`);
    await downloadCompiler(version, file);
  }

  return solc.setupMethods(require(file));
}

async function fetchReleaseList() {
  const res = await fetch(`${BIN_URL}/list.json`);
  if (!res.ok) throw new Error(`Cannot fetch compiler list (${res.status})`);
  const text = await res.text();
  fs.mkdirSync(compilersDir, { recursive: true });
  fs.writeFileSync(LIST_FILE(), text);
  return JSON.parse(text);
}

/** "0.8.20" or "v0.8.20" -> "v0.8.20+commit.a1b79de6"; full strings pass through */
export async function resolveVersion(input) {
  if (/^v\d+\.\d+\.\d+\+commit\.[0-9a-f]+$/.test(input)) return input;
  const short = String(input).replace(/^v/, '');
  if (!/^\d+\.\d+\.\d+$/.test(short)) throw new Error(`Invalid compiler version: ${input}`);

  let list = fs.existsSync(LIST_FILE()) ? JSON.parse(fs.readFileSync(LIST_FILE(), 'utf8')) : null;
  if (!list?.releases?.[short]) list = await fetchReleaseList();   // refresh only if unknown
  const file = list.releases[short];
  if (!file) throw new Error(`Unknown Solidity version: ${input}`);
  return file.replace(/^soljson-/, '').replace(/\.js$/, '');
}

/** Load (once per process) and return the solc instance for a version */
export async function getSolc(version) {
  if (!loaded.size) loaded.set(extractLoadableVersion(solc.version()), solc); // bundled one needs no download
  const full = await resolveVersion(version);
  if (!loaded.has(full)) loaded.set(full, await loadSolcVersion(full));
  return loaded.get(full);
}

function pragmaRanges(sources) {
  const ranges = [];
  for (const { content } of Object.values(sources)) {
    for (const m of content.matchAll(/^\s*pragma\s+solidity\s+([^;]+);/gm)) {
      const r = m[1].trim().replace(/(\d)(?=[<>=^~])/g, '$1 ');    // ">=0.6.0<0.9.0" -> ">=0.6.0 <0.9.0"
      if (semver.validRange(r)) ranges.push(r);
      else console.warn(`Ignoring unparsable pragma: ${m[1].trim()}`);
    }
  }
  return ranges;
}

async function selectCompiler(fullPath, sources) {
  const opts = getCompilerOptions();
  const evm = opts.evmVersion;
  const rel = path.relative(process.cwd(), path.resolve(fullPath)).split(path.sep).join('/');

  if (opts.overrides?.[rel]) {
    const full = await resolveVersion(opts.overrides[rel]);
    const short = full.match(/^v(\d+\.\d+\.\d+)/)[1];
    if (evm && !supportsEvm(short, evm))
      throw new Error(`${rel}: override solc ${short} cannot target evmVersion "${evm}" (needs >= ${EVM_MIN_SOLC[evm]})`);
    return { solc: await getSolc(full), short, rel };
  }

  const pool = [...new Set([opts.version, ...(opts.versions ?? [])])];
  const candidates = pool.map((full) => ({ full, short: full.match(/^v(\d+\.\d+\.\d+)/)[1] }));
  const ranges = pragmaRanges(sources);
  const byPragma = candidates.filter((c) => ranges.every((r) => semver.satisfies(c.short, r)));
  const ok = evm ? byPragma.filter((c) => supportsEvm(c.short, evm)) : byPragma;

  if (!ok.length) {
    const why = byPragma.length
      ? `${byPragma.map((c) => c.short).join(', ')} match the pragma but cannot target evmVersion "${evm}" (needs solc >= ${EVM_MIN_SOLC[evm]}).`
      : `No configured compiler satisfies the pragmas (${ranges.join(' | ')}).`;
    throw new Error(`${rel}: ${why} Configured: ${candidates.map((c) => c.short).join(', ')}. Add one with: compAdd <version>`);
  }
  const chosen = ok.find((c) => c.full === opts.version) ?? ok.sort((a, b) => semver.rcompare(a.short, b.short))[0];
  return { solc: await getSolc(chosen.full), short: chosen.short, rel };
}

/**
 * Build (compile) a Solidity contract and save artifacts
 * @param {string} fullPath - Full path to the .sol file
 * @param {Array} [selectedContracts=[]] - Array of contract names to compile from the file
 * @param {string} buildPath - Output directory for compilation artifacts
 * @returns {void}
 * @throws {Error} If compilation fails or produces errors
 * @description Compiles Solidity contracts and saves artifacts in organized subdirectories:
 * - artifacts/: Complete contract data
 * - abis/: Contract ABIs
 * - bytecode/: Contract bytecode
 * - metadata/: Contract metadata
 * @example
 * build('./contracts/MyToken.sol', ['MyToken'], './build');
 */
export async function build(fullPath, selectedContracts, buildPath) {
  if (!selectedContracts) {
    selectedContracts = [];
  }

  const compilerConfig = getCompilerOptions();

  // Get the directory containing the contract
  const contractDir = path.dirname(fullPath);
  const filename = path.basename(fullPath); // keep extension here
  const basename = path.basename(fullPath, '.sol');

  // Build full standard JSON input, including all imports
  const sources = collectSourcesForStandardJson(fullPath, filename);
  const { solc: solcInstance, short, rel } = await selectCompiler(fullPath, sources);

  const input = {
    language: 'Solidity',
    sources,
    settings: {
      outputSelection: {
        '*': {
          '*': ['*'],
        },
      },
    },
  };

  // Apply global compiler configuration
  if (compilerConfig.evmVersion) {
    input.settings.evmVersion = compilerConfig.evmVersion;
  } 
  if (compilerConfig.optimizer) {
    input.settings.optimizer = {
      enabled: true,
      runs: compilerConfig.optimizerRuns,
    };
  }
  if (compilerConfig.viaIR) {
    input.settings.viaIR = true;
  }

  // Compile with import callback (used for anything not in `sources`)
  const output = JSON.parse(
    solcInstance.compile(
      JSON.stringify(input),
      { import: (importPath) => findImports(importPath, contractDir) }
    )
  );
  
  if (output.errors) {
    // Filter out warnings, only throw on actual errors
    const errors = output.errors.filter((err) => err.severity === 'error');
    if (errors.length > 0) {
      throw errors;
    }
  }

  // Generate sub-paths of build
  const artifacts = path.join(buildPath, 'artifacts');
  const abis = path.join(buildPath, 'abis');
  const bytecode = path.join(buildPath, 'bytecode');
  const metadata = path.join(buildPath, 'metadata');
  const standardJsonDir = path.join(buildPath, 'standard-json');
  const subPaths = [artifacts, abis, bytecode, metadata, standardJsonDir];

  // Ensure all sub-paths exist
  subPaths.forEach(check);

  const allContracts = Object.keys(output.contracts[`${filename}`]);
  const contractsToSave =
    selectedContracts.length > 0
      ? allContracts.filter((contractName) =>
          selectedContracts.includes(contractName)
        )
      : allContracts;
  // Object to collect all paths
  const buildObj = fs.existsSync(buildJSONPath)
  ? JSON.parse(fs.readFileSync(buildJSONPath, 'utf8'))
  : {};
  contractsToSave.forEach((contractName) => {
    const contractsData = output.contracts[`${filename}`][contractName];

    // Save artifacts
    const artifactsPath = path.join(artifacts, `${contractName}.json`);
    fs.writeFileSync(artifactsPath, JSON.stringify(contractsData, null, 2));

    // Save ABI
    const abisPath = path.join(abis, `${contractName}.abi.json`);
    fs.writeFileSync(abisPath, JSON.stringify(contractsData.abi, null, 2));

    // Save bytecode
    const bytecodePath = path.join(bytecode, `${contractName}.bin`);
    fs.writeFileSync(
      bytecodePath,
      JSON.stringify(contractsData.evm.bytecode.object, null, 2)
    );

    // Save metadata
    const metadataPath = path.join(metadata, `${contractName}.metadata.json`);
    fs.writeFileSync(
      metadataPath,
      JSON.stringify(contractsData.metadata, null, 2)
    );

    // Save standard JSON input for this entry file
    const standardJsonPath = path.join(
      standardJsonDir,
      `${basename}.standard-input.json`
    );
    fs.writeFileSync(standardJsonPath, JSON.stringify(input, null, 2));

    buildObj[`${contractName}_abi`] = abisPath;
    buildObj[`${contractName}_bytecode`] = bytecodePath;
  });
  
  // Store ABIs and bytecode in build.json  
  fs.mkdirSync(path.dirname(buildJSONPath), { recursive: true });

  fs.writeFileSync(
    buildJSONPath,
    JSON.stringify(buildObj, null, 2),
    'utf8'
  );
}

/**
 * Extract loadable version format from full version string
 * @param {string} fullVersion - Full version string (e.g., "0.8.20+commit.a1b79de6.Emscripten.clang")
 * @returns {string} Loadable version format (e.g., "v0.8.20+commit.a1b79de6")
 * @example
 * extractLoadableVersion("0.8.20+commit.a1b79de6.Emscripten.clang"); // "v0.8.20+commit.a1b79de6"
 */
export function extractLoadableVersion(fullVersion) {
  // Match version number and commit hash from full version string
  const match = fullVersion.match(/(\d+\.\d+\.\d+)\+commit\.([a-f0-9]+)/);
  if (!match) {
    throw new Error(`Unable to extract version from: ${fullVersion}`);
  }
  return `v${match[1]}+commit.${match[2]}`;
}

/*=========================== HELPER =============================*/

/**
 * Resolve a filesystem path for an import.
 * - Relative imports: resolved from `fromDir`
 * - Package imports (starting with '@'): from project root `node_modules`
 */
function resolveImportPath(importPath, fromDir) {
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    return path.resolve(fromDir, importPath);
  }

  // Node-style import, resolve from node_modules
  // e.g. '@openzeppelin/contracts/token/ERC20/ERC20.sol'
  return path.resolve(process.cwd(), 'node_modules', importPath);
}

/**
 * Compute a canonical logical name for Standard JSON "sources".
 *
 * Rules:
 * - If importPath starts with '@', it is anchored at node_modules, so the
 *   canonical name is exactly the import string (e.g. '@openzeppelin/...').
 * - Otherwise, it is resolved relative to the parent canonical name.
 */
function computeCanonicalName(parentCanonical, importPath) {
  // Always anchor @-imports at the package root
  if (importPath.startsWith('@')) {
    return importPath;
  }

  const parentDir = path.posix.dirname(parentCanonical || '');
  if (!parentDir || parentDir === '.') {
    return path.posix.normalize(importPath);
  }
  return path.posix.normalize(path.posix.join(parentDir, importPath));
}

/**
 * Collect all Solidity sources reachable from an entry file and build
 * a Standard JSON "sources" object with canonical logical names that
 * match solc's internal resolution.
 *
 * @param {string} entryPath - Absolute path to the entry .sol file
 * @param {string} logicalEntryName - Initial logical name (e.g. 'MainVestingWalletCliff.sol')
 * @returns {Object} Standard JSON "sources" map
 */
function collectSourcesForStandardJson(entryPath, logicalEntryName) {
  const visited = new Set();
  const sources = {};

  /**
   * @param {string} absPath - Absolute filesystem path
   * @param {string} canonicalName - Logical name used as key in `sources`
   */
  function processFile(absPath, canonicalName) {
    if (visited.has(absPath)) return;
    visited.add(absPath);

    if (!fs.existsSync(absPath)) {
      console.warn(
        `Warning: cannot resolve import "${canonicalName}" at path "${absPath}"`
      );
      return;
    }

    const content = fs.readFileSync(absPath, 'utf8');
    sources[canonicalName] = { content };

    const importRegex =
      /import\s+(?:(?:["']([^"']+)["'])|(?:.*?\sfrom\s+["']([^"']+)["']))\s*;/g;

    let match;
    while ((match = importRegex.exec(content))) {
      const importPath = match[1] || match[2];
      if (!importPath) continue;

      const resolved = resolveImportPath(importPath, path.dirname(absPath));

      const childCanonicalName = computeCanonicalName(canonicalName, importPath);

      processFile(resolved, childCanonicalName);
    }
  }

  const entryCanonicalName = path.posix.normalize(
    logicalEntryName || path.basename(entryPath)
  );
  processFile(entryPath, entryCanonicalName);
  return sources;
}