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

- **Interactive REPL Shell** - Built-in async support for all commands with custom evaluation
- **Solidity Compilation** - Compile contracts with configurable optimization and viaIR mode
- **Smart Contract Deployment** - Deploy contracts to any EVM network
- **Wallet Management** - Create, import, and manage wallets (regular & HD wallets, node-managed accounts)
- **Multi-Network Support** - Switch between different blockchain networks with persistent configuration
- **Contract Proxy Wrapper** - Enhanced contract interaction with flexible transaction options (from, value, gasLimit, maxFeePerGas, etc.)
- **Contract Interactions** - Call contract methods with advanced options directly from the shell
- **ABI & Bytecode Generation** - Organized artifact output with metadata
- **Node Signer Integration** - Connect to node-managed accounts (Ganache, Hardhat)
- **TypeScript Code Generation** - Auto-generate TypeScript types from contract ABIs
- **Gas Optimization** - Configure compiler optimization levels and viaIR code generation
- **Persistent Configuration** - Save and restore network, compiler, and wallet settings
- **Comprehensive JSDoc** - Full IDE autocomplete and type hints

## 🚀 Quick Start

### Installation

```bash
# Install globally:
npm i -g ethershell

# Start EtherShell:
ethershell 

#or

npx ethershell
```

### Basic Usage

```bash
# Start the console
ethershell

# You should see:
# EtherShell>
```

## 📖 Step-by-Step Guide

### 1. Network Configuration

First, connect to a blockchain network:

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
[...]
```

#### Connect to Node-Managed Accounts

```javascript
// For Ganache, Hardhat, or other nodes with unlocked accounts
EtherShell> connectWallet()

// This adds accounts managed by the node (e.g., Ganache default accounts)
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
EtherShell> walletInfo([0, 1, 2])

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
EtherShell> removeWallet([0, 2, 4])

// Delete all wallets
EtherShell> removeWallet()
```

### 3. Solidity Compilation

#### Configure Compiler

```javascript
// View current compiler version
EtherShell> compiler()
"0.8.20+commit.a1b79de6.Emscripten.clang"

// Switch to a different Solidity version
EtherShell> compUpdate('v0.8.19+commit.7dd6d404')
Loaded solc version: 0.8.19+commit.7dd6d404.Emscripten.clang

// Configure compilation options (gasOptimizer, viaIR, optimizerRuns)
EtherShell> compOpts(true, false, 1000)
✓ Compiler options updated:
 Gas Optimizer: Enabled
 Optimizer Runs: 1000
 ViaIR: Disabled

// Get current options
EtherShell> compInfo()
{ optimizer: true, optimizerRuns: 1000, viaIR: false }

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

#### Compile Contracts

```javascript
// Compile all .sol files in ./contracts directory
EtherShell> build()
Contracts compiled into /path/to/build
TypeScript types generated in /path/to/build/types

// Compile a specific contract file
EtherShell> build('./contracts/MyToken.sol')
Contract compiled into /path/to/build

// Compile specific contracts from a file
EtherShell> build('./contracts/MyToken.sol', ['MyToken', 'OtherContract'], './custom-build')
Contracts compiled into /path/to/custom-build

// Clean build directory
EtherShell> clean()
Directory deleted successfully
```

**Compiler Output Structure:**
```
build/
├── artifacts/          # Complete contract data with metadata
├── abis/              # Contract ABIs (.abi.json files)
├── bytecode/          # Contract bytecode (.bin files)
├── metadata/          # Contract metadata (.metadata.json files)
└── types/             # Auto-generated TypeScript types
```

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
{
  hash: '0x123abc...',
  from: '0x1234...5678',
  to: null,
  address: '0xabcd...ef01',
  name: 'MyToken',
  chain: 'sepolia',
  chainId: 11155111n,
  deployType: 'ethershell-deployed'
}

// Deploy MyToken contract with constructor args and a non-default wallet
// Arguments: contractName, args[], walletIndex, [chainURL], [abiLocation], [bytecodeLocation]
EtherShell> deploy('MyToken', ['MyTokenName', 'MTK', 1000000], 0)
{
  hash: '0x123abc...',
  from: '0x1234...5678',
  to: null,
  address: '0xabcd...ef01',
  name: 'MyToken',
  chain: 'sepolia',
  chainId: 11155111n,
  deployType: 'ethershell-deployed'
}

// Deploy with custom chain
EtherShell> deploy('MyContract', ['arg1', 'arg2'], 0, 'https://custom-rpc.url')

// The deployed contract is automatically added to console context as a proxy
EtherShell> MyToken
Contract {
  target: '0xabcd...ef01',
  interface: Interface { ... },
  runner: Signer { ... },
  // ... contract methods available
}
```

#### Add Existing Contracts

```javascript
// Add an already-deployed contract
// Arguments: contractName, contractAddress, walletIndex, abiPath, [chainURL]
EtherShell> addContract('USDT', '0xdAC17F958D2ee523a2206206994597C13D831ec7', 0, './abis/USDT.json')
{
  index: 1,
  name: 'USDT',
  address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  chain: 'mainnet',
  chainId: 1n,
  deployType: 'pre-deployed'
}

