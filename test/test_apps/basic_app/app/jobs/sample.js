class Sample extends require('../../../../../lib/jobs/job').Job {
  setup() {
    this.customProperty = 'customProperty';
  }
  run(callback) {
    callback(null);
  }
}

module.exports.Sample = Sample;
