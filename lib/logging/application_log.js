'use strict';

var winston = require('winston');


class ApplicationLog {
  logLevel () {
    return (this.applicationConfig.environment() === 'development' ? 'debug' : 'info');
  }
  logTransports () {
    var transports = [];
    if(this.applicationConfig.environment() === 'development') {
      transports.push( new (winston.transports.Console)());
    }
    transports.push(new (winston.transports.File)({ filename: `${this.applicationConfig.root()}/logs/${this.applicationConfig.environment()}.log` }));
    return transports;
  }
 
  constructor (applicationConfig) {
    this.applicationConfig = applicationConfig;
    this.logger = new winston.Logger({
      level: this.logLevel(),
      transports: this.logTransports()
    });
    
  }

  log() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this.logLevel());
    this.logger.log.apply(this.logger,args);
  }
  info() {
    this.logger.info.apply(this.logger,arguments);
  }
  debug() {
    this.logger.debug.apply(this.logger,arguments);
  }
  error() {
    this.logger.error.apply(this.logger,arguments);
  }


}

module.exports.ApplicationLog = ApplicationLog;
