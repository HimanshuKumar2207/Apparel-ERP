const stamp = () => new Date().toISOString();
const quiet = process.env.NODE_ENV === 'test';
export const logger = {
  info: (...a) => !quiet && console.log(stamp(), 'INFO ', ...a),
  warn: (...a) => !quiet && console.warn(stamp(), 'WARN ', ...a),
  error: (...a) => console.error(stamp(), 'ERROR', ...a),
};
