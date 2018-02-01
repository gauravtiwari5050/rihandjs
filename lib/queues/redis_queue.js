const kue = require('kue');
const { Job } = require('../jobs/job');
const domain = require('domain');
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
      console.log('Error configuring queue');
      return callback(e);
    }
  }
  process(callback) {
    const self = this;
    self.queue.process(this.getQualifiedName(), (job, done) => {
      const runDomain = domain.create();
      runDomain.on('error', (err) => {
        console.log('Caught fatal error', err);
        return done(err);
      });
      runDomain.run(() => {
        const serializedJob = JSON.parse(job.data);
        self.run(serializedJob, done);
      });
    });
    callback(null);
  }
  push(jobObject, callback) {
    if (!this.queue) {
      return callback('Queue is not configured');
    }
    const job = this.queue.create(this.getQualifiedName(), Job.serialize(jobObject));
    job.priority(jobObject.priority());
    job.attempts(jobObject.retries());
    return job.save((err) => {
      callback(err, job);
    });
  }

  status(jobId, callback) {
    kue.Job.get(jobId, (err, job) => {
      if (err) {
        return callback(err);
      }
      if (!job) {
        return callback(null, null);
      }
      return callback(null, job._state); // eslint-disable-line
    });
  }
}

module.exports.RedisQueue = RedisQueue;
