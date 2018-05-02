const { Job } = require('../jobs/job');
/**
 * Base class to for queues
 */
class Queue {
  constructor(options) {
    this.application = options.application;
    this.name = options.name;
  }
  getQualifiedName() {
    const prefix = this.application.configuration.environmentPrefix();
    return `${prefix}-${this.name}`;
  }
  async setup() {
    throw new Error('Not Implemented');
  }
  async process() {
    throw new Error('Not Implemented');
  }
  async push(job) {
    throw new Error('Not Implemented', job);
  }
  async run(serializedJob) {
    await Job.deserialize(serializedJob, this.application).run();
  }
  async info() {
    throw new Error('Not Implemented');
  }
}

module.exports.Queue = Queue;
