export function createMockLogger() {
  const logs = [];
  const log = (level, scope, message, meta) => logs.push({ level, scope, message, meta });
  return {
    info: (s, m, meta) => log('info', s, m, meta),
    warn: (s, m, meta) => log('warn', s, m, meta),
    error: (s, m, meta) => log('error', s, m, meta),
    fatal: (s, m, meta) => log('fatal', s, m, meta),
    debug: (s, m, meta) => log('debug', s, m, meta),
    setLevel() {},
    getLogs: () => [...logs],
    clear: () => { logs.length = 0; },
  };
}
