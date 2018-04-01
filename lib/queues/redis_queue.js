const kue = require('kue');
const { Job } = require('../jobs/job');
const domain = require('domain');
/**
 * Base class to for queues
 */
class RedisQueue extends require('./queue').Queue {
  async setup() {
    const configuration = await this.application.configuration.getYamlConfig('redis_queue.yml');
    const prefix = configuration.prefix || this.application.name();
    this.queue = kue.createQueue({
      prefix,
      redis: configuration.connection,
    });
  }
  async process() {
    const self = this;
    return new Promise(() => {
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
    });
  }
  async push(jobObject) {
    if (!this.queue) {
      throw new Error('Queue is not configured');
    }
    return new Promise((resolve, reject) => {
      const job = this.queue.create(this.getQualifiedName(), Job.serialize(jobObject));
      job.priority(jobObject.priority());
      job.attempts(jobObject.retries());
      job.save((err) => {
        if (err) {
          return reject(err);
        }
        return resolve(job);
      });
    });
  }

  async status(jobId) {
    return new Promise((resolve, reject) => {
      kue.Job.get(jobId, (err, job) => {
        if (err) {
          return reject(err);
        }
        if (!job) {
          return resolve(null);
        }
        return resolve(job._state); // eslint-disable-line
      });
    });
  }
}

module.exports.RedisQueue = RedisQueue;