// Now you can interact with it
EtherShell> USDT.balanceOf('0x1234...5678')
n
```

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

#### Call Contract Functions

```javascript
// Your deployed contracts are available as variables
EtherShell> MyToken
Contract { ... }

// Read-only functions (no gas cost)
EtherShell> MyToken.name()
"MyTokenName"

EtherShell> MyToken.totalSupply()
1000000n

// State-changing functions (costs gas, requires signer)
EtherShell> MyToken.transfer('0xRecipientAddress', 100)
ContractTransactionResponse { ... }

// Call with advanced transaction options
EtherShell> MyToken.transfer('0xRecipientAddress', 100, {
  from: '0xSenderAddress',          // Switch signer
  value: 10000000000000n,    // Send ETH (for payable functions)
  gasLimit: 500000,                 // Custom gas limit
  maxFeePerGas: 100000000000n,    // EIP-1559
  maxPriorityFeePerGas: 2000000000n,
  nonce: 42,
  chainId: 1
})

// Check balance
EtherShell> MyToken.balanceOf('0x1234...5678')
100n
```

**Contract Proxy Options:**
The contract proxy wrapper supports these transaction options:
- `from`: Change the signer/sender for the transaction
- `value`: ETH amount to send (for payable functions)
- `gasLimit` / `gas`: Maximum gas to use
- `gasPrice`: Legacy transaction gas price
- `maxFeePerGas`: EIP-1559 max fee per gas
- `maxPriorityFeePerGas`: EIP-1559 priority fee per gas
- `nonce`: Transaction nonce for ordering
- `chainId`: Network chain ID
- `accessList`: EIP-2930 access list
- `type`: Transaction type (0, 1, 2, or 3)
- `customData`: Custom data for special networks (zkSync)

## 🎯 Complete Usage Example

Here's a full workflow example:

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
1000000000000000000000000n

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
| Command | Description |
|---------|-------------|
| `chain(url)` | Connect to blockchain network |
| `chainInfo()` | Get current network info |
| `defaultChain()` | Get default network URL |

### Wallet Commands
| Command | Description |
|---------|-------------|
| `newWallet([count])` | Create random wallets |
| `addWallet(privKey\|keys)` | Import wallets from private keys |
| `newHDWallet([count])` | Create HD wallet with random mnemonic |
| `addHDWallet(phrase, count)` | Import HD wallet from mnemonic |
| `connectWallet()` | Connect to node-managed accounts |
| `wallets()` | View regular accounts |
| `hdWallets()` | View HD accounts |
| `allWallets()` | View all accounts |
| `walletInfo(index\|address\|[indices])` | Get wallet details (balance, nonce) |
| `changeDefWallet(pointer)` | Set default account |
| `removeWallet(pointer)` | Delete account(s) |

### Compiler Commands
| Command | Description |
|---------|-------------|
| `compiler()` | Get current Solidity version |
| `compUpdate(version)` | Load specific Solidity version |
| `compOpts(gasOpt, viaIR, runs)` | Configure optimization |
| `compInfo()` | Get current compiler options |
| `configInfo()` | Get all configuration info |
| `defWallet()` | Get default account |
| `compPath(newPath)` | Change build output path |
| `build([path], [contracts], [output])` | Compile contracts |
| `clean([path])` | Delete build directory |

### Contract Commands
| Command | Description |
|---------|-------------|
| `deploy(name, [args], [index], [chainURL], [abiLocation], [bytecodeLocation])` | Deploy new contract |
| `addContract(name, address, index, abiPath)` | Add existing contract |
| `contracts([pointer])` | List contracts or get specific one |

## 🛠️ Setup for Development

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Basic Solidity knowledge

### Development Setup

```bash
# Install dev dependencies
npm install --save-dev @types/node typescript

# Run in development mode
npm run dev

# Run tests (if available)
npm test
```

### Project Structure

```
ethershell/
├── bin/
│   └── cli.js                 # Entry point
├── src/
│   ├── services/
│   │   ├── build.js          # Compiler management
│   │   ├── wallet.js         # Wallet management
│   │   ├── network.js        # Network provider
│   │   ├── addContracts.js   # Contract deployment
│   │   ├── contracts.js      # Contract retrieval
│   │   ├── config.js         # Configuration
│   │   └── files.js          # File utilities
│   └── utils/
│       ├── builder.js        # Compilation engine
│       ├── dir.js            # Directory utilities
│       ├── accounter.js      # Account utilities
│       ├── contractProxy.js  # Contract proxy wrapper
│       ├── contractLister.js # Contract formatting
│       ├── typeGenerator.js  # TypeScript type generation
│       ├── replHelper.js     # REPL customization
│       ├── serialize.js      # BigInt serialization
│       └── configFileUpdate.js # Config utilities
├── contracts/                 # Your Solidity contracts
├── build/                      # Compiled artifacts
├── localStorage/              # Persistent config and wallet storage
└── package.json
```

## 📚 Example Contracts

### Simple ERC20 Token

```solidity
// contracts/MyToken.sol
pragma solidity ^0.8.20;

