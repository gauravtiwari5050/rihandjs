const snakeCase = require('snake-case');
const path = require('path');
const _ = require('lodash');
const Queues = require('../queues/queue');

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
    const object = new Class();
    const ownPropertyNames = Object.getOwnPropertyNames(json.properties);
    for (let i = 0; i < ownPropertyNames.length; i += 1) {
      const key = ownPropertyNames[i];
      object[key] = json.properties[key];
    }
    return object;
  }

  constructor() {
    this.queueName = null;
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
module.exports.Job = Job;
