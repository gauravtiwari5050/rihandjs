'use strict';
/**
 * Base class to for queues
 */
class QueueService {
  setup(applicationConfig) {
    throw new Error('Not Implemented');
  }

  startService(applicationConfig){
    console.log("Starting QueueService");
  }
  
}

module.exports.QueueService = QueueService;