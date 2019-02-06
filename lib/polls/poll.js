class Poll {
  constructor() {
    this.pollAction = 'poll';
  }
  interval() {
    return 1 * 1000; // default poll at an interval of 1 second
  }
  timeout() {
    return 60 * 1000; // default timeout at 60 seconds;
  }
  async poll() {
    throw new Error('Not implemented');
  }
  
}

module.exports.Poll = Poll;
