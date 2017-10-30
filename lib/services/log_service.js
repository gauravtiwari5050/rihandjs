const { Logger } = require('../logging/log');

class LogService extends require('./service').Service {
  initialize(options, callback) { // eslint-disable-line
    const self = this;
    Logger.initialize({
      application: self.application,
    });
    callback(null);
  }

  start(options, callback) { // eslint-disable-line
    return callback(null);
  }
}

module.exports.LogService = LogService;
