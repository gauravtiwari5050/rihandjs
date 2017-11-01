const assert = require('assert');
const { expect } = require('chai'); // eslint-disable-line
const { Application } = require('../../../lib/application/application');
const path = require('path');
const cheerio = require('cheerio'); // eslint-disable-line
const { RedisQueue } = require('../../../lib/queues/redis_queue');
const SampleJob = require('../../test_apps/basic_app/app/jobs/sample').Sample;

describe('class: RedisQueue', () => {
  describe('method: push', () => {
    it('should correctly push job to redis', (done) => {
      const application = new Application({
        rootDirectory: path.resolve(__dirname, '../../test_apps/basic_app/'),
        env: 'test',
      });
      const redisQueue = new RedisQueue({
        name: 'redisQueue',
        application,
      });

      redisQueue.setup((err) => {
        if (err) {
          return done(err);
        }
        const job = new SampleJob();
        job.setup();
        return redisQueue.push(job, (errPush, queuedJob) => {
          if (errPush) {
            return done(errPush);
          }
          return done(null, queuedJob);
          /*
          return redisQueue.process((errProcess) => {
            //
            return done(errProcess);
          });
            */
        });
      });
    });
  });
});
