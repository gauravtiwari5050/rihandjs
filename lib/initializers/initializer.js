class Initializer {
  constructor(options) {
    this.application = options.application;
  }
  run(callback) {
    callback('Not Implemented');
  }
  priority() {
    return 0;
  }
}

module.exports.Initializer = Initializer;

