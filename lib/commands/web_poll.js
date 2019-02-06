class WebPoll extends require('./service').Service {
  async run() {
    await this.application.prepareService('web');
    await this.application.prepareService('poll');
    await Promise.all([
      this.application.startService('poll'),
      this.application.startService('web'),
    ]);
  }
}

module.exports.WebPoll = WebPoll;
