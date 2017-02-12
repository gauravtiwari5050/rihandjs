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

    var mongodbEndpoint = `mongodb://${hosts.join(';')}/${database}`;
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

    mongoose.connect(mongodbEndpoint,options);

  }
}

module.exports.OrmMongoose = OrmMongoose;