'use strict';
var _ = require('lodash');
/**
 * Base class to for queues
 */
class Queue {
  setup(applicationConfig) {
    throw new Error('Not Implemented');
  }
  listen(queue_name){
    throw new Error('Not Implemented');
  }
  push(queue_name,task,callback){
    throw new Error('Not Implemented');
  }
  run(task,callback){
    if(!_.isNil(task)){
      task.run(callback);
    } else {
      callback(null);
    }
  }
}

module.exports.Queue = Queue;