'use strict';
/**
 * Base class to for queues
 */
class Task {
  constructor(payload){
    this.delayed = false;
    this.payload = payload;

  }
  queue(queue_name){
    
  }
  
  run(callback){
    throw new Error('Not Implemented');
  }
  
  
}

module.exports.Queue = Queue;