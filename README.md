# EtherShell: Ethereum Smart Contract Development CLI
EtherShell is an interactive Node.js command-line interface designed to streamline Solidity smart contract development workflows. This actively developed tool provides version-managed compilation, multi-network deployment, and contract interaction capabilities while maintaining extensibility for future blockchain development needs.

# Core Capabilities
1) Dynamic Compiler Management
* Load specific Solidity compiler versions on-demand.
* Switch between local and remote compiler instances.
* Validate compiler compatibility with Ethereum Virtual Machine (EVM) targets.

2) Interactive Development Console
* REPL environment with context-aware command history.
* Auto-complete for contract methods and compiler versions.
* Session persistence for compiler states and network configurations.

3) Deployment Workflows
* Configure multiple Ethereum endpoints (Local/Mainnet/Testnets).
* Transaction simulation with gas estimation.
* Deployment artifact version tracking.

  # Quick Start
  Global Installation:
  ```
  npm install -g ethershell
  ```
  Verify installation:
  ```
  ethershell --version  
  ```
  # Basic Usage
  
  1) Compiler Operations:
  * Initialize default compiler:
  ```
  ethershell> compilerVersion()  
  '0.8.21+commit.d9974bed' 
  ```
  * Load specific compiler version:
  ```
  ethershell> setCompiler('v0.8.28+commit.7893614a')  
  Loaded solc version: 0.8.28+commit.7893614a.Emscripten.clang
  ```
