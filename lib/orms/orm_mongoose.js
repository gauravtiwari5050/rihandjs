'use strict';
var mongoose = require('mongoose');
var _ = require('lodash');

class OrmMongoose extends require('./orm').Orm {
  constructor(options) {
    super();
    this.applicationConfig = options.applicationConfig;
    this.mongoose_config = this.applicationConfig.getYamlConfig('mongoose.yml');
    this.logger = options.logger;
  }

  setup(callback){
    var self = this;
    this.logger.log(this.mongoose_config);
    var database = _.get(this.mongoose_config,'clients.default.database');
    var hosts = _.get(this.mongoose_config,'clients.default.hosts');
    var options = _.get(this.mongoose_config,'clients.default.options');
    var mongodbEndpoint = 'mongodb://';
    if(!_.isNil(options)){
      if(!_.isNil(options.user) && !_.isNil(options.pass)) {
        mongodbEndpoint += `${options.user}:${options.pass}@`;
      }
    }
    mongodbEndpoint +=  `${hosts.join(',')}/${database}`;

    var connectionParams = ['replica_set','ssl','authSource'];
    var connectionParamValues = [];

    if(!_.isNil(options)){
      connectionParams.forEach(function(param){
        if(!_.isNil(options[param])) {
          connectionParamValues.push(`${param}=${options[param]}`);
        }
      });
    }
    if(connectionParamValues.length > 0){
      mongodbEndpoint += `?${connectionParamValues.join('&')}`;
    }
    

    this.logger.log(`Connecting to ${mongodbEndpoint}`);


    mongoose.connection.on('open',function(){
      self.logger.log('Mongoose is ready');
      callback(null);
    });

    mongoose.connection.on('error',function(err){
      self.logger.log('Error setting up mongoose');
      self.logger.log(err);
      callback(err);
    });

    mongoose.connect(mongodbEndpoint);

  }
}

module.exports.OrmMongoose = OrmMongoose;