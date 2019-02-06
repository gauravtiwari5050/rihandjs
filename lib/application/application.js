const _ = require('lodash');
const process = require('process');
const { Configuration } = require('../config/configuration');
const upperCamelCase = require('uppercamelcase');
const async = require('async');

class Application {
  getDefaultRootDirectory() {
    // TODO better way to determine root directory
    if (process.pkg) {
      // this is a pkg environment
      return __dirname;
    }
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
    console.log('rootDirectory', this.rootDirectory);
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
    if (this.services[service]) {
      console.log(`Service ${service} already initialized. Skipping ...`);
      return;
    }
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

  async prepareService(serviceName) {
    const ServiceClass = this.getServiceClass(serviceName);
    const service = new ServiceClass({
      application: this,
    });
    let services = _.concat(this.requiredServicesPre, service.requiredServices());
    const disabledServices = this.configuration.value('disabled_services', []);
    services.push(serviceName);
    services = _.concat(services, this.requiredServicesPost);
    services = _.compact(_.uniq(services));
    services = _.filter(services, service => _.includes(disabledServices, service) === false);
    await this.initializeServices(services);
  }

  async start(serviceName) {
    await this.prepareService(serviceName);
    await this.startService(serviceName);
  }
  async startService(serviceName) {
    await this.service(serviceName).start({});
  }
}


Application.setInstance = function(instance){ // eslint-disable-line
  global.rihandApplicationInstance = instance;
};

Application.getInstance = function () {
  return global.rihandApplicationInstance;
};

module.exports.Application = Application;
