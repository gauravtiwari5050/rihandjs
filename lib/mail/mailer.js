const winston = require('winston');
const _ = require('lodash');

class Log {
  logLevel() {
    const environment = this.application.configuration.environment();
    const logLevel = this.application.configuration.value('log_level')
      || this.application.configuration.value('logLevel');
    return (environment === 'development' ? 'debug' : (logLevel || 'info'));
  }
  logTransports() {
    const transports = [];
    const environment = this.application.configuration.environment();
    const useStdOut = !_.isNil(this.application.configuration.value('stdout'));
    if (environment === 'development' || useStdOut) {
      transports.push(new (winston.transports.Console)({ timestamp: true }));
    }
    if (environment !== 'test' && useStdOut === false) {
      transports.push(new (winston.transports.File)({
        filename: `${this.application.root()}/log/${environment}.log`,
        timestamp: true,
        json: false
      }));
    }
    return transports;
  }

  initialize(options) {
    this.application = options.application;
    this.logger = new winston.Logger({
      level: this.logLevel(),
      transports: this.logTransports(),
    });
    this.ready = true;
  }

  log(...args) {
    if (!(this.ready === true)) {
      return;
    }
    this.logger.info(...args);
  }
  info(...args) {
    if (!(this.ready === true)) {
      return;
    }
    this.logger.info(...args);
  }
  debug(...args) {
    if (!(this.ready === true)) {
      return;
    }
    this.logger.debug(...args);
  }
  error(...args) {
    if (!(this.ready === true)) {
      return;
    }
    this.logger.error(...args);
  }
  warn(...args) {
    if (!(this.ready === true)) {
      return;
    }
    this.logger.warn(...args);
  }
}

Log.instance = null;

Log.getInstance = function(){ // eslint-disable-line
  if (Log.instance === null) {
    Log.instance = new Log();
  }
  return Log.instance;
};

module.exports.Log = Log;
module.exports.Logger = Log.getInstance();
