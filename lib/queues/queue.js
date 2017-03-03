'use strict';
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
  push(task){
    throw new Error('Not Implemented');
  }
  process(task,callback){
    if(!_.isNil(task)){
      task.process(callback);
    } else {
      callback(null);
    }
  }
}

module.exports.Queue = Queue;