class SampleInitializer extends require('../../../../../lib/initializers/initializer').Initializer {
  run(callback) {
    callback(null);
  }
}

module.exports.SampleInitializer = SampleInitializer;
