# 🔷 EtherShell - Interactive Ethereum Smart Contract Console

**⚠️ WARNING: This package is in BETA testing. NOT production ready!**

An interactive Node.js console for Ethereum smart contract development. Write, compile, deploy, and manage smart contracts directly from the shell with an intuitive, Solidity-focused developer experience.

**Perfect for:**
- Smart contract developers who want a fast, interactive workflow
- Rapid prototyping and testing of Solidity contracts
- Learning Ethereum development
- DeFi protocol development and testing
- Quick contract interactions and deployments

## ✨ Features

- **Interactive REPL Shell** – Custom async evaluation with top‑level `await` support in a Node.js REPL.
- **Solidity Compilation** – Compile contracts with configurable optimization and `viaIR` options.
- **Smart Contract Deployment** – Deploy contracts to any EVM network using ethers v6.
- **Wallet Management** – Create, import, and manage wallets (regular & HD wallets, plus node‑managed accounts).
- **Multi‑Network Support** – Switch between blockchain networks with persistent provider configuration.
- **Contract Proxy Wrapper** – Enhanced contract interaction with a proxy that supports `from`, `value`, gas options, EIP‑1559 fields, and custom data.
- **Contract Interactions** – Call contract methods (read & write) with advanced options directly from the shell.
- **ABI & Bytecode Generation** – Organized artifacts (`artifacts`, `abis`, `bytecode`, `metadata`) plus an aggregated ABI file.
- **Node Signer Integration** – Connect to node‑managed accounts (Hardhat, Anvil, etc.).
- **TypeScript Code Generation** – Auto‑generate TypeScript types from ABIs into a `types/` directory under the build path.
- **Gas Optimization Controls** – Configure optimizer enable flag, runs, and `viaIR` globally.
- **Persistent Configuration** – Store provider, compiler config, wallets, and contracts in the `./ethershell` directory.
- **Comprehensive JSDoc** – Rich JSDoc comments for IDE autocompletion and type hints throughout the codebase.

## 🚀 Quick Start

### Installation

```bash
# Install globally:
npm i -g ethershell

# Start EtherShell in the root directory of your project:
ethershell

# or

npx ethershell
```

Run the CLI in your project root so EtherShell can find `./contracts` and write `./ethershell` and `./build` data next to your project files.

### Basic Usage

```bash
# Start the console in the root directory of your project:
ethershell

# You should see:
# EtherShell>
```

## 📖 Step‑by‑Step Guide

### 1. Network Configuration

First, connect to a blockchain network.

```javascript
// View current network
EtherShell> chainInfo()
{ URL: 'http://127.0.0.1:8545', name: 'unknown', chainId: 1337n }

// Switch to a different network
EtherShell> chain('https://sepolia.infura.io/v3/YOUR-PROJECT-ID')
{ URL: 'https://sepolia.infura.io/v3/...', name: 'sepolia', chainId: 11155111n }

// Get default network info
EtherShell> defaultChain()
{ URL: 'http://127.0.0.1:8545' }
```

Internally, `chain()` updates the in‑memory provider and saves the selected endpoint to `./ethershell/config.json` so it persists between sessions.

### 2. Wallet Management

#### Create New Wallets

```javascript
// Create a single random wallet
EtherShell> newWallet()
!WARNING!
 The generated accounts are NOT safe. Do NOT use them on main net!
[
  {
    index: 0,
    address: '0x1234...5678',
    privateKey: '0xabcd...ef01',
    type: 'user-generated',
    contracts: []
  }
]

// Create 5 new wallets at once
EtherShell> newWallet(5)
!WARNING!
 The generated accounts are NOT safe. Do NOT use them on main net!
[
  { index: 0, address: '0x...', ... },
  { index: 1, address: '0x...', ... },
  // ... 5 wallets total
]
```

`newWallet()` persists wallets into `./ethershell/wallets.json`.

#### Import Existing Wallets

```javascript
// Import a single private key
EtherShell> addWallet('0xYourPrivateKeyHere')

// Import multiple private keys
EtherShell> addWallet([
  '0xPrivateKey1...',
  '0xPrivateKey2...',
  '0xPrivateKey3...'
])
```

EtherShell detects duplicate wallets by private key and throws if you attempt to re‑add an existing key.

#### HD Wallet Management

