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
    return this.configuration.value('application', 'rihand');
  }

  constructor(opts) {
    let options = opts;
    if (_.isNil(options)) {
      options = {};
    }
    this.services = {};
    this.rootDirectory = options.rootDirectory || this.getDefaultRootDirectory();
    this.configuration = new Configuration(_.extend(options, { application: this }));
    this.requiredServicesPre = ['log', 'cache'];
    this.requiredServicesPost = ['initializer'];

    Application.setInstance(this);
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

  async initializeService(service) {
    const ServiceClass = this.getServiceClass(service);
    const serviceObject = new ServiceClass({
      application: this,
    });
    this.services[service] = serviceObject;
    await serviceObject.initialize({});
  }

  async initializeServices(services) {
    for (const service of services) {
      await this.initializeService(service);
    }
  }

  async start(serviceName) {
    const ServiceClass = this.getServiceClass(serviceName);
    const service = new ServiceClass({
      application: this,
    });
    let services = _.concat(this.requiredServicesPre, service.requiredServices());
    services.push(serviceName);
    services = _.concat(services, this.requiredServicesPost);
    services = _.compact(_.uniq(services));
    await this.initializeServices(services);
    await this.service(serviceName).start({});
  }
}

Application.instance = null;

Application.setInstance = function(instance){ // eslint-disable-line
  Application.instance = instance;
};

Application.getInstance = function () {
  return Application.instance;
};

module.exports.Application = Application;
