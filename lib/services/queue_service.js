const _ = require('lodash');
const upperCamelCase = require('uppercamelcase');
const async = require('async');
const { Logger } = require('../logging/log');

class QueueService extends require('./service').Service {
  requiredServices() {
    return ['asset_pipeline', 'view', 'route', 'web'];
  }
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
    const queueInstances = _.map(queueNames, (queueName) => {
      const queueInstance = new QueueClass({
        application: this.application,
        name: queueName,
      });
      self.queuesMap[queueName] = queueInstance;
      self[queueName] = queueInstance;
      return queueInstance;
    });

    return async.each(queueInstances, (queue, cb) => queue.setup(cb), callback);
  }

  push(queueName, jobObject, callback) {
    const queue = this.queuesMap[queueName];
    if (_.isNil(queue)) {
      return callback(`Queue ${queueName} is not configured`);
    }
    return queue.push(jobObject, callback);
  }

  start(options, callback) {
    const queueName = options.queue || 'default';
    const queue = this.queuesMap[queueName];
    if (_.isNil(queue)) {
      return callback(`No queue with name ${queueName} has been configured `);
    }
    return queue.process(callback);
  }
}

module.exports.QueueService = QueueService;
