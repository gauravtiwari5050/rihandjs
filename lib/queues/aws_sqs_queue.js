const AWS = require('aws-sdk');
const _ = require('lodash');
const { Job } = require('../jobs/job');
const domain = require('domain');
const SqsConsumer = require('sqs-consumer');
/**
 * Base class to for queues
 */
class AwsSqsQueue extends require('./queue').Queue {
  async setup() {
    this.sqsConfig = await this.application.configuration.getYamlConfig('aws_sqs.yml');
    this.sqsClient = this.getSqsClient();

    const deadLetterQueueName = `dead-letter-${this.getQualifiedName(this.name)}`;

    this.deadLetterQueue = await this.createQueue(deadLetterQueueName);
    this.deadLetterQueueAttributes = await this.getQueueAttributes(this.deadLetterQueue);
    const sqsQueueName = this.getQualifiedName(this.name);
    this.sqsQueue = await this.createQueue(
      this.getQualifiedName(this.name),
      this.deadLetterQueueAttributes,
    );
    console.log('Created sqs queue', sqsQueueName);
  }
  async getQueueAttributes(QueueDetails) {
    return new Promise((resolve, reject) => {
      const params = {
        QueueUrl: QueueDetails.QueueUrl,
        AttributeNames: ['All'],
      };
      this.sqsClient.getQueueAttributes(params, (err, data) => {
        if (err) {
          return reject(err);
        }
        return resolve(data);
      });
    });
  }
  async createQueue(QueueName, DeadLetterQueueDetails) {
    const self = this;
    return new Promise((resolve, reject) => {
      const params = {
        QueueName,
      };
      if (
        DeadLetterQueueDetails
        &&
        self.sqsConfig.queues
        &&
        self.sqsConfig.queues[self.name]
        &&
        self.sqsConfig.queues[self.name].retries
      ) {
        params.Attributes = {
          RedrivePolicy: JSON.stringify({
            deadLetterTargetArn: DeadLetterQueueDetails.Attributes.QueueArn,
            maxReceiveCount: self.sqsConfig.queues[self.name].retries,
          }),
        };
      }
      this.sqsClient.createQueue(params, (err, data) => {
        if (err) {
          return reject(err);
        }
        return resolve(data);
      });
    });
  }
  getQualifiedName(name) {
    return `${name}-${this.application.configuration.environmentPrefix()}-${this.application.name()}`;
  }
  getQueueNames() {
    let queueNames = this.application.configuration.value('queues');
    if (_.isNil(queueNames)) {
      queueNames = [];
    }
    // create one default queue
    queueNames.push('default');
    queueNames = _.uniqBy(queueNames);
    queueNames = _.map(queueNames, name => this.getQualifiedName(name));
    return queueNames;
  }
  getSqsClient() {
    const credentials = new AWS.Credentials({
      accessKeyId: this.sqsConfig.accessKeyId,
      secretAccessKey: this.sqsConfig.secretAccessKey,
    });
    return new AWS.SQS({
      credentials,
      region: this.sqsConfig.region,
    });
  }
  async process() {
    const self = this;
    return new Promise((resolve, reject) => {
      const consumerPayload = {
        sqs: this.getSqsClient(),
        queueUrl: self.sqsQueue.QueueUrl,
        handleMessage: (message, done) => {
          const runDomain = domain.create();
          runDomain.on('error', (err) => {
            console.log('Caught fatal error', err);
            return done(err);
          });
          runDomain.run(() => {
            const serializedJob = JSON.parse(message.Body);
            self.run(serializedJob).then((result) => {
              done();
            }).catch((error) => {
              done(error);
            });
          });
        },
      };

      if (self.sqsConfig.queues && self.sqsConfig.queues[self.name]) {
        const queueConfig = self.sqsConfig.queues[self.name];
        if (queueConfig.VisibilityTimeout) {
          consumerPayload.visibilityTimeout = queueConfig.visibilityTimeout;
        }
        if (queueConfig.terminateVisibilityTimeout) {
          consumerPayload.terminateVisibilityTimeout = queueConfig.terminateVisibilityTimeout;
        }
      }
      const consumer = SqsConsumer.create(consumerPayload);

      consumer.on('error', (err) => {
        console.log('Error in sqs consumer');
        reject(err);
      });

      consumer.start();
    });
  }

  async push(jobObject) {
    const self = this;
    const params = {
      MessageBody: Job.serialize(jobObject),
      QueueUrl: this.sqsQueue.QueueUrl,
    };
    return new Promise((resolve, reject) => {
      self.sqsClient.sendMessage(params, (err, data) => {
        if (err) {
          return reject(err);
        }
        return resolve({
          id: data.MessageId,
          data,
        });
      });
    });
  }

  async status(jobId) {
    throw new Error('Not implemented');
  }
}

module.exports.AwsSqsQueue = AwsSqsQueue;
