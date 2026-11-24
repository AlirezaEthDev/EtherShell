#!/usr/bin/env node

/**
 * @fileoverview EtherShell - Interactive CLI for Ethereum smart contract development
 * @description Main entry point for the EtherShell REPL environment that provides
 * an interactive command-line interface for compiling, deploying, and managing
 * Ethereum smart contracts and wallets.
 * @module cli
 */

import repl from 'repl';
import util from 'util';
import { customEval } from '../src/utils/replHelper.js';
import { transformBareCommand } from '../src/utils/commandParser.js';
import { 
    updateCompiler,
    currentCompiler,
    compilerOptions,
    getCompilerOptions,
    compile,
    changeCompPath,
    flatten
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
    getWalletInfo,
    changeDefaultAccount,
    contractOf
    } from '../src/services/wallet.js';

import { deploy, addContract, restoreContract, deleteContract } from '../src/services/addContracts.js';
import { getContracts } from '../src/services/contracts.js';
import { getConfigInfo, getDefaultAccount } from '../src/services/configSync.js';
import {
    changeDir,
    currentDir,
    listDir,
    pushd,
    popd
} from '../src/services/directory.js';


/**
 * REPL instance for EtherShell interactive environment
 * @type {repl.REPLServer}
 * @description Creates and configures the REPL server with custom evaluation
 * and output formatting
 */
export const r = repl.start({
    prompt: 'EtherShell> ',
    ignoreUndefined: true,
    eval: (input, replContext, filename, callback) => {
        const transformedInput = transformBareCommand(input, r.context);
        customEval(transformedInput, replContext, filename, callback);
    },
    writer: output => {
        return util.inspect(output, { colors: true, depth: null });
    }
});

// Network commands
r.context.chain = set;
r.context.chainInfo = get;
r.context.defaultChain = getDefault;

// Compile commands
r.context.compiler = currentCompiler;
r.context.compUpdate = updateCompiler;
r.context.compInfo = getCompilerOptions;
r.context.compOpts = compilerOptions;
r.context.compPath = changeCompPath;
r.context.build = compile;
r.context.flatten = flatten;

// Config commands
r.context.configInfo = getConfigInfo;
r.context.changeDefWallet = changeDefaultAccount;
r.context.defWallet = getDefaultAccount;

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
r.context.walletInfo = getWalletInfo;
r.context.depContOf = contractOf;

// Add contract
r.context.deploy = deploy;
r.context.addContract = addContract;

// Contract
r.context.contracts = getContracts;
r.context.restoreContract = restoreContract;
r.context.removeContract = deleteContract;

// Directory
r.context.where = currentDir;
r.context.cd = changeDir;
r.context.ls = listDir;
r.context.pushd = pushd;
r.context.popd = popd;

// Exit EtherShell
r.context.exit = () => {
    console.log(`Goodbye \u{1F44B}`);
    r.close();
}