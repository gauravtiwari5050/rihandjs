class Server extends require('./service').Service {
  constructor(options) {
    super(options);
    this.serviceName = 'web';
  }
}

module.exports.Server = Server;
