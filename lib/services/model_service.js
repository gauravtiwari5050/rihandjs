'use strict';
var upperCamelCase = require('uppercamelcase');
var async = require('async');
var fs = require('fs');
var _ = require('lodash');
/**
 * Base class to for queues
 */
class ModelService extends require('./service').Service {
  

  initialize(callback){
    
    let modelSubdirectories = ['app/models'];
    for(var modelSubdirectory of modelSubdirectories) {
      let files = fs.readdirSync(`${this.app.applicationConfig.root()}/${modelSubdirectory}`);
      for(var file of files) {
        let model_file = file.split('.');
        if(model_file === null || model_file[0] === null) {
          continue;
        }
        let modelName = upperCamelCase(model_file[0]);
        let modelLoadPath = `${this.app.applicationConfig.root()}/${modelSubdirectory}/${model_file[0]}`;

        this.app.logger.log(`Loading ${modelName} from  ${modelLoadPath}.js`);
        var modelClass = require(modelLoadPath)[modelName];
        if(_.isUndefined(modelClass)){
          throw new Error(`${modelLoadPath} should export ${modelName}`);
        }

      }
    }

    callback(null);

  }
  
}

module.exports.ModelService = ModelService;