const _ = require('lodash');

class MailJob extends require('./job').Job {
  constructor(options) {
    super();
    this.payload = options;
  }
  retries() {
    return 3;
  }
  async run() {
    const { MailDelivery } = require('../mail/mail');
    const mailer = new MailDelivery();
    mailer.className = this.payload.className;
    mailer.methodName = this.payload.methodName;
    mailer.methodArgs = this.payload.methodArgs;
    await mailer.deliver();
  }
}

module.exports.MailJob = MailJob;
