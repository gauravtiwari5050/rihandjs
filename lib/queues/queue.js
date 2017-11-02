const _ = require('lodash');
const { Job } = require('../jobs/job');
/**
 * Base class to for queues
 */
class Queue {
  constructor(options) {
    this.application = options.application;
    this.name = options.name;
  }
  getQualifiedName() {
    const prefix = this.application.configuration.environmentPrefix();
    return `${prefix}-${this.name}`;
  }
  setup(callback) {
    callback('Not Implemented');
  }
  process(callback) {
    callback('Not Implemented');
  }
  push(job, callback) {
    callback('Not Implemented');
  }
  run(serializedJob, callback) {
    if (!_.isNil(serializedJob)) {
      Job
        .deserialize(serializedJob, this.application)
        .run(callback);
    } else {
      callback(null);
    }
  }
}

Queue.service = null;


Queue.getService = function(){ // eslint-disable-line
  return Queue.serviceInstance;
};

Queue.setService = function (object) {
  Queue.serviceInstance = object;
};

module.exports.Queues = Queue.getService();
module.exports.Queue = Queue;
