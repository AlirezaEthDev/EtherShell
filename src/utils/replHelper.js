/**
 * @fileoverview Custom REPL evaluation utilities
 * @description Provides custom async evaluation function for the Node.js REPL,
 * enabling await syntax in the interactive shell without async wrapper functions.
 * @module replHelper
 */

import vm from 'vm';

/**
 * Custom async evaluation function for REPL
 * @async
 * @param {string} cmd - Command to evaluate
 * @param {Object} context - REPL context object
 * @param {string} filename - Filename for error reporting
 * @param {Function} callback - Callback function(err, result)
 * @returns {Promise<void>}
 * @description Evaluates commands in REPL context and automatically awaits Promise results
 * @example
 * // Used internally by REPL to enable top-level await
 * customEval('await provider.getBlockNumber()', context, 'repl', callback);
 */
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
