class Cron extends require('./service').Service {
  constructor(options) {
    super(options);
    this.serviceName = 'cron';
  }
}

module.exports.Cron = Cron;
