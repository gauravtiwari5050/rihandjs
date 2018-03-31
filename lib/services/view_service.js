const formic = require('formic');
/**
 * ViewService
 */
class ViewService extends require('./service').Service {
  async initialize() {
    this.locals = {};
    this.locals.formFor = () => new formic.FormFor();
  }
}

module.exports.ViewService = ViewService;
