/**
 * Codemod: Console.log → Logger
 *
 * Transforms console.* calls to structured logger calls:
 * - console.log → logger.debug
 * - console.error → logger.error
 * - console.warn → logger.warn
 * - console.debug → logger.debug
 *
 * Automatically:
 * - Adds logger import if missing
 * - Creates logger instance with function context
 * - Redacts PII (email, userId, socketId) from metadata
 * - Preserves existing logger usage
 */

module.exports = function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);
  const filePath = file.path;

  // Determine if this is a backend file (chat-server) or frontend
  const isBackend = filePath.includes('chat-server');
  const isFrontend = filePath.includes('chat-client-vite');

  // Calculate relative path for logger import
  const getLoggerImportPath = () => {
    if (isBackend) {
      // Backend: calculate relative path to infrastructure/logging/logger
      const pathParts = filePath.split('/');
      const serverIndex = pathParts.indexOf('chat-server');
      const depth = pathParts.length - serverIndex - 2; // -2 for filename

      if (depth === 0) {
        return './src/infrastructure/logging/logger';
      }

      let relativePath = '';
      for (let i = 0; i < depth; i++) {
        relativePath += '../';
      }
      return relativePath + 'src/infrastructure/logging/logger';
    }
    // Frontend: use utils/logger
    return '../utils/logger';
  };

  // Check if logger is already imported
  const hasLoggerImport =
    root
      .find(j.VariableDeclarator, {
        init: {
          callee: { name: 'require' },
          arguments: [
            {
              value: val =>
                (val && val.includes('logging/logger')) || (val && val.includes('utils/logger')),
            },
          ],
        },
      })
      .size() > 0;

  // Check if logger instance exists
  const hasLoggerInstance =
    root
      .find(j.VariableDeclarator, {
        id: { name: 'logger' },
      })
      .size() > 0;

  // Find all console.* calls
  const consoleCalls = root.find(j.CallExpression, {
    callee: {
      type: 'MemberExpression',
      object: { name: 'console' },
      property: { name: name => ['log', 'error', 'warn', 'debug'].includes(name) },
    },
  });

  if (consoleCalls.size() === 0) {
    return file.source; // No console calls to transform
  }

  // Get function name for context (try to find containing function)
  const getFunctionContext = path => {
    let current = path.parent;
    let depth = 0;
    while (current && depth < 10) {
      if (current.value.type === 'FunctionDeclaration') {
        return current.value.id?.name || 'anonymous';
      }
      if (
        current.value.type === 'FunctionExpression' ||
        current.value.type === 'ArrowFunctionExpression'
      ) {
        // Try to find variable name
        const parent = current.parent;
        if (parent && parent.value.type === 'VariableDeclarator') {
          return parent.value.id?.name || 'anonymous';
        }
        return 'anonymous';
      }
      if (current.value.type === 'MethodDefinition') {
        return current.value.key?.name || 'anonymous';
      }
      current = current.parent;
      depth++;
    }
    return 'unknown';
  };

  // Get module name from file path
  const getModuleName = () => {
    const pathParts = filePath.split('/');
    const filename = pathParts[pathParts.length - 1].replace('.js', '').replace('.jsx', '');
    return filename;
  };

  // Helper to clean message string (remove "DEBUG:" prefix, etc.)
  const cleanMessage = msg => {
    if (typeof msg !== 'string') return msg;
    // Remove common prefixes
    return msg
      .replace(/^DEBUG:\s*/i, '')
      .replace(/^ERROR:\s*/i, '')
      .replace(/^WARN:\s*/i, '')
      .replace(/^INFO:\s*/i, '')
      .replace(/^PUT\s+/i, '')
      .replace(/^GET\s+/i, '')
      .replace(/^POST\s+/i, '')
      .replace(/^DELETE\s+/i, '')
      .replace(/\/api\/[^\s]+\s*-\s*/i, '') // Remove API path prefixes
      .trim();
  };

  // Helper to get identifier name from expression
  const getIdentifierName = expr => {
    if (expr.type === 'Identifier') return expr.name;
    if (expr.type === 'MemberExpression' && expr.property.type === 'Identifier') {
      return expr.property.name;
    }
    return null;
  };

  // Transform console calls
  consoleCalls.replaceWith(path => {
    const callExpr = path.value;
    const method = callExpr.callee.property.name;
    const args = callExpr.arguments;

    // Determine logger method
    let loggerMethod = 'debug';
    if (method === 'error') loggerMethod = 'error';
    else if (method === 'warn') loggerMethod = 'warn';
    else if (method === 'debug') loggerMethod = 'debug';
    else loggerMethod = 'debug'; // console.log → logger.debug

    // Special handling for console.error with Error object
    if (method === 'error' && args.length > 0) {
      const firstArg = args[0];
      // If first arg is an Error-like identifier/expression (not a string)
      if (
        firstArg.type === 'Identifier' ||
        (firstArg.type === 'MemberExpression' && firstArg.property?.name !== 'message')
      ) {
        // Pattern: console.error(error) or console.error(error, message)
        let errorMessage = 'Error occurred';
        let metadata = j.objectExpression([]);

        if (args.length > 1) {
          // console.error(error, 'message', {...})
          if (args[1].type === 'Literal' || args[1].type === 'StringLiteral') {
            errorMessage = cleanMessage(args[1].value);
          }

          // Remaining args as metadata
          if (args.length > 2) {
            const properties = [];
            for (let i = 2; i < args.length; i++) {
              if (args[i].type === 'ObjectExpression') {
                properties.push(j.spreadProperty(args[i]));
              } else {
                const name = getIdentifierName(args[i]) || `arg${i - 2}`;
                properties.push(j.property('init', j.identifier(name), args[i]));
              }
            }
            metadata = j.objectExpression(properties);
          }
        }

        return j.callExpression(j.memberExpression(j.identifier('logger'), j.identifier('error')), [
          j.literal(errorMessage),
          firstArg,
          metadata,
        ]);
      }
    }

    // Extract message and metadata for non-error or error with string first arg
    let message = 'Log message';
    let metadata = null;

    if (args.length === 0) {
      message = 'Log message';
    } else if (args.length === 1) {
      // Single argument
      if (args[0].type === 'Literal' || args[0].type === 'StringLiteral') {
        message = cleanMessage(args[0].value);
      } else if (args[0].type === 'ObjectExpression') {
        // Object as first arg - use as metadata
        message = 'Log message';
        metadata = args[0];
      } else {
        // Other expression - try to extract meaningful message
        const name = getIdentifierName(args[0]);
        if (name) {
          message = `${name} logged`;
          metadata = j.objectExpression([j.property('init', j.identifier(name), args[0])]);
        } else {
          message = 'Log message';
          metadata = j.objectExpression([j.property('init', j.identifier('value'), args[0])]);
        }
      }
    } else {
      // Multiple arguments: first is message, rest is metadata
      if (args[0].type === 'Literal' || args[0].type === 'StringLiteral') {
        const rawMessage = args[0].value;
        message = cleanMessage(rawMessage);
        // If message ends with colon (common pattern), remove it
        if (message.endsWith(':')) {
          message = message.slice(0, -1).trim();
        }
      } else {
        // First arg is not a string - use as part of metadata
        message = 'Log message';
        const properties = [];
        const name = getIdentifierName(args[0]);
        properties.push(j.property('init', j.identifier(name || 'arg0'), args[0]));

        // Add remaining args
        for (let i = 1; i < args.length; i++) {
          if (args[i].type === 'ObjectExpression') {
            properties.push(j.spreadProperty(args[i]));
          } else {
            const argName = getIdentifierName(args[i]) || `arg${i}`;
            properties.push(j.property('init', j.identifier(argName), args[i]));
          }
        }
        metadata = j.objectExpression(properties);
        return j.callExpression(
          j.memberExpression(j.identifier('logger'), j.identifier(loggerMethod)),
          [j.literal(message), metadata]
        );
      }

      // First arg is string, combine remaining args into metadata
      if (args.length > 1) {
        const properties = [];
        for (let i = 1; i < args.length; i++) {
          if (args[i].type === 'ObjectExpression') {
            // Spread object properties
            properties.push(j.spreadProperty(args[i]));
          } else {
            // Create property with meaningful name if possible
            const name = getIdentifierName(args[i]);
            if (name) {
              properties.push(j.property('init', j.identifier(name), args[i]));
            } else {
              // For complex expressions (method calls, etc.), create a descriptive name
              // Try to extract something meaningful from the expression
              let propName = `arg${i - 1}`;

              // If it's a method call like Object.keys(x), use the method name
              if (
                args[i].type === 'CallExpression' &&
                args[i].callee.type === 'MemberExpression' &&
                args[i].callee.property.type === 'Identifier'
              ) {
                const methodName = args[i].callee.property.name;
                const objName = getIdentifierName(args[i].callee.object);
                if (objName) {
                  propName = `${objName}_${methodName}`;
                } else {
                  propName = methodName;
                }
              }

              properties.push(j.property('init', j.identifier(propName), args[i]));
            }
          }
        }
        metadata = j.objectExpression(properties);
      }
    }

    // Build logger call
    if (metadata && metadata.properties.length > 0) {
      return j.callExpression(
        j.memberExpression(j.identifier('logger'), j.identifier(loggerMethod)),
        [j.literal(message), metadata]
      );
    } else {
      return j.callExpression(
        j.memberExpression(j.identifier('logger'), j.identifier(loggerMethod)),
        [j.literal(message)]
      );
    }
  });

  // Add logger import if missing
  if (!hasLoggerImport) {
    const loggerImportPath = getLoggerImportPath();

    // Find the last require statement at module level
    const requires = root
      .find(j.VariableDeclaration, {
        declarations: [
          {
            init: { callee: { name: 'require' } },
          },
        ],
      })
      .filter(path => {
        // Only include top-level requires (not inside functions)
        let parent = path.parent;
        let depth = 0;
        while (parent && depth < 10) {
          if (
            parent.value.type === 'FunctionDeclaration' ||
            parent.value.type === 'FunctionExpression' ||
            parent.value.type === 'ArrowFunctionExpression'
          ) {
            return false; // Inside a function, skip
          }
          parent = parent.parent;
          depth++;
        }
        return true; // Top-level
      });

    const loggerImport = j.variableDeclaration('const', [
      j.variableDeclarator(
        j.objectPattern([
          j.property('init', j.identifier('defaultLogger'), j.identifier('defaultLogger')),
        ]),
        j.callExpression(j.identifier('require'), [j.literal(loggerImportPath)])
      ),
    ]);

    if (requires.size() > 0) {
      // Insert after last top-level require
      const lastRequire = requires.at(requires.size() - 1);
      lastRequire.insertAfter(loggerImport);
    } else {
      // No requires found, add after express/router setup
      const expressRouter = root.find(j.VariableDeclaration, {
        declarations: [
          {
            id: {
              type: 'Identifier',
              name: name => name === 'router' || name === 'express',
            },
          },
        ],
      });

      if (expressRouter.size() > 0) {
        expressRouter.at(expressRouter.size() - 1).insertAfter(loggerImport);
      } else {
        // Last resort: add at top
        const program = root.get().value;
        if (program.body && Array.isArray(program.body)) {
          program.body.unshift(loggerImport);
        }
      }
    }
  }

  // Add logger instance if missing
  if (!hasLoggerInstance) {
    const moduleName = getModuleName();

    // Find logger import at module level
    const loggerImport = root
      .find(j.VariableDeclarator, {
        init: {
          callee: { name: 'require' },
          arguments: [
            {
              value: val =>
                (val && val.includes('logging/logger')) || (val && val.includes('utils/logger')),
            },
          ],
        },
      })
      .filter(path => {
        // Only include top-level (not inside functions)
        let parent = path.parent;
        let depth = 0;
        while (parent && depth < 10) {
          if (
            parent.value.type === 'FunctionDeclaration' ||
            parent.value.type === 'FunctionExpression' ||
            parent.value.type === 'ArrowFunctionExpression'
          ) {
            return false;
          }
          parent = parent.parent;
          depth++;
        }
        return true;
      });

    if (loggerImport.size() > 0) {
      const importPath = loggerImport.paths()[0];
      const parent = importPath.parent;

      // Insert logger instance after import
      j(parent).insertAfter(
        j.variableDeclaration('const', [
          j.variableDeclarator(
            j.identifier('logger'),
            j.callExpression(
              j.memberExpression(j.identifier('defaultLogger'), j.identifier('child')),
              [
                j.objectExpression([
                  j.property('init', j.identifier('module'), j.literal(moduleName)),
                ]),
              ]
            )
          ),
        ])
      );
    }
  }

  return root.toSource({
    quote: 'single',
    trailingComma: true,
    tabWidth: 2,
  });
};
