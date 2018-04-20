/**
 * ViewService
 */
class ViewService extends require('./service').Service {
  async initialize() {
    this.locals = {};
  }
}

module.exports.ViewService = ViewService;
