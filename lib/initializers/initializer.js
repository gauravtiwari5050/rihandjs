class Initializer {
  constructor(options) {
    this.application = options.application;
  }
  async run() {
    throw new Error('Not Implemented');
  }
  priority() {
    return 0;
  }
}

module.exports.Initializer = Initializer;

