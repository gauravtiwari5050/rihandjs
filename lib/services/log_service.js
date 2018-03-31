const { Logger } = require('../logging/log');

class LogService extends require('./service').Service {
  async initialize(options) { // eslint-disable-line
    const self = this;
    Logger.initialize({
      application: self.application,
    });
  }
}

module.exports.LogService = LogService;
