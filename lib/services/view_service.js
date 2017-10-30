const formic = require('formic');
/**
 * ViewService
 */
class ViewService extends require('./service').Service {
  initialize(options, callback) {
    this.locals = {};
    this.locals.formFor = () => new formic.FormFor();
    callback(null);
  }

  start(options, callback) {
    callback(null);
  }
}

module.exports.ViewService = ViewService;
