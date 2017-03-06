'use strict';
/**
 * Base class to for queues
 */
class Task {
  constructor(payload){
    this.payload = payload;
  }
  
  run(callback){
    throw new Error('Not Implemented');
  }

  getPayload() {
    return this.payload;
  }
  
  
}

module.exports.Task = Task;