#!/usr/bin/env node

import repl from 'repl';
import util from 'util';
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

import { deploy, add } from '../src/services/addContracts.js';
import { getContracts } from '../src/services/contracts.js';

export const r = repl.start({
    prompt: 'EtherShell> ',
    ignoreUndefined: true,
    // Custom writer: intercept Promise results
    writer: output => {
        // If it's a Promise, await and print its resolution
        if (output && typeof output.then === 'function') {
        output
            .then(resolved => console.log(resolved))
            .catch(err => console.error(err));
        // Return empty string so REPL prompt isn't preceded by undefined
        return '';
        }
        // Fallback to the default util.inspect for other types
        return util.inspect(output, { colors: true, depth: null });
    }
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
r.context.build = compile;

// Clean build folder
r.context.clean = deleteDirectory;

// Set wallet
r.context.addWallet = addAccounts;
r.context.addHDWallet = addHD;
r.context.newWallet = createAccounts;
r.context.newHDWallet = createHD;
r.context.removeWallet = deleteAccount;
r.context.connectWallet = connectWallet;

// View wallets
r.context.wallets = getAccounts;
r.context.allWallets = getAllAccounts;
r.context.hdWallets = getHDAccounts;
r.context.walletInfo = getWalletInfo

// Add contract
r.context.deploy = deploy;
r.context.addContract = add;

// Contract
r.context.contracts = getContracts;
