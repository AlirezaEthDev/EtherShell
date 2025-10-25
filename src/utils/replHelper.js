import vm from 'vm';

// Custom async eval function
export async function customEval(cmd, context, filename, callback) {
  try {
    // Use vm to evaluate the command
    const script = new vm.Script(cmd, {
      filename: filename,
      displayErrors: false
    });
    
    let result = script.runInContext(context, {
      displayErrors: false,
      breakOnSigint: true
    });
    
    // If result is a Promise, await it
    if (result && typeof result.then === 'function') {
      result = await result;
    }
    
    callback(null, result);
  } catch (err) {
    callback(err);
  }
}
