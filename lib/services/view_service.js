/**
 * ViewService
 */
class ViewService extends require('./service').Service {
  initialize(options, callback) {
    this.locals = {};
    callback(null);
  }

  start(options, callback) {
    callback(null);
  }
}

module.exports.ViewService = ViewService;
