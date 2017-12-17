const snakeCase = require('snake-case');
const path = require('path');
const _ = require('lodash');
const { Application } = require('../application/application');

class Job {
  static serialize(object) {
    const className = object.constructor.name;
    const properties = {};
    const ownPropertyNames = Object.getOwnPropertyNames(object);
    for (let i = 0; i < ownPropertyNames.length; i += 1) {
      const key = ownPropertyNames[i];
      properties[key] = object[key];
    }
    return JSON.stringify({
      class: className,
      properties,
    });
  }

  static deserialize(json, application) {
    const className = json.class;
    const classPath = path.resolve(application.root(), `./app/jobs/${snakeCase(className)}`);
    const Class = require(classPath)[className]; //eslint-disable-line
    const object = Object.create(Class.prototype);
    const ownPropertyNames = Object.getOwnPropertyNames(json.properties);
    for (let i = 0; i < ownPropertyNames.length; i += 1) {
      const key = ownPropertyNames[i];
      object[key] = json.properties[key];
    }
    return object;
  }

  queue(name) {
    if (_.isUndefined(name)) {
      return this.queueName || 'default';
    } else { //eslint-disable-line
      this.queueName = name;
      return this;
    }
  }

  run(callback) {
    callback('Not implemented');
  }

  delay(option, callback) {
    if (_.isFunction(option)) {
      callback = option; //eslint-disable-line
      option = {};//eslint-disable-line
    }

    const queueName = this.queue();
    Queues[queueName].push(this, callback);
  }

  schedule(at, callback) {
    this.delay({
      at,
    }, callback);
  }

  scheduleAfter(timeInMilliseconds, callback) {
    const at = new Date(Date.now() + timeInMilliseconds);
    this.schedule({
      at,
    }, callback);
  }
}

class JobQueue {
  constructor() {
    this.proxy = null;
    this.queueName = 'default';
    this.methodArgs = null;
    this.delayParams = null;
    this.callback = null;
    // proxy to mail deliver object
    this.proxy = new Proxy(this, {
      // any method invoked on the proxy will hit the below get method
      get(target, name) {
        if (name === 'submit') {
          return function (job, callback) {
            const queueService = Application.getInstance().service('queue');
            return queueService.push(target.queueName, job, callback);
          };
        }
        target.queueName = name; // eslint-disable-line
        return target.proxy;
      },
    });
  }

  static getProxy() {
    return new Proxy({}, {
      get(target, name) {
        if (name === 'submit') {
          return function (job, callback) {
            const queueService = Application.getInstance().service('queue');
            return queueService.push('default', job, callback);
          };
        }
        const jobQueue = new JobQueue();
        jobQueue.queueName = name;
        return jobQueue.proxy;
      },
    });
  }
}
module.exports.Job = Job;
module.exports.Jobs = JobQueue.getProxy();
