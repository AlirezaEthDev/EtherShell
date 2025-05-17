const repl = require('repl');
const network = require('./services/network');
const build = require('./services/build');
const solc = require('solc');

// Start
const r = repl.start({
    prompt: 'iConsole > ',
    ignoreUndefined: true
})

// Network
r.context.setNetwork = network.set;

r.context.getNetwork = network.get;

r.context.defaultNetwork = network.getDefault;

// Build
r.context.compilerVersion = build.currentCompiler;

r.context.setCompiler = build.updateCompiler;

r.context.compile = build.compile;
