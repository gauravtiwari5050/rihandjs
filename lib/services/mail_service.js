/**
 * Mail Service
 */
class MailService extends require('./service').Service {
  requiredServices() {
    return ['asset_pipeline', 'view'];
  }
  initialize(options, callback) {
    return callback(null);
  }
  start(options, callback) {
    return callback(null);
  }
}

module.exports.MailService = MailService;
