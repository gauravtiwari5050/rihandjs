'use strict';
var _ = require('lodash');
var upperCamelCase = require('uppercamelcase');
/**
 * Base class to for queues
 */
class QueueService extends require('./service').Service {
  initialize(callback) {
    var queueServiceName = this.app.applicationConfig.value('queue_service');
    if(_.isNil(queueServiceName)){
      throw new Error('queue_service is not set in application config');
    }
    console.log(`Initializing queue service with ${queueServiceName}`)
    var queueServiceFile = `${queueServiceName}_queue`
    var queueServiceClass = require(`../queues/${queueServiceFile}`)[upperCamelCase(queueServiceFile)];

    this.queue_instance = new queueServiceClass();
    this.queue_instance.setup({applicationConfig: this.app.applicationConfig},function(err){
      callback(err);
    })

  }

  push(...args){
    this.queue_instance.push(...args);
  }

  start(options, callback){
    console.log("Starting queue with options");
    console.log(options);
    var queue_name = options.queue_name;
    if(_.isNil( queue_name)){
      queue_name = "default";
    }
    console.log("Queue name is");
    console.log(queue_name);
    this.queue_instance.listen(queue_name,function(err){
      callback(null);
    })
    
  }

  
}

module.exports.QueueService = QueueService;