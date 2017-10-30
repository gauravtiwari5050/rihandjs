const snakeCase = require('snake-case');
const path = require('path');

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

  queue() {
    return 'default';
  }

  run(callback) {
    callback('Not implemented');
  }
}
module.exports.Job = Job;
