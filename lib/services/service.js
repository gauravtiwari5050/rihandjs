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
  async initialize(options) { // eslint-disable-line
    throw new Error('Not Implemented');
  }

  async start(options){ // eslint-disable-line
    throw new Error('Not Implemented');
  }
}

module.exports.Service = Service;
