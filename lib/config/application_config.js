'use strict';
var YAML = require('yamljs');
var extend = require('extend');
var _ = require('lodash');

class ApplicationConfig {
  /**
   * @return {[type]}
   */
  root () {
    //TODO a better way to detect root
    return process.cwd();

  }

  /**
   * @return {[type]}
   */
  environment() {
    var env = process.env.NODE_ENV;
    if(env === undefined || env === null) {
      env = 'development';
    }
    return env;
  }

  environmentPrefix(){
    var env = this.environment();
    if(env !== 'production'){
      env = env + "-" + process.env['USER'];
    }
    return env;
  }
  /**
   * @return {[type]}
   */
  constructor(){
    this.configObject = {};
    this.loadConfiguration();
  }

  loadConfiguration() {
    var applicationConfig = require(`${this.root()}/config/application.js`).config;
    var environmentConfig = require(`${this.root()}/config/environments/${this.environment()}.js`).config;
    this.configObject = extend(true,this.configObject,applicationConfig,environmentConfig);
  }
  /**
   * @return {[type]}
   */
  getYamlConfig(path) {
    var configPath = `${this.root()}/config/${path}`;
    var yamlObject = YAML.load(configPath);
    return yamlObject[this.environment()];
  }
  /**
   * @param  {[type]}
   * @param  {[type]}
   * @return {[type]}
   */
  value(keyPath,defaultValue) {
    return _.get(this.configObject,keyPath,defaultValue);
  }

}


module.exports.ApplicationConfig = ApplicationConfig;