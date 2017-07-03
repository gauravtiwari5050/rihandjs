'use strict';
var upperCamelCase = require('uppercamelcase');
var async = require('async');
/**
 * Base class to for queues
 */
class OrmService extends require('./service').Service {
  

  initialize(callback){
    var self = this;
    this.app.logger.log('Loading Orms');
    var ormNames = this.app.applicationConfig.value('orms',[]);

    var orms = {};
    for(var ormName of ormNames ) {
      var name = `orm_${ormName}`;
      var ormClass = require(`../orms/${name}`)[upperCamelCase(name)];
      orms[ormName] = new ormClass({applicationConfig: self.app.applicationConfig,logger: self.app.logger});
    }
    async.forEach(Object.keys(orms),function(orm,callback){
      orms[orm].setup(callback);
    },function(err){
      if(err) {
        throw new Error(err);
      }
      self.app.logger.log('Done setting up orms');
      callback(null);
    });
  }
  
}

module.exports.OrmService = OrmService;