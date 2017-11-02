const _ = require('lodash');
const upperCamelCase = require('uppercamelcase');
const { Logger } = require('../logging/log');
const { Queue } = require('../queues/queue');

class QueueService extends require('./service').Service {
  initialize(options, callback) {
    const self = this;
    this.queuesMap = {};
    const queueBackend = this.application.configuration.value('jobsBackend');
    if (_.isNil(queueBackend)) {
      Logger.warn('No backend configured for jobs');
      return callback(null);
    }
    const queueFile = `${queueBackend}_queue`;
    const QueueClass = require(`../queues/${queueFile}`)[upperCamelCase(queueFile)]; //eslint-disable-line

    let queueNames = ['default'];
    const additionalQueueNames = this.application.configuration.value('queues', []);
    queueNames = queueNames.concat(additionalQueueNames);
    _.map(queueNames, (queueName) => {
      const queueInstance = new QueueClass({
        application: this.application,
        name: queueName,
      });
      self.queuesMap[queueName] = queueInstance;
      self[queueName] = queueInstance;
      return queueInstance;
    });

    // set service instance in queue
    Queue.setService(this);
    return callback(null);
  }

  queues() {
    return this.queueMap;
  }

  start(options, callback) {
    const queueName = options.queue || 'default';
    const queue = this.queuesMap[queueName];
    if (_.isNil(queue)) {
      return callback(`No queue with name ${queueName} has been configured `);
    }
    return this.queue.process(callback);
  }
}

module.exports.QueueService = QueueService;
