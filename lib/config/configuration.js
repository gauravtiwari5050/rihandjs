const YAML = require('yamljs');
const extend = require('extend');
const _ = require('lodash');

class Configuration {
  updateProcessEnvironment(options) {
    const environment = options.env || options.environment || process.env.NODE_ENV || 'development';
    process.env.NODE_ENV = environment.toLowerCase();
  }

  environment() {
    return process.env.NODE_ENV;
  }

  environmentPrefix() {
    let prefix = this.environment();
    if (prefix !== 'production') {
      prefix += `-${process.env.USER}`;
    }
    return prefix;
  }

  constructor(opts) {
    let options = opts;
    if (_.isNil(options)) {
      options = {};
    }

    this.updateProcessEnvironment(options);
    this.application = options.application;
    this.configObject = opts;
    this.loadConfiguration();
  }

  loadConfiguration() {
    const applicationConfig = require(`${this.application.root()}/config/application.js`).config; //eslint-disable-line
    const environmentConfig = require(`${this.application.root()}/config/environments/${this.environment()}.js`).config; //eslint-disable-line
    this.configObject = extend(true, this.configObject, applicationConfig, environmentConfig);
  }

  async getYamlConfig(path) {
    const self = this;
    const configPath = `${this.application.root()}/config/${path}`;
    return new Promise((resolve, reject) => {
      YAML.load(configPath, (yamlObject) => {
        if (_.isNil(yamlObject)) {
          return reject(new Error(`Invalid yaml at ${configPath}`));
        }
        return resolve(yamlObject[self.environment()]);
      });
    });
  }

  value(keyPath, defaultValue) {
    return _.get(this.configObject, keyPath, defaultValue);
  }
}

module.exports.Configuration = Configuration;
