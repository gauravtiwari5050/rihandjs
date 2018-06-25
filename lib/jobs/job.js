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
    const serializedObject = JSON.stringify({
      class: className,
      properties,
    });
    return serializedObject;
  }

  static deserialize(json, application) {
    const className = json.class;
    let classPath = path.resolve(application.root(), `./app/jobs/${_.snakeCase(className)}`);
    let Class = null;
    try {
      Class = require(classPath)[className];
    } catch (err) {
      Class = null;
    }
    // if it is not user defined job, check for job classes internal to Rihand
    // TODO jobs directories should be configurable via class loader
    if (_.isNil(Class)) {
      classPath = path.resolve(__dirname, `./${_.snakeCase(className)}`);
      try {
        Class = require(classPath)[className]; //eslint-disable-line
      } catch(err) {
        Class = null;
      }
    }
    if (_.isNil(Class)) {
      throw new Error(`No job configured with name ${className}`);
    }
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

  async run() {
    throw new Error('Not implemented');
  }

  async schedule(at) {
    await this.delay({
      at,
    });
  }

  async scheduleAfter(timeInMilliseconds) {
    const at = new Date(Date.now() + timeInMilliseconds);
    await this.schedule({
      at,
    });
  }
  retries() {
    return 1;
  }
  priority() {
    return 0;
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
        if (name === 'status') {
          return function (jobId, callback) {
            const queueService = Application.getInstance().service('queue');
            return queueService.status(jobId, target.queueName, callback);
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
