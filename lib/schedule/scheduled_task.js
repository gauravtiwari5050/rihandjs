'use strict';
/**
 * Base class to for queues
 */
class ScheduledTask {
  when() {
    throw new Error ('Not Implemented');
  }
  run(){
    throw new Error ('Not Implemented');
  }
}

module.exports.ScheduledTask = ScheduledTask;