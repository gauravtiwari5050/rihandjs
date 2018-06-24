const _ = require('lodash');
const { File } = require('../utils/file');
/**
 * Mail Service
 */
class MailService extends require('./service').Service {
  requiredServices() {
    return ['asset_pipeline', 'view'];
  }
  async initialize() {
    this.interceptors = [];
    const scheduleSubdirectories = ['app/mail/interceptors'];
    for (const scheduleSubdirectory of scheduleSubdirectories) {
      const klasses = await File.validClassesFromDirectory(`${this.application.root()}/${scheduleSubdirectory}`);
      for (const Klass of klasses) {
        this.interceptors.push(Klass);
      }
    }
    this.interceptors = _.sortBy(this.interceptors, (interceptor) => {
      return interceptor.priority();
    });
    return null;
  }
}

module.exports.MailService = MailService;
