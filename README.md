<p align="center">
  <img src="logo/White.png" alt="The logo of EtherShell" width="300">
</p>

<h1 align="center">EtherShell</h1>
<h1 align="center">Interactive Ethereum Smart Contract Console</h1>
<h2 align="center">⚠️ WARNING: This package is in BETA testing, NOT production ready ⚠️</h2>

An interactive Node.js console for Ethereum smart contract development. Write, compile, deploy, and manage smart contracts directly from the shell with an intuitive, Solidity-focused developer experience.

**Perfect for:**
- Smart contract developers who want a fast, interactive workflow
- Rapid prototyping and testing of Solidity contracts
- Learning Ethereum development
- DeFi protocol development and testing
- Quick contract interactions and deployments

## 📑 Table of Contents

- [✨ Features](#-features)
- [🚀 Quick Start](#-quick-start)
  - [Installation](#installation)
  - [Basic Usage](#basic-usage)
- [📖 Step‑by‑Step Guide](#-stepbystep-guide)
  - [1. Network Configuration](#1-network-configuration)
  - [2. Wallet Management](#2-wallet-management)
    - [Create New Wallets](#create-new-wallets)
    - [Import Existing Wallets](#import-existing-wallets)
    - [HD Wallet Management](#hd-wallet-management)
    - [Connect to Node‑Managed Accounts](#connect-to-nodemanaged-accounts)
    - [View Wallets](#view-wallets)
    - [Find Contracts Deployed by a Wallet](#find-contracts-deployed-by-a-wallet)
    - [Delete Wallets](#delete-wallets)
  - [3. Solidity Compilation](#3-solidity-compilation)
    - [Configure Compiler](#configure-compiler)
    - [Compile Contracts](#compile-contracts)
    - [Flatten Contracts](#flatten-contracts)
    - [Compiler Output Structure](#compiler-output-structure)
  - [4. Smart Contract Deployment](#4-smart-contract-deployment)
    - [Deploy New Contracts](#deploy-new-contracts)
    - [Add Existing Contracts](#add-existing-contracts)
    - [Restore Stored Contracts](#restore-stored-contracts)
    - [Remove Contracts](#remove-contracts)
  - [5. Contract Interaction](#5-contract-interaction)
    - [View Contracts](#view-contracts)
    - [Call Contract Functions](#call-contract-functions)
  - [6. Directory Navigation](#6-directory-navigation)
  - [7. Exit EtherShell](#7-exit-ethershell)
- [🎯 Complete Usage Example](#-complete-usage-example)
- [📋 Command Reference](#-command-reference)
  - [Network Commands](#network-commands)
  - [Wallet Commands](#wallet-commands)
  - [Compiler Commands](#compiler-commands)
  - [Contract Commands](#contract-commands)
  - [Shell Commands](#shell-commands)
- [🛠️ Setup for Development](#setup-for-development)
  - [Prerequisites](#prerequisites)
  - [Project Structure](#project-structure)
- [📚 Example Contracts](#-example-contracts)
  - [Simple ERC20‑Style Token](#simple-erc20style-token)
  - [Deployment Example](#deployment-example)
- [⚙️ Configuration](#configuration)
  - [Persistent Storage](#persistent-storage)
  - [Configuration File Example](#configuration-file-example)
- [🔒 Security Warnings](#-security-warnings)
- [🐛 Troubleshooting](#-troubleshooting)
- [📖 API Documentation](#-api-documentation)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [💬 Support & Community](#-support--community)

## ✨ Features

- **Interactive REPL Shell** – A Node.js REPL with shell-style commands (`build ./contracts`, `deploy MyToken`) and a custom evaluator that automatically awaits Promise results, so you never type `await`.
- **Solidity Compilation** – Compile contracts with configurable optimization and `viaIR` options.
- **Smart Contract Deployment** – Deploy contracts to any EVM network using ethers v6.
- **Contract Registry** – List, add, restore, and remove deployed contracts; records are stored in `./ethershell/contracts.json`.
- **Contract Restoration** – Recreate previously deployed or added contract proxies in a new session with `restoreContract`.
- **Wallet Management** – Create, import, and manage wallets (regular & HD wallets, plus node‑managed accounts), and look up the contracts each wallet deployed.
- **Multi‑Network Support** – Switch between blockchain networks with persistent provider configuration.
- **Contract Proxy Wrapper** – Enhanced contract interaction with a proxy that supports `from`, `value`, gas options, EIP‑1559 fields, and custom data. State-changing calls return the receipt with decoded `eventValues`.
- **ABI & Bytecode Generation** – Organized artifacts (`artifacts`, `abis`, `bytecode`, `metadata`, `standard-json`) plus aggregated ABI and bytecode files.
- **Contract Flattening** – Merge a Solidity entry file and its local or `node_modules` imports into one verifiable `.sol` file.
- **Node Signer Integration** – Connect to node‑managed accounts (Hardhat, Anvil, etc.).
- **TypeScript Code Generation** – Auto‑generate TypeScript types from ABIs into a `types/` directory under the build path.
- **Gas Optimization Controls** – Configure optimizer enable flag, runs, and `viaIR`.
- **Built-in Directory Commands** – Move around the file system with `where`, `cd`, `ls`, `pushd`, and `popd` without leaving the shell.
- **Persistent Configuration** – Store provider, default wallet, wallets, and contracts in the `./ethershell` directory.
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

Commands are typed like shell commands: the command name followed by space-separated arguments.

```text
EtherShell> chain http://127.0.0.1:8545
EtherShell> build ./contracts/MyToken.sol
EtherShell> contracts
```

- Optional arguments are shown in `[brackets]` throughout this guide. To skip an optional argument that sits before one you do need, type `undefined`.
- Paths, names, addresses, and URLs need no quotes. Numbers, `true`, `false`, `null`, and `undefined` are passed as literals.
- Type `exit` to leave the shell.

## 📖 Step‑by‑Step Guide

### 1. Network Configuration

First, connect to a blockchain network.

```text
// View current network
EtherShell> chainInfo
{ URL: 'http://127.0.0.1:8545', name: 'unknown', chainId: 1337n }

// Switch to a different network
EtherShell> chain https://sepolia.infura.io/v3/YOUR-PROJECT-ID
{ URL: 'https://sepolia.infura.io/v3/...', name: 'sepolia', chainId: 11155111n }

// Get default network info
EtherShell> defaultChain
{ URL: 'http://127.0.0.1:8545' }
```

Internally, `chain` updates the in‑memory provider and saves the selected endpoint to `./ethershell/config.json` so it persists between sessions.

URLs that contain `=` (for example `?key=abc`) cannot be typed this way, because a line containing `=` is run as plain JavaScript. For such an endpoint, use `chain('https://rpc.example/?key=abc')`.

### 2. Wallet Management

#### Create New Wallets

```text
// Create a single random wallet
EtherShell> newWallet
!WARNING!
 The generated accounts are NOT safe. Do NOT use them on main net!
[
  {
    index: 0,
    address: '0x1234...5678',
    privateKey: '0xabcd...ef01',
    type: 'user-generated'
  }
]

// Create 5 new wallets at once
EtherShell> newWallet 5
!WARNING!
 The generated accounts are NOT safe. Do NOT use them on main net!
[
  { index: 0, address: '0x...', ... },
  { index: 1, address: '0x...', ... },
  // ... 5 wallets total
]
```

`newWallet` persists wallets into `./ethershell/wallets.json`. Each call returns only the wallets it just created.

`newWallet`, `newHDWallet`, and `addHDWallet` also reset the default wallet to the wallet at index `0`. Run `changeDefWallet` afterwards if you want a different default.

#### Import Existing Wallets

```text
// Import a single private key
EtherShell> addWallet 0xYourPrivateKeyHere
```

EtherShell detects duplicate wallets by private key and throws if you attempt to re‑add an existing key. To import several keys in one command, pass them as a JavaScript array of strings: `addWallet(['0xPrivateKey1...', '0xPrivateKey2...'])`.

#### HD Wallet Management

```text
// Create new HD wallet (10 derived accounts)
EtherShell> newHDWallet
!WARNING!
 The generated accounts are NOT safe. Do NOT use them on main net!
[
  { index: 0, address: '0x...', phrase: '...', path: "m/44'/60'/0'/0/0/0", ... },
  { index: 1, address: '0x...', phrase: '...', path: "m/44'/60'/0'/0/0/1", ... },
  // ... 10 accounts
]

// Create 5 derived accounts from a new random mnemonic
EtherShell> newHDWallet 5

// View all HD wallets
EtherShell> hdWallets
!WARNING!
 The generated accounts are NOT safe. Do NOT use them on main net!
[ ... ]
```

Each HD account record holds `index`, `address`, `phrase`, `privateKey`, `type`, `path`, and `depth`.

To import an HD wallet from a known mnemonic, the phrase has to be written as a quoted string, so use parentheses: `addHDWallet('word word word ... (12 or 24 words)', 10)`. The second argument is the number of accounts to derive (default 10). Importing the same mnemonic twice throws an error.

#### Connect to Node‑Managed Accounts

```text
// For Hardhat, Anvil, or other nodes with unlocked accounts
EtherShell> connectWallet

// This adds accounts managed by the node (e.g., Hardhat default accounts)
```

Node‑managed accounts have no private key inside EtherShell (`type: 'node-managed'`). `deploy`, `addContract`, `restoreContract`, and the `{ from }` transaction option all build a signer from a private key, so use an imported or generated wallet for them.

#### View Wallets

```text
// View regular (imported/generated) accounts
EtherShell> wallets

// View all accounts (regular + HD + node-managed)
EtherShell> allWallets

// View wallet details with balance and nonce
EtherShell> walletInfo 0
// or by address
EtherShell> walletInfo 0x1234...5678

// View the default wallet
EtherShell> defWallet

// Change default account
EtherShell> changeDefWallet 0
// or by address
EtherShell> changeDefWallet 0x1234...5678
// or import a private key and set it as default in one command
EtherShell> changeDefWallet 0xPrivateKeyHere
```

`walletInfo` returns `index`, `address`, `privateKey`, `type`, `nonce`, and `balance` (plus `phrase`, `path`, and `depth` for HD accounts). It needs an index or an address.

Address lookups compare the text exactly, so type the address in the same form that `wallets` prints (checksummed). `changeDefWallet <index>` and `changeDefWallet <address>` save the default wallet to `config.json`. A private key imported through `changeDefWallet` becomes the default wallet for the session, but this command does not write it to `wallets.json`; use `addWallet` to store it.

#### Find Contracts Deployed by a Wallet

```text
// By wallet index
EtherShell> depContOf 0
[
  { address: '0xabcd...ef01', deployedOn: 'sepolia', chainId: '11155111' }
]

// By wallet address (case-insensitive)
EtherShell> depContOf 0x1234...5678
```

`depContOf` reads `./ethershell/wallet2contract.json`, which `deploy`, `addContract`, and `restoreContract` update. It throws if the index is out of range or the address was never imported.

#### Delete Wallets

```text
// Delete by index
EtherShell> removeWallet 0

// Delete by address
EtherShell> removeWallet 0x1234...5678

// Delete several wallets by index
EtherShell> removeWallet 2 3

// Delete ALL wallets
EtherShell> removeWallet
```

Deletion updates the in‑memory arrays, re-numbers the remaining wallets so indices stay consecutive, removes the wallet's entry from `wallet2contract.json`, and rewrites `./ethershell/wallets.json`. If the removed wallet is the default one, the default entry in `config.json` is also cleared. Run `allWallets` again before using indices after a deletion.

> **Warning:** `removeWallet` with no argument deletes every wallet.

To delete all accounts derived from a mnemonic, write the phrase as a quoted string: `removeWallet('word word word ...')`.

### 3. Solidity Compilation

#### Configure Compiler

```text
// View current compiler version (bundled solc if no remote has been loaded)
EtherShell> compiler
"0.8.xx+commit....Emscripten.clang"

// Switch to a different Solidity version
EtherShell> compUpdate v0.8.29+commit.ab55807c
Loaded solc version: 0.8.29+commit.ab55807c.Emscripten.clang

// Configure compilation options: gasOptimizer, viaIR, optimizerRuns
EtherShell> compOpts true false 1000
✓ Compiler options updated:
  Gas Optimizer: Enabled
  ViaIR: Disabled
  Optimizer Runs: 1000

// Get current compiler options
EtherShell> compInfo
{
  version: 'v0.8.29+commit.ab55807c',
  optimizer: true,
  viaIR: false,
  optimizerRuns: 1000,
  compilePath: './build'
}

// Get current config info
EtherShell> configInfo
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
EtherShell> defWallet
{ address: '0x...', ... }

// Change build output path
EtherShell> compPath ./custom-build
```

`compOpts` requires both flags to be `true` or `false`; `optimizerRuns` defaults to `200`. The "Optimizer Runs" line is printed only when the optimizer is enabled.

Compiler settings are mirrored into `config.json` when you change them, but they are **not reloaded at startup**. Each new session starts with the bundled solc, optimizer off, `viaIR` off, 200 runs, and `./build` as the build path. Re-run `compUpdate`, `compOpts`, and `compPath` at the beginning of a session if you need other values. The network endpoint and default wallet are the settings that persist between sessions.

#### Compile Contracts

```text
// Compile all .sol files in ./contracts directory
EtherShell> build
Contracts compiled into /path/to/build
Aggregated ABI generated at /path/to/build/abis/aggregated.abi.json
Aggregated bytecode generated at /path/to/build/bytecode/aggregated.bytecode.json
TypeScript types generated in /path/to/build/types

// Compile a specific contract file
EtherShell> build ./contracts/MyToken.sol
Contract compiled into /path/to/build
...

// Compile every .sol file under a directory
EtherShell> build ./contracts/tokens

// Clean build directory
EtherShell> clean
Directory deleted successfully

// Clean a different directory
EtherShell> clean ./custom-build
```

`build [path] [contracts] [output]` takes a file or a directory (default `./contracts`), an optional array of contract names to keep, and an optional output directory (default: the current build path, `./build`). A path with a file extension is compiled as one file; any other path is searched recursively for `.sol` files.

Selecting contracts by name needs a quoted array, so write it with parentheses: `build('./contracts/MyToken.sol', ['MyToken', 'OtherContract'], './custom-build')`.

Besides the files in `build/`, every compilation records the ABI and bytecode location of each contract in `./ethershell/build.json`. `deploy` and `addContract` use this file to find a contract's ABI by name.

`clean` deletes `./build` unless you pass another path. It does not follow the build path set by `compPath`, and it does not touch `./ethershell/build.json`.

#### Flatten Contracts

`flatten` combines a root Solidity file with its imported dependencies into a single file. It supports relative imports and package imports from `node_modules`, such as OpenZeppelin contracts.

```text
// Flatten a contract into <contract-name>.flattened.sol
EtherShell> flatten ./contracts/MyToken.sol
Flattened contract written to /path/to/contracts/MyToken.flattened.sol

// Flatten into a custom output file
EtherShell> flatten ./contracts/MyToken.sol ./output/MyToken.flat.sol
Flattened contract written to /path/to/output/MyToken.flat.sol
```

The generated file contains a single `// SPDX-License-Identifier: MIXED` line when any source file declares a license, and a single `pragma solidity` statement (the first one found, normally the entry file's), followed by the dependency and entry-file source in dependency order. The output directory must already exist. Review the result before verification or deployment, especially when imported files use different licenses.

#### Compiler Output Structure

```text
build/
├── artifacts/           # Complete contract data with metadata
├── abis/                # Contract ABIs (<Name>.abi.json) + aggregated.abi.json
├── bytecode/            # Contract bytecode (<Name>.bin) + aggregated.bytecode.json
├── metadata/            # Contract metadata (<Name>.metadata.json)
├── standard-json/       # Per‑entry solc standard JSON inputs (<File>.standard-input.json)
└── types/               # Auto-generated TypeScript types
```

- `abis/aggregated.abi.json` is an object that maps each contract name to its ABI array.
- `bytecode/aggregated.bytecode.json` maps each contract name to its bytecode string. Both aggregated files are rebuilt from every file currently in their folders, including output from earlier compilations.
- TypeScript types are generated by scanning `build/abis` and writing `.ts` files plus an `index.ts` barrel export. The aggregated ABI file is skipped.

### 4. Smart Contract Deployment

#### Deploy New Contracts

```text
// Deploy a contract without constructor arguments, using the default wallet
// Usage: deploy <contractName> [args] [walletIndex] [chainURL] [abiLocation] [bytecodeLocation]
EtherShell> deploy Counter
{
  hash: '0x123abc...',
  from: '0x1234...5678',
  to: null,
  ...                               // other transaction fields
  ethershellIndex: 0,
  address: '0xabcd...ef01',
  name: 'Counter',
  chain: 'sepolia',
  deployType: 'ethershell-deployed',
  eventValues: []
}

// Deploy with constructor arguments (numbers) and the default wallet
EtherShell> deploy MyToken [1000000]
{ ... }

// Deploy with constructor arguments and a non-default wallet (wallet index 0)
EtherShell> deploy MyToken [1000000] 0
{ ... }

// Deploy to a custom chain
EtherShell> deploy MyToken [1000000] 0 http://127.0.0.1:9545

// No constructor arguments, default wallet, custom chain
EtherShell> deploy Counter [] undefined http://127.0.0.1:9545
```

After a successful deployment, the contract is available in the shell as a variable named after the contract (for example `MyToken`), and its record is saved in `./ethershell/contracts.json`. The returned object is the deployment transaction with the EtherShell fields `ethershellIndex`, `address`, `name`, `chain`, `deployType`, and decoded `eventValues` added.

ABIs and bytecode are resolved from the paths stored in `./ethershell/build.json` by `build`, unless you pass `abiLocation` and `bytecodeLocation`. The wallet must have a private key.

Constructor arguments typed on the command line must be numbers or booleans. For string arguments, write the arguments as quoted JavaScript with parentheses: `deploy('MyToken', ['MyTokenName', 'MTK', 1000000], 0)`.

#### Add Existing Contracts

```text
// Add an already-deployed contract
// Usage: addContract <contractName> <contractAddress> [walletIndex] [abiPath] [chainURL]
EtherShell> addContract USDT 0xdAC17F958D2ee523a2206206994597C13D831ec7 0 ./build/abis/USDT.abi.json
{
  index: 1,
  name: 'USDT',
  address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  chain: 'mainnet',
  chainId: 1n,
  deployType: 'pre-deployed',
  provider: JsonRpcProvider { ... },
  abiPath: './build/abis/USDT.abi.json'
}

// Now you can interact with it:
EtherShell> USDT.balanceOf('0x1234...5678')
1000000000000000000n
```

If you omit `walletIndex`, the default wallet is used. If you omit `abiPath`, EtherShell looks up `<contractName>_abi` in `./ethershell/build.json`, so the contract must have been compiled in this project. Adding the same address on the same chain twice throws an error.

All added/deployed contracts are also stored in `./ethershell/contracts.json`.

#### Restore Stored Contracts

Use `restoreContract` after restarting EtherShell to make previously deployed or added contracts available by name again. It takes no arguments and recreates contract proxies from the saved names, addresses, and ABI paths in the contract registry loaded from `./ethershell/contracts.json` at startup. It does not compile or redeploy contracts, send transactions, or restore on-chain state.

Start EtherShell from the same project root, then confirm the network and select an existing wallet with a private key before restoring:

```text
// Connect to the network where the stored contracts are deployed
// Skip this if the saved RPC endpoint already points to the correct network
EtherShell> chain http://127.0.0.1:8545

// Select an existing imported/generated wallet or HD account
// Replace 0 with the appropriate wallet index
EtherShell> changeDefWallet 0

// Restore all registered contracts into the current session
EtherShell> restoreContract
Stored contracts instantiating ...
All stored contracts instantiated!

// A stored contract named MyToken is now available again
EtherShell> MyToken.balanceOf('0x1234...5678')
```

**Requirements and behavior:**

- Keep `./ethershell/contracts.json` and the ABI files referenced by its entries. Relative ABI paths are resolved from the current working directory; if you delete or move build artifacts, restore the ABI files at their recorded paths before running the command.
- Every restored contract uses the current default wallet. The selected account must have a private key; node-managed accounts are not supported by this restoration path.
- **All contracts are attached to the currently selected network.** The command does not switch networks using the stored `chain` or `chainId`, validate them against the active network, or recover a custom RPC URL previously passed to `deploy` or `addContract`. Use this bulk command only when the stored contracts belong to the active network; for a mixed-network registry, attach contracts individually with `addContract <name> <address> <walletIndex> <abiPath> <chainURL>` instead.
- The command restores all registry entries; it has no contract-name, wallet-index, or network arguments. If the registry is empty it returns `The storage is empty!`. On success, it prints the messages shown above rather than returning a contract list. Use `contracts` to inspect the registry.
- Restoration uses the registry already loaded in memory. If you manually edit `contracts.json` while EtherShell is running, restart the console to load those changes.
- Run it once when resuming a session. Repeating it recreates the named proxies and appends contract references to the default wallet's in-memory contract list, but does not add duplicate entries to `contracts.json`. Each run also records the contract again under the wallet in `wallet2contract.json`, so `depContOf` can list a contract more than once. If an entry fails to restore, the command stops at that error; contracts restored before the error remain available.

#### Remove Contracts

```text
// Remove one contract record by index
EtherShell> removeContract 1

// Remove several records
EtherShell> removeContract 1 2

// Remove ALL contract records
EtherShell> removeContract
```

`removeContract` deletes the selected records from memory, from `./ethershell/contracts.json`, and from `./ethershell/wallet2contract.json`, then re-numbers the remaining records. It accepts only registry indices (use `contracts` to see them), not names or addresses. It does not remove the contract variable (for example `MyToken`) from the running shell; restart EtherShell to clear it.

> **Warning:** `removeContract` with no argument removes every record.

> **Caution:** `removeContract 0` is treated like "no argument" and also removes **all** records. To remove only the first contract, use the array form `removeContract([0])`.

### 5. Contract Interaction

#### View Contracts

```text
// Get all deployed/added contracts
EtherShell> contracts
[
  {
    index: 0,
    name: 'MyToken',
    address: '0xabcd...ef01',
    chain: 'sepolia',
    chainId: 11155111n,
    deployType: 'ethershell-deployed',
    balance: 0n,
    abiPath: './build/abis/MyToken.abi.json'
  },
  {
    index: 1,
    name: 'USDT',
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    chain: 'mainnet',
    chainId: 1n,
    deployType: 'pre-deployed',
    balance: 0n,
    abiPath: './build/abis/USDT.abi.json'
  }
]

// Get contract by index
EtherShell> contracts 0

// Get contract by address
EtherShell> contracts 0xabcd...ef01

// Get contract by name
EtherShell> contracts MyToken
```

`contracts` reads enriched contract information, including the live `balance` from the currently selected network. A lookup that finds nothing returns `undefined`. Address lookups compare the text exactly, so use the address as it is stored in the registry.

#### Call Contract Functions

Deployed and added contracts are variables in the shell. Their methods are ordinary JavaScript functions, so unlike the shell commands above they are called with parentheses and quoted arguments.

```text
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
ContractTransactionReceipt { ..., eventValues: [ { name: 'Transfer', values: [...] } ] }

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

The shell waits for Promises automatically, so do not type `await`. A state-changing call waits until the transaction is mined and returns the receipt with an extra `eventValues` array that holds the decoded events (`name` and `values`) emitted by your contract.

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
- `customData` for special networks (e.g., zkSync)

The `data` option is ignored with a warning, because calldata is encoded automatically from the function call.

### 6. Directory Navigation

EtherShell includes small shell-style commands for moving around the file system.

| Command                | Description                                                              |
|------------------------|--------------------------------------------------------------------------|
| `where`                | Print the current working directory                                      |
| `cd <path>`            | Change the current directory and print the new location                  |
| `ls [path]`            | List a directory: folders first (with a trailing `/`), then files, sorted by name |
| `pushd [path]`         | Save the current directory on a stack and move to `path`. With no argument it swaps with the most recently saved directory |
| `popd`                 | Return to the most recently saved directory and remove it from the stack |

```text
EtherShell> where
/home/me/my-project
EtherShell> pushd ./contracts
"/home/me/my-project/contracts" "/home/me/my-project"
EtherShell> ls
Contents of: /home/me/my-project/contracts
tokens/
MyToken.sol
EtherShell> popd
"/home/me/my-project"
```

`pushd` and `popd` print the stack with the current directory first. The stack lives only for the current session. A path that contains spaces needs quotes, so write it with parentheses, for example `cd('../my project')`.

> **Important:** EtherShell finds its data with relative paths such as `./ethershell`, `./contracts`, and `./build`, and those paths follow the current directory. Use these commands to look around, then return to the project root (for example with `popd`) before you run commands that read or write project data, such as `build`, `deploy`, `newWallet`, or `restoreContract`.

### 7. Exit EtherShell

```text
EtherShell> exit
Goodbye 👋
```

## 🎯 Complete Usage Example

```text
// 1. Connect to network
EtherShell> chain http://127.0.0.1:8545

// 2. Create wallets
EtherShell> newWallet 2

// 3. View wallets
EtherShell> wallets

// 4. Configure compiler
EtherShell> compOpts true false 1000

// 5. Flatten dependencies into one file (optional)
EtherShell> flatten ./contracts/MyToken.sol

// 6. Compile contracts
EtherShell> build

// 7. Deploy contract (constructor takes the initial supply)
EtherShell> deploy MyToken [1000000]

// 8. Interact with contract (contract methods use parentheses)
EtherShell> MyToken.balanceOf('0x...')

// 9. Transfer tokens with custom options
EtherShell> MyToken.transfer('0x...', 100, {
  gasLimit: 100000,
  maxFeePerGas: 50000000000n
})

// 10. Check balance again
EtherShell> MyToken.balanceOf('0x...')

// 11. View all contracts
EtherShell> contracts
```

To resume working with the same contracts after restarting EtherShell in this project, check the network and default wallet, then restore the saved contract proxies:

```text
EtherShell> chainInfo
EtherShell> defWallet
EtherShell> restoreContract
EtherShell> MyToken.balanceOf('0x...')
```

See [Restore Stored Contracts](#restore-stored-contracts) for prerequisites and network limitations.

## 📋 Command Reference

Arguments in `<angle brackets>` are required and arguments in `[square brackets]` are optional. Type the command name followed by the arguments, separated by spaces, without parentheses.

### Network Commands

| Command          | Description                         |
|------------------|-------------------------------------|
| `chain <url>`    | Connect to blockchain network       |
| `chainInfo`      | Get current network info            |
| `defaultChain`   | Get default network URL             |

### Wallet Commands

| Command                              | Description                                              |
|--------------------------------------|----------------------------------------------------------|
| `newWallet [count]`                  | Create random wallets                                    |
| `addWallet <privateKey>`             | Import a wallet from a private key                       |
| `newHDWallet [count]`                | Create HD wallet with random mnemonic (default 10)       |
| `connectWallet`                      | Connect to node‑managed accounts                         |
| `wallets`                            | View regular accounts                                    |
| `hdWallets`                          | View HD accounts                                         |
| `allWallets`                         | View all accounts                                        |
| `walletInfo <index or address>`      | Get wallet details (balance, nonce)                      |
| `changeDefWallet <index, address, or privateKey>` | Set default account                         |
| `defWallet`                          | Get default account from config                          |
| `depContOf <index or address>`       | List contracts recorded for a wallet                     |
| `removeWallet [index, address, or several indices]` | Delete account(s); no argument deletes all |

`addHDWallet(phrase, [count])` and `removeWallet('<mnemonic>')` take a quoted mnemonic, so they are written with parentheses.

### Compiler Commands

| Command                                  | Description                                            |
|------------------------------------------|--------------------------------------------------------|
| `compiler`                               | Get current Solidity version string                    |
| `compUpdate <version>`                   | Load specific Solidity version                         |
| `compOpts <gasOpt> <viaIR> [runs]`       | Configure optimizer and viaIR, e.g. `compOpts true false 1000` |
| `compInfo`                               | Get current compiler configuration                     |
| `configInfo`                             | Get full configuration object                          |
| `compPath <newPath>`                     | Change build output path                               |
| `build [path]`                           | Compile contracts (default `./contracts`)              |
| `clean [path]`                           | Delete build directory (default `./build`)             |
| `flatten <path> [output]`                | Flatten a Solidity file and its imports into one file  |

Selecting contracts by name for `build` uses a quoted array: `build(path, ['Name'], output)`.

### Contract Commands

| Command                                                                   | Description                                   |
|---------------------------------------------------------------------------|-----------------------------------------------|
| `deploy <name> [args] [index] [chainURL] [abiLocation] [bytecodeLocation]` | Deploy new contract (`args` as numbers, e.g. `[1000000]`) |
| `addContract <name> <address> [index] [abiPath] [chainURL]`               | Add existing contract                         |
| `restoreContract`                                                         | Restore all stored contract proxies with the current network and default wallet |
| `removeContract [index or several indices]`                               | Remove contract records; no argument removes all; index `0` alone also removes all |
| `contracts [index, address, or name]`                                     | List contracts or get one                     |

### Shell Commands

| Command          | Description                                      |
|------------------|--------------------------------------------------|
| `where`          | Print the current directory                      |
| `cd <path>`      | Change the current directory                     |
| `ls [path]`      | List directory contents                          |
| `pushd [path]`   | Save the current directory and move to `path`    |
| `popd`           | Return to the most recently saved directory      |
| `exit`           | Close EtherShell                                 |

<a id="setup-for-development"></a>

## 🛠️ Setup for Development

### Prerequisites

- Node.js 16+
- npm or yarn
- Basic Solidity knowledge

### Project Structure

```text
ethershell/
├── bin/
│   └── cli.js                  # REPL entry point and command registration
├── src/
│   ├── services/
│   │   ├── build.js            # Compiler management, build orchestration, flatten
│   │   ├── wallet.js           # Wallet management (accounts, HD, node-managed)
│   │   ├── network.js          # Network provider configuration
│   │   ├── addContracts.js     # Deployment, contract registration, restore, removal
│   │   ├── contracts.js        # Contract lookup helper
│   │   ├── configSync.js       # In‑memory <-> config.json synchronization
│   │   ├── directory.js        # where, cd, ls, pushd, popd
│   │   └── files.js            # File system utilities (clean build)
│   └── utils/
│       ├── builder.js          # Low‑level solc Standard JSON compiler wrapper
│       ├── commandParser.js    # Rewrites typed commands into JavaScript calls
│       ├── dir.js              # Directory & import resolution utilities
│       ├── accounter.js        # Account storage and deletion utilities
│       ├── contractProxy.js    # Contract proxy wrapper with tx options
│       ├── contractLister.js   # Contracts registry and balance formatting
│       ├── contractStorage.js  # contracts.json and wallet2contract.json storage
│       ├── event.js            # Decode events from transaction receipts
│       ├── typeGenerator.js    # TypeScript type generation from ABIs
│       ├── replHelper.js       # REPL customization & async eval
│       ├── serialize.js        # BigInt serialization for JSON
│       └── configFileUpdate.js # Helper to update provider in config.json
├── contracts/                  # Your Solidity contracts
├── build/                      # Compiled artifacts and types (output)
├── ethershell/                 # Persistent config, wallets, contract records
└── package.json
```

`./ethershell` contains `config.json`, `wallets.json`, `contracts.json`, `wallet2contract.json`, and `build.json`, described in [Persistent Storage](#persistent-storage).

## 📚 Example Contracts

### Simple ERC20‑Style Token

You can keep the existing sample token or plug in OpenZeppelin contracts; EtherShell will handle `@openzeppelin/...` imports as long as they are installed in `node_modules`.

### Deployment Example

```javascript
// 1. Compile
EtherShell> build ./contracts/MyToken.sol

// 2. Deploy
EtherShell> deploy MyToken

// 3. Interact
EtherShell> MyToken.balanceOf('0x...')

// 4. Transfer
EtherShell> MyToken.transfer('0x...', 100)
```

<a id="configuration"></a>

## ⚙️ Configuration

### Persistent Storage

EtherShell stores runtime data under the `./ethershell` directory in your project root.

```text
ethershell/
├── config.json              # Network endpoint, default wallet, and compiler settings
├── wallets.json             # Imported/generated/HD/node-managed wallets
├── contracts.json           # Registered contracts and metadata
├── wallet2contract.json     # Contracts recorded per wallet (used by depContOf)
└── build.json               # ABI and bytecode paths per compiled contract
```

Configuration is updated automatically as you change network, compiler options, default wallet, deploy contracts, or add existing contracts. At startup EtherShell reloads the network endpoint, default wallet, wallets, and contract records; compiler settings return to their defaults (see [Configure Compiler](#configure-compiler)).

### Configuration File Example

```json
{
  "providerEndpoint": "http://127.0.0.1:8545",
  "defaultWallet": {
    "index": 0,
    "address": "0x...",
    "privateKey": "0x...",
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

The default wallet entry is a copy of the wallet record, so `config.json` can contain a private key.

## 🔒 Security Warnings

⚠️ **IMPORTANT SECURITY NOTES:**

1. Never use generated accounts on mainnet – they are for development and testing only.
2. Keep private keys secret – `wallets.json` and `config.json` store private keys (and HD mnemonics) in plain text, so do not commit them.
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

**Issue: `SyntaxError` after typing a command**

- A line that contains `(` or `=` is run as plain JavaScript instead of as a shell command, so a URL such as `?key=abc` cannot be typed after `chain`. Write it as a call: `chain('https://rpc.example/?key=abc')`.
- Quoted arguments, arrays of strings, and paths that contain spaces cannot be typed in the command form. Write those commands as calls with parentheses, for example `addHDWallet('word word ...', 5)`.
- Contract methods are not shell commands. Write `MyToken.name()`, not `MyToken.name`.
- Do not type `await`; the shell awaits Promise results itself, and the keyword causes a `SyntaxError`.

**Issue: `Cannot connect to network`**

- Check the RPC URL passed to `chain`.
- Verify the network (Hardhat, Ganache, etc.) is running.
- For public RPCs, check your internet connection and provider limits.

**Issue: `Insufficient balance for gas`**

- Ensure the selected wallet has enough ETH for gas.
- Use testnet faucets when working on Sepolia or other testnets.

**Issue: `Contract not found in build artifacts`**

- Run `build` first.
- Check that contract names match exactly.
- Verify `.sol` files exist under `./contracts`.

**Issue: stored contract variables are unavailable after restarting EtherShell**

- Start EtherShell from the same project root so it loads the correct `./ethershell/contracts.json`.
- Confirm the correct network with `chainInfo` and select a wallet with a private key using `changeDefWallet <index>`.
- Run `restoreContract` before calling stored contracts by name.
- If restoration fails, check that the saved ABI paths still point to readable, valid ABI JSON files and that the RPC endpoint is reachable. After fixing an ABI path in `contracts.json`, restart EtherShell before retrying.
- If a local development chain was reset, restoring proxies does not bring back its deployed code or state; redeploy the contracts and use the new addresses.

**Issue: errors about `./ethershell/...` files after using `cd`**

- EtherShell reads and writes its data relative to the current directory. Return to the project root with `popd` (or `cd`) before running `build`, `deploy`, wallet, or contract commands.

**Issue: `TypeScript types not generated`**

- Ensure compilation succeeded.
- Confirm ABI files exist under `build/abis`.
- Check console output for errors thrown by `generateAllTypes()`.

**Issue: error about `{ from }` with node‑managed account**

- Node‑managed accounts do not have private keys in EtherShell, so `{ from }` cannot rebind them.
- Import or generate a wallet with a private key and use that address in `from` instead.

## 📖 API Documentation

The source code uses detailed JSDoc comments:

- `@fileoverview` – file purpose and module description
- `@param` – parameter types and descriptions
- `@returns` – return types
- `@throws` – error conditions
- `@example` – usage samples

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
5. Open a Pull Request.

## 📄 License

This project is licensed under the BUSL‑1.1 License – see the `LICENSE` file for details.

## 💬 Support & Community

- Issues: GitHub Issues
- Questions: GitHub Discussions
- Docs: This README and `ethershell-website.html`

---

**Made with ❤️ for Ethereum developers.**

Happy hacking! 🚀
