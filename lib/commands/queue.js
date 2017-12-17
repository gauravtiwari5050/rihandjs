class Queue extends require('./service').Service {
  constructor(options) {
    super(options);
    this.serviceName = 'queue';
  }
}

module.exports.Queue = Queue;
