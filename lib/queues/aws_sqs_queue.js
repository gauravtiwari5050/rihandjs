'use strict';
var AWS = require('aws-sdk');
var _ = require('lodash');
var async = require('async');
var SqsConsumer = require('sqs-consumer');
var decamelize = require('decamelize');
/**
 * Base class to for queues
 */
class AwsSqsQueue extends require('./queue').Queue {
  setup(options,callback) {
    this.applicationConfig = options.applicationConfig;
    this.sqs_config = this.applicationConfig.getYamlConfig('aws_sqs.yml');
    this.logger = options.logger;

    this.sqs_client = new AWS.SQS({
      accessKeyId: this.sqs_config.access_key,
      secretAccessKey: this.sqs_config.secret,
      region: this.sqs_config.region
    });

    this.createQueues(callback);


  }

  getFullQueueName (name) {
    return name + "-" + this.applicationConfig.environmentPrefix();
  }

  getQueueNames(){
    var self = this;
    var queue_names =  this.applicationConfig.value('queues');
    if(_.isNil(queue_names)){
      queue_names = [];
    }

    // create one default queue
    queue_names.push('default');
    queue_names = _.uniqBy(queue_names);

    queue_names = _.map(queue_names,function(name){
      return self.getFullQueueName(name);
    });

    return queue_names;

  }



  createQueues(callback){
    var self = this;
    self.queues = {};

    var createQueue = function(queue_name,callback){
      console.log("Creating queue with name " +  queue_name);
      var params = {
        QueueName: queue_name
      };
      
      self.sqs_client.createQueue(params,function(err,data){

        if(err){
          callback(err);
        } else {
          self.queues[queue_name] = data;
          callback(null);
        }
      });

    }
    
    var queue_names = this.getQueueNames();
    async.eachSeries(queue_names,createQueue,function(err){
      callback(err);
    })
  
  }
  listen(queue_name,callback){
    var self = this;

    queue_name = this.getFullQueueName(queue_name);
    var queue_detail = this.queues[queue_name];
    var consumer = SqsConsumer.create({
      queueUrl: queue_detail['QueueUrl'],
      handleMessage: (message, done) => {
        console.log(message);
        try {
          var body = JSON.parse(message['Body']);
          var taskClass = require(`${self.applicationConfig.root()}/app/tasks/${decamelize(body['class_name'])}`)[body['class_name']]

          var task = new taskClass(body['body'])
          self.run(task,done);

        } catch(e){
          console.log(e);
          done(e);
        }
       
      }
    });

    consumer.on('error', (err) => {
      console.log(err.message);
    });

    consumer.start();

    callback(null);
  }
  push(queue_name,task,callback){
    
    queue_name = this.getFullQueueName(queue_name);
    var queue_detail = this.queues[queue_name];
    if(_.isNil(queue_detail)){
      
      throw new Error(`${queue_name} has not been registered`);
    }
    
    var payload = {class_name: task.constructor.name, body:task.getPayload()};
    var params = {
      MessageBody: JSON.stringify(payload),
      QueueUrl: queue_detail['QueueUrl']
    }
    this.sqs_client.sendMessage(params,function(err,data){
      console.log(err);
      callback(err);
    });
    
  }
  
}

module.exports.AwsSqsQueue = AwsSqsQueue;