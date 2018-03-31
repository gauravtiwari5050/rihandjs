class Service extends require('./command').Command {
  constructor(options) {
    super(options);
    this.serviceName = null;
  }
  async run() {
    await this.application.start(this.serviceName);
  }
}

module.exports.Service = Service;
