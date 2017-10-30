/**
 * Base class for all services
 */
class Service {
  constructor(options) {
    this.application = options.application;
  }
  requiredServices() {
    return [];
  }
  initialize(options, callback) { // eslint-disable-line
    throw new Error('Not Implemented');
  }

  start(options, callback){ // eslint-disable-line
    throw new Error('Not Implemented');
  }
}

module.exports.Service = Service;
