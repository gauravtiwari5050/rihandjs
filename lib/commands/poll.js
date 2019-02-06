class Poll extends require('./service').Service {
  constructor(options) {
    super(options);
    this.serviceName = 'poll';
  }
}

module.exports.Poll = Poll;