```javascript
// Create new HD wallet (10 derived accounts)
EtherShell> newHDWallet()
!WARNING!
 The generated accounts are NOT safe. Do NOT use them on main net!
[
  { index: 0, address: '0x...', phrase: '...', path: "m/0", ... },
  { index: 1, address: '0x...', phrase: '...', path: "m/1", ... },
  // ... 10 accounts
]

// Create 5 derived accounts from new random mnemonic
EtherShell> newHDWallet(5)

// Import HD wallet from known mnemonic
EtherShell> addHDWallet('word word word ... (12 or 24 words)', 10)

// View all HD wallets
EtherShell> hdWallets()
!WARNING!
 The generated accounts are NOT safe. Do NOT use them on main net!
[ ... ]
```

#### Connect to Node‑Managed Accounts

```javascript
// For Hardhat, Anvil, or other nodes with unlocked accounts
EtherShell> connectWallet()

// This adds accounts managed by the node (e.g., Hardhat default accounts)
```

#### View Wallets

```javascript
// View regular (imported/generated) accounts
EtherShell> wallets()

// View all accounts (regular + HD + node-managed)
EtherShell> allWallets()

// View wallet details with balance and nonce
EtherShell> walletInfo(0)
// or by address
EtherShell> walletInfo('0x1234...5678')
// or multiple
EtherShell> walletInfo()[1][2]

// Change default account
EtherShell> changeDefWallet(0)
// or by address
EtherShell> changeDefWallet('0x1234...5678')
// or import and set as default in one command
EtherShell> changeDefWallet('0xPrivateKeyHere')
```

#### Delete Wallets

```javascript
// Delete by index
EtherShell> removeWallet(0)

// Delete by address
EtherShell> removeWallet('0x1234...5678')

// Delete by mnemonic (all derived accounts from this phrase)
EtherShell> removeWallet('word word word ...')

// Delete multiple by indices
EtherShell> removeWallet()[2][3]

// Delete all wallets
EtherShell> removeWallet()
```

Deletion updates in‑memory arrays and rewrites `./ethershell/wallets.json`; if the removed wallet is the default one, the default entry in `config.json` is also cleared.

### 3. Solidity Compilation

#### Configure Compiler

```javascript
// View current compiler version (bundled solc if no remote has been loaded)
EtherShell> compiler()
"0.8.xx+commit....Emscripten.clang"

// Switch to a different Solidity version
EtherShell> compUpdate('v0.8.29+commit.ab55807c')
Loaded solc version: 0.8.29+commit.ab55807c.Emscripten.clang

// Configure compilation options (gasOptimizer, viaIR, optimizerRuns)
EtherShell> compOpts(true, false, 1000)
✓ Compiler options updated:
 Gas Optimizer: Enabled
 ViaIR: Disabled
 Optimizer Runs: 1000

// Get current compiler options
EtherShell> compInfo()
{
  version: 'v0.8.29+commit.ab55807c',
  optimizer: true,
  viaIR: false,
  optimizerRuns: 1000,
  compilePath: './build'
}

// Get current config info
EtherShell> configInfo()
{
  providerEndpoint: '...',
  defaultWallet: { ... },
  compiler: {
    version: 'v0.8.29+commit.ab55807c',
    optimizer: false,
    viaIR: false,
    optimizerRuns: 200,
    compilePath: './build'
  }
}

// Get default wallet
EtherShell> defWallet()
{ address: '0x...', ... }

// Change build output path
EtherShell> compPath('./custom-build')
```

Compiler configuration is kept in memory and mirrored into `config.json`, including version, optimizer flags, runs, and the default `compilePath`.

#### Compile Contracts

```javascript
// Compile all .sol files in ./contracts directory
EtherShell> build()
Contracts compiled into /path/to/build
Aggregated ABI generated at /path/to/build/aggregated.abi.json
TypeScript types generated in /path/to/build/types

// Compile a specific contract file
EtherShell> build('./contracts/MyToken.sol')
Contract compiled into /path/to/build

// Compile specific contracts from a file to a custom build directory
EtherShell> build('./contracts/MyToken.sol', ['MyToken', 'OtherContract'], './custom-build')
Contracts compiled into /path/to/custom-build

// Clean build directory
EtherShell> clean()
Directory deleted successfully
``` 

**Compiler Output Structure:**

