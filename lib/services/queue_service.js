const _ = require('lodash');
const upperCamelCase = require('uppercamelcase');

class QueueService extends require('./service').Service {
  requiredServices() {
    return ['asset_pipeline', 'view', 'route', 'web', 'mail'];
  }
  async initialize() {
    const self = this;
    this.queuesMap = {};
    const queueBackend = this.application.configuration.value('jobsBackend');
    if (_.isNil(queueBackend)) {
      throw new Error('No backend configured for jobs');
    }
    const queueFile = `${queueBackend}_queue`;
    const QueueClass = require(`../queues/${queueFile}`)[upperCamelCase(queueFile)]; //eslint-disable-line

    let queueNames = ['default'];
    const additionalQueueNames = this.application.configuration.value('queues', []);
    queueNames = _.uniq(queueNames.concat(additionalQueueNames));
    const queueInstances = _.map(queueNames, (queueName) => {
      const queueInstance = new QueueClass({
        application: this.application,
        name: queueName,
      });
      self.queuesMap[queueName] = queueInstance;
      self[queueName] = queueInstance;
      return queueInstance;
    });
    for (const queue of queueInstances) {
      await queue.setup();
    }
  }

  status(jobId, queueName, callback) {
    const queue = this.queuesMap[queueName];
    if (_.isNil(queue)) {
      return callback(`Queue ${queueName} is not configured`);
    }
    return queue.status(jobId, callback);
  }

  push(queueName, jobObject, callback) {
    const queue = this.queuesMap[queueName];
    if (_.isNil(queue)) {
      throw new Error(`Queue ${queueName} is not configured`);
    }
    return queue.push(jobObject, callback);
  }

  async info(queueName) {
    const queue = this.queuesMap[queueName];
    const info = await queue.info();
    return info;
  }

  async start() {
    const queueName = this.application.configuration.value('queue-name') || 'default';
    const queue = this.queuesMap[queueName];
    if (_.isNil(queue)) {
      throw new Error(`No queue with name ${queueName} has been configured `);
    }
    await queue.process();
  }
}

module.exports.QueueService = QueueService;
