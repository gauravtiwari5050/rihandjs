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

  startService(applicationConfig){
    console.log("Starting QueueService");
  }
  
}

module.exports.QueueService = QueueService;