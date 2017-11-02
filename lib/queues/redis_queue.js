const kue = require('kue');
const { Job } = require('../jobs/job');
/**
 * Base class to for queues
 */
class RedisQueue extends require('./queue').Queue {
  setup(callback) {
    const self = this;
    const configuration = this.application.configuration.getYamlConfig('redis_queue.yml');
    const prefix = configuration.prefix || this.application.name();
    try {
      self.queue = kue.createQueue({
        prefix,
        redis: configuration.connection,
      });
      return callback(null);
    } catch (e) {
      return callback(e);
    }
  }
  process(callback) {
    const self = this;
    self.queue.process(this.getQualifiedName(), (job, done) => {
      const serializedJob = JSON.parse(job.data);
      self.run(serializedJob, done);
    });
    callback(null);
  }
  push(jobObject, callback) {
    const job = this.queue.create(this.getQualifiedName(), Job.serialize(jobObject));
    job.save((err) => {
      callback(err, job);
    });
  }
}

module.exports.RedisQueue = RedisQueue;
