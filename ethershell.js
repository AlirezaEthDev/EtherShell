import repl from 'repl';
import { set, get, getDefault } from './services/network.js';
import { updateCompiler, currentCompiler, compile } from './services/build.js';

// Start
const r = repl.start({
    prompt: 'EtherShell > ',
    ignoreUndefined: true
})

// Network
r.context.setNetwork = set;

r.context.getNetwork = get;

r.context.defaultNetwork = getDefault;

// Build
r.context.compilerVersion = currentCompiler;

r.context.setCompiler = updateCompiler;

r.context.compile = compile;
