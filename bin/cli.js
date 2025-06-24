#!/usr/bin/env node

import repl from 'repl';
import { updateCompiler, currentCompiler, compile } from '../src/services/build.js';
import { set, get, getDefault } from '../src/services/network.js';

const r = repl.start({
    prompt: 'EtherShell> ',
    ignoreUndefined: true
});

// Network commands
r.context.setChain = set;
r.context.chain = get;
r.context.defaultChain = getDefault;

// Compile commands
r.context.compilerVersion = currentCompiler;
r.context.setCompiler = updateCompiler;
r.context.compile = compile;