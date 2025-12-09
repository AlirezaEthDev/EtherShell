# EtherShell

**An interactive Node.js REPL environment for Ethereum smart contract development, compilation, deployment, and wallet management.**

EtherShell is a comprehensive command-line development tool designed to streamline the entire Ethereum smart contract lifecycle. It provides developers with an intuitive interactive console for compiling Solidity contracts, deploying to blockchain networks, managing Ethereum wallets, and interacting with smart contracts—all without leaving your terminal.

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [Configuration](#configuration)
- [Command Reference](#command-reference)
  - [Network Commands](#network-commands)
  - [Compiler Commands](#compiler-commands)
  - [Wallet Commands](#wallet-commands)
  - [Contract Commands](#contract-commands)
  - [Utility Commands](#utility-commands)
- [Detailed Usage Guide](#detailed-usage-guide)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Features

EtherShell combines multiple blockchain development utilities into a single, unified interface:

| Feature | Description |
|---------|-------------|
| **Solidity Compilation** | Compile `.sol` files to ABIs, bytecode, and metadata with support for multiple compiler versions |
| **TypeScript Integration** | Automatic generation of TypeScript type definitions from compiled contract ABIs |
| **Multi-Wallet Support** | Create, import, and manage regular wallets, HD wallets, and node-managed accounts |
| **Network Switching** | Seamlessly switch between different Ethereum networks and RPC providers |
| **Contract Deployment** | Deploy compiled contracts directly to any EVM-compatible blockchain |
| **Contract Interaction** | Call contract methods, read state, and execute transactions with full proxy support |
| **Interactive REPL** | Powerful JavaScript execution environment for scripting and automation |
| **Local Storage** | Persistent wallet and configuration management across sessions |
| **Gas Optimization** | Configure compiler optimization settings for production deployments |

---

## Requirements

Before getting started, ensure your system meets the following requirements:

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher (comes with Node.js)
- **Ethereum Node Access**: Either a local node (Hardhat, Ganache) or remote RPC endpoint (Infura, Alchemy, etc.)
- **Solidity Contracts**: `.sol` files ready for compilation

## Installation

### Global Installation (Recommended)

Install EtherShell globally to use the `ethershell` command from anywhere:

```bash
npm install -g ethershell
```

Then launch the interactive shell:

```bash
ethershell
```

### Local Installation (Development)

Clone the repository and install locally:

```bash
git clone https://github.com/AlirezaEthDev/EtherShell.git
cd EtherShell
npm install
```

Start the development environment:

```bash
npm start
```

Or with auto-reload during development:

```bash
npm run dev
```

---

## Quick Start

### Step 1: Launch EtherShell

```bash
ethershell
```

You'll see the interactive prompt:

```
EtherShell> 
```

### Step 2: Set Your Network

Connect to your desired Ethereum network:

```javascript
EtherShell> await chain('http://127.0.0.1:8545')
// Output: { URL: 'http://127.0.0.1:8545', name: 'hardhat', chainId: 31337n }
```

To verify your network connection:

```javascript
EtherShell> await chainInfo()
// Output: { URL: 'http://127.0.0.1:8545', name: 'hardhat', chainId: 31337n }
```

### Step 3: Create or Import Wallets

Generate a new wallet:

```javascript
EtherShell> newWallet(1)
// ⚠️ WARNING! The generated accounts are NOT safe. Do NOT use them on main net!
// [{ index: 0, address: '0x...', privateKey: '0x...', type: 'user-generated', contracts: [] }]
```

Or import an existing wallet using a private key:

```javascript
EtherShell> addWallet('0x1234567890abcdef...')
// [{ index: 0, address: '0x...', privateKey: '0x...', type: 'user-imported', contracts: [] }]
```

### Step 4: Compile Your Contracts

Prepare your Solidity files in a `./contracts` directory. Then compile:

```javascript
EtherShell> build()
// ✓ Compiler options updated: Gas Optimizer: Disabled, ViaIR: Disabled
// Contracts compiled into /path/to/build
// ✓ TypeScript types generated in /path/to/build/types
```

Compile a specific contract file:

```javascript
EtherShell> build('./contracts/Token.sol')
```

### Step 5: Deploy Your Contract

Deploy a compiled contract:

```javascript
EtherShell> await deploy('MyToken', ['1000000'], 0)
// {
//   hash: '0x...',
//   to: null,
//   address: '0x...',
//   name: 'MyToken',
//   chain: 'hardhat',
//   chainId: 31337n,
//   deployType: 'ethershell-deployed'
// }
```

### Step 6: Interact with Your Contract

Once deployed, the contract is automatically added to the REPL context:

```javascript
EtherShell> await MyToken.balanceOf('0x...')
// 1000000n

EtherShell> await MyToken.transfer('0x...', 100)
// Transaction sent...
```

---

## Core Concepts

### Configuration File

EtherShell stores your configuration in `./localStorage/config.json`:

```json
{
  "providerEndpoint": "http://127.0.0.1:8545",
  "defaultWallet": {
    "index": 0,
    "address": "0x...",
    "type": "user-imported"
  },
  "compiler": {
    "version": "v0.8.20+commit.a1b79de6",
    "optimizer": false,
    "viaIR": false,
    "optimizerRuns": 200,
    "compilePath": "./build"
  }
}
```

### Build Output Structure

After compilation, your build directory contains:

```
build/
├── artifacts/          # Complete contract artifacts (ABI + bytecode + metadata)
├── abis/              # Contract Application Binary Interfaces
├── bytecode/          # Contract deployment bytecode
├── metadata/          # Compiler metadata files
└── types/             # Auto-generated TypeScript type definitions
```

### Wallet Types

EtherShell supports multiple wallet types:

| Wallet Type | Description | Storage |
|-------------|-------------|---------|
| **user-generated** | Random wallets created by EtherShell | `localStorage/wallets.json` |
| **user-imported** | Wallets imported via private key or mnemonic | `localStorage/wallets.json` |
| **node-managed** | Accounts from your Ethereum node (Hardhat, Ganache) | `localStorage/wallets.json` |
| **HD Wallet** | Hierarchical Deterministic wallets from BIP39 mnemonics | `localStorage/wallets.json` |

---

## Configuration

### Compiler Configuration

Configure the Solidity compiler for your needs:

```javascript
// Enable gas optimization with 1000 optimizer runs
EtherShell> compOpts(true, false, 1000)
// ✓ Compiler options updated:
//   Gas Optimizer: Enabled
//   Optimizer Runs: 1000
//   ViaIR: Disabled
```

### Change Compiler Version

Load a different Solidity compiler version:

```javascript
EtherShell> await compUpdate('v0.8.19+commit.7dd6d64b')
// Compiler is loading...
// Loaded solc version: 0.8.19+commit.7dd6d64b.Emscripten.clang
```

### Change Build Output Path

Modify where compiled contracts are saved:

```javascript
EtherShell> compPath('./dist')
// Build path changed to ./dist
```

---

## Command Reference

### Network Commands

| Command | Syntax | Description | Example |
|---------|--------|-------------|---------|
| **Set Network** | `chain(url)` | Connect to an Ethereum network | `await chain('https://mainnet.infura.io/v3/PROJECT-ID')` |
| **Get Network Info** | `chainInfo()` | Display current network details | `await chainInfo()` |
| **Get Default Network** | `defaultChain()` | Show local node default URL | `defaultChain()` |

### Compiler Commands

| Command | Syntax | Description | Example |
|---------|--------|-------------|---------|
| **Compile Contracts** | `build([path], [contracts], [buildPath])` | Compile Solidity files | `build('./contracts/Token.sol')` |
| **Get Compiler Version** | `compiler()` | Display current compiler version | `compiler()` |
| **Update Compiler** | `compUpdate(version)` | Load different compiler version | `await compUpdate('v0.8.20+commit.a1b79de6')` |
| **Get Compiler Options** | `compInfo()` | Show compiler configuration | `compInfo()` |
| **Set Compiler Options** | `compOpts(optimizer, viaIR, runs)` | Configure compiler | `compOpts(true, false, 1000)` |
| **Change Build Path** | `compPath(newPath)` | Change output directory | `compPath('./dist')` |

### Wallet Commands

| Command | Syntax | Description | Example |
|---------|--------|-------------|---------|
| **Create Random Wallets** | `newWallet(count)` | Generate new wallets | `newWallet(5)` |
| **Create HD Wallet** | `newHDWallet(count)` | Generate HD wallets from random mnemonic | `newHDWallet(10)` |
| **Import Wallet(s)** | `addWallet(privKey \| [privKeys])` | Import by private key(s) | `addWallet('0x1234...')` |
| **Import HD Wallet** | `addHDWallet(mnemonic, count)` | Import from BIP39 mnemonic | `addHDWallet('word1 word2 ...', 10)` |
| **View Regular Wallets** | `wallets()` | List user wallets | `wallets()` |
| **View HD Wallets** | `hdWallets()` | List HD wallets | `hdWallets()` |
| **View All Wallets** | `allWallets()` | List all accounts including node-managed | `allWallets()` |
| **Connect Node Wallets** | `connectWallet()` | Import wallets from Ethereum node | `await connectWallet()` |
| **Get Wallet Info** | `walletInfo(pointer)` | Display balance and nonce | `await walletInfo(0)` |
| **Delete Wallet(s)** | `removeWallet(pointer)` | Remove wallet(s) | `removeWallet(0)` |
| **Set Default Wallet** | `changeDefWallet(pointer)` | Set wallet for deployments | `changeDefWallet(0)` |
| **View Default Wallet** | `defWallet()` | Show current default account | `defWallet()` |

### Contract Commands

| Command | Syntax | Description | Example |
|---------|--------|-------------|---------|
| **Deploy Contract** | `deploy(name, args, accIdx, chain, abiLoc, bytecodeLoc)` | Deploy compiled contract | `await deploy('MyToken', ['1000000'], 0)` |
| **Add Existing Contract** | `add(name, address, accIdx, abiLoc, chain)` | Add pre-deployed contract | `await add('USDT', '0xdac17...', 0, './abis/USDT.json')` |
| **Get Contracts** | `contracts([pointer])` | List contracts by various identifiers | `await contracts()` |

### Utility Commands

| Command | Syntax | Description | Example |
|---------|--------|-------------|---------|
| **Show Configuration** | `configInfo()` | Display full config file | `configInfo()` |
| **Clean Build Folder** | `clean(path)` | Delete directory recursively | `clean('./build')` |

---

## Detailed Usage Guide

### Working with Multiple Networks

Switch between networks seamlessly:

```javascript
// Connect to Ethereum mainnet
EtherShell> await chain('https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY')

// Deploy contract to mainnet
EtherShell> await deploy('MyToken', ['1000000'], 0)

// Switch to testnet
EtherShell> await chain('https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY')

// Verify network
EtherShell> await chainInfo()
```

### HD Wallet Management

Working with HD wallets (useful for managing multiple related accounts):

```javascript
// Create a new HD wallet with 10 derived accounts
EtherShell> newHDWallet(10)
// ⚠️ WARNING! The generated accounts are NOT safe. Do NOT use them on main net!
// Displays 10 accounts derived from the same mnemonic

// Or import from existing mnemonic
EtherShell> addHDWallet('witch collapse practice feed shame open despair creek road again ice least', 5)

// List all HD wallets
EtherShell> hdWallets()
```

### Gas Optimization

Optimize your contracts for production deployment:

```javascript
// Enable gas optimizer with 2000 runs for maximum optimization
EtherShell> compOpts(true, false, 2000)

// Enable IR-based code generation (advanced optimization)
EtherShell> compOpts(true, true, 2000)

// Disable optimization (faster compilation, useful during development)
EtherShell> compOpts(false, false, 200)

// Verify settings
EtherShell> compInfo()
```

### TypeScript Type Generation

EtherShell automatically generates TypeScript types from your compiled ABIs. After compilation:

```
build/
└── types/
    ├── index.ts           # Barrel export
    ├── MyToken.ts         # MyToken contract types
    ├── UniswapRouter.ts   # UniswapRouter contract types
    └── ...
```

Use these types in your TypeScript projects:

```typescript
import { MyToken, UniswapRouter } from './build/types';

async function interact() {
  const myToken: MyToken = MyTokenInstance;
  const balance = await myToken.balanceOf(userAddress);
}
```

### Contract Deployment and Interaction

Full workflow example:

```javascript
// 1. Set network
EtherShell> await chain('http://localhost:8545')

// 2. Create or import wallet
EtherShell> newWallet(1)

// 3. Compile contract
EtherShell> build('./contracts/Token.sol')

// 4. Deploy
EtherShell> await deploy('Token', ['MyToken', 'TKN', '1000000'], 0)

// 5. Interact (contract is automatically available as Token)
EtherShell> await Token.name()
// 'MyToken'

EtherShell> await Token.totalSupply()
// 1000000n

// 6. Execute transactions
EtherShell> await Token.transfer('0x742d35Cc6634C0532925a3b844Bc9e7595f42bE', 1000)
// { hash: '0x...', gasUsed: 52000n, ... }

// 7. Get wallet info
EtherShell> await walletInfo(0)
// { address: '0x...', balance: '1.234', nonce: 5 }
```

### Persistent State Management

EtherShell stores your wallets and configuration between sessions:

```bash
# Session 1: Create wallet
EtherShell> newWallet(1)
EtherShell> exit

# Session 2: Same wallet still available
EtherShell> wallets()
// Your previously created wallet is there!
```

Configuration is stored in:
- `localStorage/config.json` - Network and compiler settings
- `localStorage/wallets.json` - All wallet information

---

## Project Structure

```
EtherShell/
├── bin/
│   └── cli.js                    # Main CLI entry point
├── src/
│   ├── services/
│   │   ├── build.js              # Solidity compilation service
│   │   ├── wallet.js             # Wallet management service
│   │   ├── network.js            # Network provider service
│   │   ├── addContracts.js       # Contract deployment service
│   │   ├── contracts.js          # Contract retrieval service
│   │   └── config.js             # Configuration service
│   └── utils/
│       ├── builder.js            # Compiler version management
│       ├── accounter.js          # Wallet storage utilities
│       ├── typeGenerator.js      # TypeScript type generation
│       ├── contractProxy.js      # Contract proxy wrapper
│       ├── dir.js                # File system utilities
│       ├── replHelper.js         # REPL customization
│       └── ...                   # Additional utilities
├── localStorage/                # Local persistent storage
│   ├── config.json              # Configuration file
│   └── wallets.json             # Wallet storage
├── package.json                 # Project metadata
├── LICENSE                      # MIT License
└── README.md                    # This file
```

---

## Troubleshooting

### Issue: "Cannot connect to provider"

**Cause**: The specified RPC endpoint is unreachable or incorrect.

**Solution**:
```javascript
// Verify your RPC URL
EtherShell> await chain('http://localhost:8545')

// Check if local node is running
// For Hardhat: npx hardhat node
// For Ganache: ganache-cli
```

### Issue: "Contract name is empty"

**Cause**: You're trying to deploy without specifying a contract name.

**Solution**:
```javascript
// Ensure the contract name matches your compiled contract
EtherShell> build('./contracts/MyToken.sol')
EtherShell> await deploy('MyToken', [], 0)  // ✓ Correct
```

### Issue: "Wallet index is out of range"

**Cause**: Trying to use a wallet index that doesn't exist.

**Solution**:
```javascript
// Check available wallets
EtherShell> wallets()

// Use valid index from the list
EtherShell> await deploy('MyToken', [], 0)  // 0 is first wallet
```

### Issue: "⚠️ Generated accounts are NOT safe"

**This is a WARNING, not an error!** EtherShell reminds you that randomly generated accounts should only be used on testnets, not on mainnet with real funds.

**Best Practice**:
```javascript
// Use testnet for development
EtherShell> await chain('https://sepolia.infura.io/...')

// Use imported wallets for mainnet
EtherShell> addWallet('0x...')  // Your real private key
EtherShell> await chain('https://mainnet.infura.io/...')
```

### Issue: "TypeError: compile is not a function"

**Cause**: Function names in REPL context are different from their module names.

**Solution**: Always use the REPL command names:
```javascript
EtherShell> build()              // ✓ Correct
EtherShell> compile()            // ✗ Wrong - use build()
```

---

## Contributing

Contributions are welcome! To contribute to EtherShell:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and commit: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

Please ensure your code follows the existing style and includes appropriate documentation.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support & Community

- **Issues**: Report bugs on [GitHub Issues](https://github.com/AlirezaEthDev/EtherShell/issues)
- **Author**: Alireza Kiakojouri (alirezaethdev@gmail.com)
- **Repository**: [github.com/AlirezaEthDev/EtherShell](https://github.com/AlirezaEthDev/EtherShell)

---

## Disclaimer

EtherShell is a development tool. Always test extensively on testnets before deploying to mainnet. Never share your private keys or seed phrases. Be cautious when using generated wallets—they should only be used in development environments.

---

**Happy building! 🚀**