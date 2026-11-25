/**
 * Converts bare REPL commands such as:
 *   build ./contracts MyToken
 * into JavaScript calls such as:
 *   build('./contracts', 'MyToken')
 */

const JS_LITERAL_RE =
  /^(?:-?\d+(?:\.\d+)?|true|false|null|undefined)$/;

function splitArgs(input) {
  const args = [];
  let current = '';
  let quote = null;
  let depth = 0;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (quote) {
      current += char; // keep the closing quote too
      if (char === quote && input[i - 1] !== '\\') {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }

    if (char === '[' || char === '(' || char === '{') {
      depth++;
      current += char;
      continue;
    }

    if (char === ']' || char === ')' || char === '}') {
      depth--;
      current += char;
      continue;
    }

    if (/\s/.test(char) && depth === 0) {
      if (current) {
        args.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (current) args.push(current);
  return args;
}

function toJsValue(token) {
  if (JS_LITERAL_RE.test(token)) {
    return token;
  }

  // Preserve explicitly written JS values: strings, arrays, objects.
  if (
    (token.startsWith('"') && token.endsWith('"')) ||
    (token.startsWith("'") && token.endsWith("'")) ||
    token.startsWith('[') ||
    token.startsWith('{')
  ) {
    return token;
  }

  // Treat everything else as a string, including paths and addresses.
  return JSON.stringify(token);
}

export function transformBareCommand(input, context) {
  const trimmed = input.trim().replace(/;$/, '');

  if (!trimmed) return input;

  // Already a JavaScript expression/call/assignment/member access, e.g.
  //   addHD("...")   x = 5   contract.method()
  // Only look at what directly follows the first word, so parentheses or
  // '=' inside a quoted argument do not disable the bare-command syntax.
  if (/^[A-Za-z_$][\w$]*(?:\s*[(=]|[.\[]|\s*(?:\+\+|--))/.test(trimmed)) {
    return input;
  }

  const match = trimmed.match(/^([A-Za-z_$][\w$]*)(?:\s+([\s\S]*))?$/);

  if (!match) return input;

  const commandName = match[1];
  const command = context[commandName];

  // Only transform registered shell commands, not contract instances.
  if (typeof command !== 'function') {
    return input;
  }

  const rawArgs = match[2] ? splitArgs(match[2]) : [];
  const MULTI_INDEX_COMMANDS = new Set(['removeContract', 'removeWallet']);

  if (
    MULTI_INDEX_COMMANDS.has(commandName) &&
    rawArgs.length > 1 &&
    rawArgs.every((arg) => /^\d+$/.test(arg))
  ) {
    return `${commandName}([${rawArgs.join(', ')}])`;
  }
  const jsArgs = rawArgs.map(toJsValue);

  return `${commandName}(${jsArgs.join(', ')})`;
}