const assert = require('assert');
const SampleJob = require('../../test_apps/basic_app/app/jobs/sample').Sample;
const { Application } = require('../../../lib/application/application');
const { Job } = require('../../../lib/jobs/job');
const path = require('path');

describe('class: Job', () => {
  describe('method: serialize', () => {
    it('should correctly serialize job', (done) => {
      const job = new SampleJob();
      job.setup();
      const serialized = Job.serialize(job);
      assert.equal('Sample', JSON.parse(serialized).class);
      done(null);
    });
    it('should correctly  deserialize job', (done) => {
      const application = new Application({
        rootDirectory: path.resolve(__dirname, '../../test_apps/basic_app/'),
        env: 'test',
      });
      const json = JSON.parse('{"class":"Sample","properties":{"customProperty":"customProperty"}}');
      const job = Job.deserialize(json, application);
      assert.equal('customProperty', job.customProperty);
      done(null);
    });
  });
});
