// utils/logger.ts - central logger wrapper
const isProd = process.env.NODE_ENV === 'production';

function debug(...args: any[]) {
  if (!isProd && typeof console !== 'undefined' && console.debug) {
    console.debug(...args);
  }
}

function info(...args: any[]) {
  if (typeof console !== 'undefined' && console.info) {
    console.info(...args);
  }
}

function warn(...args: any[]) {
  if (typeof console !== 'undefined' && console.warn) {
    console.warn(...args);
  }
}

function error(...args: any[]) {
  if (typeof console !== 'undefined' && console.error) {
    console.error(...args);
  }
}

const logger = { debug, info, warn, error };

export default logger;
export { debug, info, warn, error };
