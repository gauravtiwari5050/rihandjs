class Service extends require('./command').Command {
  constructor(options) {
    super(options);
    this.serviceName = null;
  }
  run(callback) {
    this.application.start(this.serviceName, callback);
  }
}

module.exports.Service = Service;
