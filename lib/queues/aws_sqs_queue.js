'use strict';
var AWS = require('aws-sdk');
var _ = require('lodash');
var async = require('async');
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
      return name + "-" + self.applicationConfig.environmentPrefix();
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
  listen(queue_name){
    throw new Error('Not Implemented');
  }
  push(queue_name,task,callback){
    throw new Error('Not Implemented');
  }
  process(task,callback){
    if(!_.isNil(task)){
      task.process(callback);
    } else {
      callback(null);
    }
  }
}

module.exports.AwsSqsQueue = AwsSqsQueue;