class Runner {
  constructor(options) {
    this.application = options.application;
  }

  async run() {
    throw new Error('Not implemented');
  }
}

module.exports.Runner = Runner;
