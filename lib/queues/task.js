'use strict';
var _= require('lodash');
/**
 * Base class to for queues
 */
class Task {
  constructor(payload){
    if(_.isNil(payload)){
      throw new Error("Payload not passed while creating task");
    }
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