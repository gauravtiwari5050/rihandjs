class WebQueue extends require('./service').Service {
  async run() {
    await this.application.prepareService('web');
    await this.application.prepareService('queue');
    await Promise.all([
      this.application.startService('queue'),
      this.application.startService('web'),
    ]);
  }
}

module.exports.WebQueue = WebQueue;
