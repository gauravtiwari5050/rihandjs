class Runner {
  constructor(options) {
    this.application = options.application;
    this.init();
  }
  init() {
  }
  async run() {
    throw new Error('Not implemented');
  }
}

module.exports.Runner = Runner;
