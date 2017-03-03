'use strict';
/**
 * Base class to for queues
 */
class Service {
  constructor(app){
    this.app = app;
  }
  initialize(callback) {
    throw new Error('Not Implemented');
  }

  start(options, callback){
    throw new Error('Not Implemented');
  }
  
}

module.exports.Service = Service;