```text
build/
├── artifacts/           # Complete contract data with metadata
├── abis/                # Contract ABIs (.abi.json files)
├── bytecode/            # Contract bytecode (.bin files)
├── metadata/            # Contract metadata (.metadata.json files)
├── standard-json/       # Per‑entry solc standard JSON inputs
├── aggregated.abi.json  # Flattened ABI array from all ABI files
└── types/               # Auto-generated TypeScript types
```

TypeScript types are generated by scanning `build/abis` and writing `.ts` files plus an `index.ts` barrel export.

### 4. Smart Contract Deployment

#### Deploy New Contracts

```javascript
// Deploy contract without constructor args and with default wallet
// Arguments: contractName
EtherShell> deploy('contractName')
{
  hash: '0x123abc...',
  from: '0x1234...5678',
  to: null,
  address: '0xabcd...ef01',
  name: 'contractName',
  chain: 'sepolia',
  chainId: 11155111n,
  deployType: 'ethershell-deployed'
}

// Deploy MyToken contract with constructor args and default wallet
// Arguments: contractName, args[], walletIndex, [chainURL], [abiLocation], [bytecodeLocation]
EtherShell> deploy('MyToken', ['MyTokenName', 'MTK', 1000000])
{ ... }

// Deploy MyToken contract with constructor args and a non-default wallet
EtherShell> deploy('MyToken', ['MyTokenName', 'MTK', 1000000], 0)
{ ... }

// Deploy with custom chain
EtherShell> deploy('MyContract', ['arg1', 'arg2'], 0, 'https://custom-rpc.url')
```

ABIs and bytecode are resolved from the build directory via paths persisted in `./ethershell` local storage,.

#### Add Existing Contracts

```javascript
// Add an already-deployed contract
// Arguments: contractName, contractAddress, walletIndex, abiPath, [chainURL]
EtherShell> addContract(
  'USDT',
  '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  0,
  './build/abis/USDT.abi.json'
)
{
  index: 1,
  name: 'USDT',
  address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  chain: 'mainnet',
  chainId: 1n,
  deployType: 'pre-deployed'
}

// Now you can interact with it:
EtherShell> USDT.balanceOf('0x1234...5678')
1000000000000000000n
```

All added/deployed contracts are also stored in `./ethershell/contracts.json`.

### 5. Contract Interaction

#### View Contracts

```javascript
// Get all deployed/added contracts
EtherShell> contracts()
[
  {
    index: 0,
    name: 'MyToken',
    address: '0xabcd...ef01',
    chain: 'sepolia',
    chainId: 11155111n,
    deployType: 'ethershell-deployed'
  },
  {
    index: 1,
    name: 'USDT',
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    chain: 'mainnet',
    deployType: 'pre-deployed'
  }
]

// Get contract by index
EtherShell> contracts(0)

// Get contract by address
EtherShell> contracts('0xabcd...ef01')

// Get contract by name
EtherShell> contracts('MyToken')
```

`contracts()` reads enriched contract information (including live balances).
#### Call Contract Functions

```javascript
// Your deployed contracts are available as variables
EtherShell> MyToken
Contract { ... }

// Read-only functions
EtherShell> MyToken.name()
"MyTokenName"

EtherShell> MyToken.totalSupply()
1000000n

// State-changing functions
EtherShell> MyToken.transfer('0xRecipientAddress', 100)
ContractTransactionReceipt { ... }

// Call with advanced transaction options
EtherShell> MyToken.transfer('0xRecipientAddress', 100, {
  from: '0xSenderAddress',              // Switch signer (must be a non node-managed wallet)
  value: 10000000000000n,               // Send ETH (payable)
  gasLimit: 500000,
  maxFeePerGas: 100000000000n,
  maxPriorityFeePerGas: 2000000000n,
  nonce: 42,
  chainId: 1
})
```

**Contract Proxy Options include:**

- `from`: change signer (must have `privateKey`)
- `value`: ETH value for payable functions
- `gasLimit` or `gas`
- `gasPrice`
- `maxFeePerGas`, `maxPriorityFeePerGas`
- `nonce`
- `chainId`
- `accessList`
- `type`
- `customData` for special networks (e.g., zkSync)[file:25]

## 🎯 Complete Usage Example

