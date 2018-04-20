const formic = require('formic');
/**
 * ViewService
 */
class ViewService extends require('./service').Service {
  async initialize() {
    this.locals = {};
    this.locals.formFor = object => new formic.FormFor(object);
  }
}

module.exports.ViewService = ViewService;