contract MyToken {
    string public name = "My Token";
    string public symbol = "MTK";
    uint8 public decimals = 18;
    uint256 public totalSupply = 1000000 * 10 ** uint256(decimals);
    
    mapping(address => uint256) public balanceOf;
    event Transfer(address indexed from, address indexed to, uint256 value);
    
    constructor() {
        balanceOf[msg.sender] = totalSupply;
    }
    
    function transfer(address to, uint256 value) public returns (bool) {
        require(to != address(0));
        require(balanceOf[msg.sender] >= value);
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
}
```

### Deployment Example

```javascript
// 1. Compile
EtherShell> build('./contracts/MyToken.sol')

// 2. Deploy
EtherShell> deploy('MyToken')

// 3. Interact
EtherShell> MyToken.balanceOf('0x...')
1000000000000000000000000n

// 4. Transfer
EtherShell> MyToken.transfer('0x...', 100)
```

## ⚙️ Configuration

### Persistent Storage

EtherShell stores configuration in the `localStorage` directory:

```
localStorage/
├── config.json          # Compiler and network settings
├── wallets.json         # Imported/generated wallets
```

### Configuration File

The `config.json` file contains:

```json
{
  "providerEndpoint": "http://127.0.0.1:8545",
  "defaultWallet": {
    "index": 0,
    "address": "0x...",
    "type": "user-generated"
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

### Environment Variables (Optional)

Create a `.env` file (optional):

```env
# Network
RPC_URL=http://127.0.0.1:8545

# Build
BUILD_PATH=./build

# Contracts
CONTRACTS_PATH=./contracts

# Compiler
COMPILER_VERSION=0.8.20+commit.a1b79de6
OPTIMIZER_ENABLED=true
OPTIMIZER_RUNS=200
VIAIR_ENABLED=false
```

## 🔒 Security Warnings

⚠️ **IMPORTANT SECURITY NOTES:**

1. **Never use generated accounts on mainnet** - They are only for testing
2. **Keep private keys safe** - Don't commit `.env` files or private keys to git
3. **Use read-only RPCs** - For production, use read-only endpoints
4. **Test on testnet first** - Always test contracts on Sepolia before mainnet
5. **Verify contracts on Etherscan** - Always verify production contracts

```bash
# Add to .gitignore
.env
.env.local
node_modules/
build/
localStorage/
*.log
```

## 🐛 Troubleshooting

### Common Issues

**Issue: `Error: Cannot find module 'ethers'`**
```bash
Solution: npm install
```

**Issue: `Cannot connect to network`**
```bash
- Check RPC URL is correct
- Verify network is running (Hardhat, Ganache, etc.)
- Check internet connection for public RPCs
```

**Issue: `Insufficient balance for gas`**
```bash
- Ensure wallet has enough ETH for gas
- Use testnet faucet for test ETH
- Check gas prices (sepolia is usually cheap)
```

**Issue: `Contract not found in build artifacts`**
```bash
- Run build() first
- Check contract names match exactly
- Verify .sol file exists in ./contracts
```

**Issue: `Cannot use 'from' option with node-managed account`**
```bash
- Node-managed accounts cannot be used with the 'from' option
- Only imported/generated wallets with private keys support 'from'
- Use .connect() method for node-managed accounts
```

**Issue: `TypeScript types not generated`**
```bash
- Ensure contracts compiled successfully with build()
- Check ABIs exist in build/abis/ directory
- Look for error messages in the build() output
```

## 📖 API Documentation

Full JSDoc documentation is available in the source files. Each file includes:
- @fileoverview - File purpose
- @param - Parameter types and descriptions
- @returns - Return type information
- @throws - Error documentation
- @example - Usage examples

Generate HTML docs:
```bash
npm install -g jsdoc
jsdoc src/ -r -d docs/
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the BUSL-1.1 License - see LICENSE file for details.

## 💬 Support & Community

- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Ask questions on GitHub Discussions
- **Documentation**: Check the docs/ folder

## 🎓 Learning Resources

- [Solidity Documentation](https://docs.soliditylang.org/)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Ethereum Development Guide](https://ethereum.org/en/developers/docs/)
- [Hardhat Documentation](https://hardhat.org/docs)

## 📞 Contact

- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

---

**Made with ❤️ for Ethereum developers**

Happy coding! 🚀