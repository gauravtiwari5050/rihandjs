const _ = require('lodash');
const process = require('process');
const { Configuration } = require('../config/configuration');
const upperCamelCase = require('uppercamelcase');
const async = require('async');

class Application {
  getDefaultRootDirectory() {
    // TODO better way to determine root directory
    return process.cwd();
  }

  root() {
    return this.rootDirectory;
  }

  name() {
    return process.env.npm_package_name || 'rihand';
  }

  constructor(opts) {
    let options = opts;
    if (_.isNil(options)) {
      options = {};
    }
    this.services = {};
    this.rootDirectory = options.rootDirectory || this.getDefaultRootDirectory();
    this.configuration = new Configuration(_.extend(options, { application: this }));
    this.requiredServices = ['log'];
  }

  service(serviceName) {
    return this.services[serviceName];
  }

  getServiceClass(serviceName) {
    const serviceFileName = `${serviceName}_service`;
    const serviceClassName = upperCamelCase(serviceFileName);
    const ServiceClass = require(`../services/${serviceFileName}`)[serviceClassName]; //eslint-disable-line
    return ServiceClass;
  }

  initializeService(service, callback) {
    const ServiceClass = this.getServiceClass(service);
    const serviceObject = new ServiceClass({
      application: this,
    });
    this.services[service] = serviceObject;
    serviceObject.initialize({}, callback);
  }

  initializeServices(services, callback) {
    const self = this;
    async.eachSeries(services, (service, cb) => {
      self.initializeService(service, cb);
    }, callback);
  }

  start(serviceName, callback) {
    const ServiceClass = this.getServiceClass(serviceName);
    const service = new ServiceClass({
      application: this,
    });
    let requiredServices = _.concat(this.requiredServices, service.requiredServices());
    requiredServices.push(serviceName);
    requiredServices = _.compact(_.uniq(requiredServices));
    this.initializeServices(requiredServices, (err) => {
      if (err) {
        return callback(err);
      }
      return this.service(serviceName).start({}, callback);
    });
  }
}

module.exports.Application = Application;
