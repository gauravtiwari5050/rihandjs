class Interceptor {
  constructor(options) {
    this.application = options.application;
  }
  async run(message) {
    return true;
  }
  async active() {
    return true;
  }
  static priority() {
    return 0;
  }
}

module.exports.Interceptor = Interceptor;