```javascript
// 1. Connect to network
EtherShell> chain('http://127.0.0.1:8545')

// 2. Create wallets
EtherShell> newWallet(2)

// 3. View wallets
EtherShell> wallets()

// 4. Configure compiler
EtherShell> compOpts(true, false, 1000)

// 5. Compile contracts
EtherShell> build()

// 6. Deploy contract
EtherShell> deploy('MyToken', ['TestToken', 'TEST', 1000000])

// 7. Interact with contract
EtherShell> MyToken.balanceOf('0x...')

// 8. Transfer tokens with custom options
EtherShell> tx = MyToken.transfer('0x...', 100, {
  gasLimit: 100000,
  maxFeePerGas: 50000000000n
})

// 9. Check balance again
EtherShell> MyToken.balanceOf('0x...')

// 10. View all contracts
EtherShell> contracts()
```

## 📋 Command Reference

### Network Commands

| Command          | Description                         |
|------------------|-------------------------------------|
| `chain(url)`     | Connect to blockchain network       |
| `chainInfo()`    | Get current network info            |
| `defaultChain()` | Get default network URL             |[file:13][file:19]

### Wallet Commands

| Command                                   | Description                                      |
|-------------------------------------------|--------------------------------------------------|
| `newWallet([count])`                      | Create random wallets                            |
| `addWallet(privKey\|keys)`                | Import wallets from private keys                 |
| `newHDWallet([count])`                    | Create HD wallet with random mnemonic            |
| `addHDWallet(phrase, count)`             | Import HD wallet from mnemonic                   |
| `connectWallet()`                         | Connect to node‑managed accounts                 |
| `wallets()`                               | View regular accounts                            |
| `hdWallets()`                             | View HD accounts                                 |
| `allWallets()`                            | View all accounts                                |
| `walletInfo(index\|address\|[indices])`   | Get wallet details (balance, nonce)             |
| `changeDefWallet(pointer)`               | Set default account                              |
| `removeWallet(pointer)`                  | Delete account(s)                                |[file:13][file:20][file:22]

### Compiler Commands

| Command                                         | Description                              |
|-------------------------------------------------|------------------------------------------|
| `compiler()`                                    | Get current Solidity version string      |
| `compUpdate(version)`                           | Load specific Solidity version           |
| `compOpts(gasOpt, viaIR, runs)`                 | Configure optimizer and viaIR            |
| `compInfo()`                                    | Get current compiler configuration       |
| `configInfo()`                                  | Get full configuration object            |
| `defWallet()`                                   | Get default account from config          |
| `compPath(newPath)`                             | Change build output path                 |
| `build([path], [contracts], [output])`          | Compile contracts                        |
| `clean([path])`                                 | Delete build directory (default `./build`) |[file:13][file:16][file:21][file:17]

### Contract Commands

| Command                                                                 | Description                      |
|-------------------------------------------------------------------------|----------------------------------|
| `deploy(name, [args], [index], [chainURL], [abiLocation], [bytecodeLocation])` | Deploy new contract              |
| `addContract(name, address, index, abiPath, [chainURL])`               | Add existing contract            |
| `contracts([pointer])`                                                 | List contracts or get a specific one |[file:13][file:15][file:18]

## 🛠️ Setup for Development

### Prerequisites

- Node.js 16+
- npm or yarn
- Basic Solidity knowledge[file:31]


### Project Structure

```text
ethershell/
├── bin/
│   └── cli.js                  # REPL entry point
├── src/
│   ├── services/
│   │   ├── build.js            # Compiler management & build orchestration
│   │   ├── wallet.js           # Wallet management (accounts, HD, node-managed)
│   │   ├── network.js          # Network provider configuration
│   │   ├── addContracts.js     # Deployment & contract registration
│   │   ├── contracts.js        # Contract lookup helper
│   │   ├── configSync.js       # In‑memory <-> config.json synchronization
│   │   └── files.js            # File system utilities (clean build)
│   └── utils/
│       ├── builder.js          # Low‑level solc Standard JSON compiler wrapper
│       ├── dir.js              # Directory & import resolution utilities
│       ├── accounter.js        # Account storage and deletion utilities
│       ├── contractProxy.js    # Contract proxy wrapper with tx options
│       ├── contractLister.js   # Contracts registry and balance formatting
│       ├── typeGenerator.js    # TypeScript type generation from ABIs
│       ├── replHelper.js       # REPL customization & async eval
│       ├── serialize.js        # BigInt serialization for JSON
│       └── configFileUpdate.js # Helper to update provider in config.json
├── contracts/                  # Your Solidity contracts
├── build/                      # Compiled artifacts and types (output)
├── ethershell/                 # Persistent config, wallets, contracts, solc cache
└── package.json
```

