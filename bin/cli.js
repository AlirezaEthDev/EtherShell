#!/usr/bin/env node

import repl from 'repl';
import { 
    updateCompiler,
    currentCompiler,
    compilerOptions,
    getCompilerOptions,
    compile
} from '../src/services/build.js';
import { set, get, getDefault } from '../src/services/network.js';
import { deleteDirectory } from '../src/services/files.js';
import {
    addAccounts,
    getAccounts,
    createAccounts,
    deleteAccount,
    createHD,
    getHDAccounts,
    addHD,
    getAllAccounts,
    connectWallet,
    getWalletInfo
    } from '../src/services/wallet.js';

import { deploy } from '../src/services/deployment.js';

const r = repl.start({
    prompt: 'EtherShell> ',
    ignoreUndefined: true
});

// Network commands
r.context.setChain = set;
r.context.chain = get;
r.context.defaultChain = getDefault;

// Compile commands
r.context.version = currentCompiler;
r.context.compiler = updateCompiler;
r.context.options = getCompilerOptions;
r.context.compilerOpts = compilerOptions;
r.context.compile = compile;

// Clean build folder
r.context.clean = deleteDirectory;

// Set wallet
r.context.addWallets = addAccounts;
r.context.addHDWallets = addHD;
r.context.newWallets = createAccounts;
r.context.newHDWallets = createHD;
r.context.removeWallet = deleteAccount;
r.context.connectWallet = connectWallet;

// View wallets
r.context.wallets = getAccounts;
r.context.allWallets = getAllAccounts;
r.context.hdWallets = getHDAccounts;
r.context.walletInfo = getWalletInfo

// Deploy
r.context.deploy = deploy;