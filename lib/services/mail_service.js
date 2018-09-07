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
      const directoryPath = `${this.application.root()}/${scheduleSubdirectory}`;
      const directoryExists = await File.directoryExists(directoryPath);
      if (directoryExists === true) {
        const klasses = await File.validClassesFromDirectory();
        for (const Klass of klasses) {
          this.interceptors.push(Klass);
        }
      }
    }
    this.interceptors = _.sortBy(this.interceptors, i => i.priority());
  }
}

module.exports.MailService = MailService;