`./ethershell` contains `config.json`, `wallets.json`, `contracts.json`, and localStorage data used by the compiler and contract manager.

## 📚 Example Contracts

### Simple ERC20‑Style Token

You can keep the existing sample token or plug in OpenZeppelin contracts; EtherShell will handle `@openzeppelin/...` imports as long as they are installed in `node_modules`.

### Deployment Example

```javascript
// 1. Compile
EtherShell> build('./contracts/MyToken.sol')

// 2. Deploy
EtherShell> deploy('MyToken')

// 3. Interact
EtherShell> MyToken.balanceOf('0x...')

// 4. Transfer
EtherShell> MyToken.transfer('0x...', 100)
```

## ⚙️ Configuration

### Persistent Storage

EtherShell stores runtime data under the `./ethershell` directory in your project root.

```text
ethershell/
├── config.json      # Compiler and network settings + default wallet
├── wallets.json     # Imported/generated wallets
└── contracts.json   # Registered contracts and metadata
```

Configuration is updated automatically as you change network, compiler options, default wallet, deploy contracts, or add existing contracts.

### Configuration File Example

```json
{
  "providerEndpoint": "http://127.0.0.1:8545",
  "defaultWallet": {
    "index": 0,
    "address": "0x...",
    "type": "user-generated"
  },
  "compiler": {
    "version": "v0.8.29+commit.ab55807c",
    "optimizer": false,
    "viaIR": false,
    "optimizerRuns": 200,
    "compilePath": "./build"
  }
}
```

## 🔒 Security Warnings

⚠️ **IMPORTANT SECURITY NOTES:**

1. Never use generated accounts on mainnet – they are for development and testing only.
2. Keep private keys secret – do not commit wallets or config files containing secrets.
3. Use testnets (e.g. Sepolia) for experimentation before going to mainnet.
4. Always audit and review your contracts before production deployments.

Add to your `.gitignore`:

```bash
.env
node_modules/
build/
ethershell/
*.log
```

This prevents accidental commits of compiled artifacts and local wallet/config state.

## 🐛 Troubleshooting

**Issue: `Error: Cannot find module 'ethers'`**

```bash
Solution: npm install
```

**Issue: `Cannot connect to network`**

- Check the RPC URL passed to `chain()`.[file:19]
- Verify the network (Hardhat, Ganache, etc.) is running.
- For public RPCs, check your internet connection and provider limits.

**Issue: `Insufficient balance for gas`**

- Ensure the selected wallet has enough ETH for gas.
- Use testnet faucets when working on Sepolia or other testnets.

**Issue: `Contract not found in build artifacts`**

- Run `build()` first.[file:16]
- Check that contract names match exactly.
- Verify `.sol` files exist under `./contracts`. [file:23]

**Issue: `TypeScript types not generated`**

- Ensure compilation succeeded.
- Confirm ABI files exist under `build/abis`.
- Check console output for errors thrown by `generateAllTypes()`. [file:16][file:30]

**Issue: error about `{ from }` with node‑managed account**

- Node‑managed accounts do not have private keys in EtherShell, so `{ from }` cannot rebind them.
- Import or generate a wallet with a private key and use that address in `from` instead. [file:20][file:25]

## 📖 API Documentation

The source code uses detailed JSDoc comments:

- `@fileoverview` – file purpose and module description
- `@param` – parameter types and descriptions
- `@returns` – return types
- `@throws` – error conditions
- `@example` – usage samples[file:13][file:16][file:20][file:25]

You can generate static docs with JSDoc if desired:

```bash
npm install -g jsdoc
jsdoc src/ -r -d docs/
```

## 🤝 Contributing

Contributions are welcome:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes.
4. Push to your branch.
5. Open a Pull Request.[file:31]

## 📄 License

This project is licensed under the BUSL‑1.1 License – see the `LICENSE` file for details. [file:31]

## 💬 Support & Community

- Issues: GitHub Issues
- Questions: GitHub Discussions
- Docs: This README and `ethershell-website.html`[file:31][file:32]

---

**Made with ❤️ for Ethereum developers.**

Happy hacking! 🚀