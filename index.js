const repl = require('repl');
const network = require('./services/network');

const r = repl.start({
    prompt: 'iConsole > ',
    ignoreUndefined: true
})

r.context.setNetwork = network.set;

r.context.getNetwork = network.get;

r.context.defaultNetwork = network.getDefault;
