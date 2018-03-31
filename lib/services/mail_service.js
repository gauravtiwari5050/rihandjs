/**
 * Mail Service
 */
class MailService extends require('./service').Service {
  requiredServices() {
    return ['asset_pipeline', 'view'];
  }
  async initialize() {
    return null;
  }
}

module.exports.MailService = MailService;
