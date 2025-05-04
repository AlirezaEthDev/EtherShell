const repl = require('repl');
const network = require('./services/network');
const build = require('./services/build');
const solc = require('solc');

const r = repl.start({
    prompt: 'iConsole > ',
    ignoreUndefined: true
})

r.context.setNetwork = network.set;

r.context.getNetwork = network.get;

r.context.defaultNetwork = network.getDefault;

r.context.compilerVersion = () => build.currentCompiler().version();

r.context.setCompiler = (version) => {
    build.setVersion(version)
      .catch(err => console.error(err));
  };

r.context.compile = build.compile;
