/**
 * Mock Logger for unit tests.
 * Records all log calls for assertion.
 */
export function createMockLogger() {
  const logs = [];
  const log = (level, scope, message, meta) => {
    logs.push({ level, scope, message, meta });
  };

  return {
    info: (scope, msg, meta) => log('info', scope, msg, meta),
    warn: (scope, msg, meta) => log('warn', scope, msg, meta),
    error: (scope, msg, meta) => log('error', scope, msg, meta),
    fatal: (scope, msg, meta) => log('fatal', scope, msg, meta),
    debug: (scope, msg, meta) => log('debug', scope, msg, meta),
    setLevel() {},
    getLogs: () => [...logs],
    clear: () => { logs.length = 0; },
  };
} 
