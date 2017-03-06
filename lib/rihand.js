'use strict';
var fs = require('fs');
var upperCamelCase = require('uppercamelcase');
var commander = require('commander');
var _ = require('lodash');
var async = require('async');
var argv = require('yargs').argv;
var decamelize = require('decamelize');


/**
 * Module Dependencies
 */



var ApplicationConfig = require('./config/application_config').ApplicationConfig;
var MongooseOrmSchema = require('./schemas/mongoose/mongoose_orm_schema').MongooseOrmSchema;
var ApplicationLog = require('./logging/application_log').ApplicationLog;
var Routes = require('./routing/routes').Routes;
var Controller = require('./controllers/controller').Controller;
var Task = require('./queues/task').Task;



/**
 * Framework Object
 */
class Rihand {

  /**
   * [constructor description]
   * @param  {[type]} options [description]
   * @return {[type]}         [description]
   */
  constructor (options) {
    this.applicationConfig = new ApplicationConfig();
    this.logger = new ApplicationLog(this.applicationConfig);
    this.requiredServices = ['queue','orm', 'model', 'web'];
    this.services = {};

    global.rihand = this;
  }

  start(callback) {
    console.log("Starting");

    
    if(argv.start) {
      this.startService(argv.start);
    } else if(argv.run) {
      this.executeRunner();
    } else {
      console.log("Pass start agruments");
    }


  }

  /**
   * [initialize description]
   * @param  {Function} callback [description]
   * @return {[type]}            [description]
   */
  initialize(callback){
    console.log("initializeServices");
    this.initializeServices(function(err){
      callback(err);
    });
  }

  /**
   * [startService description]
   * @param  {[type]} serviceName [description]
   * @return {[type]}             [description]
   */
  startService (serviceName){
    var self = this;
    

    self.initialize(function(){
      if(_.isNil(self.services[serviceName])){
        throw new Error(`Unknown service ${serviceName}`);
      }
      self.services[serviceName].start(argv,function(err){
        if(err){
          throw new Error(err);
        } else {
          console.log(`Started service ${serviceName}`);
        }
      });
    })
    
    
  }

  getServiceByName(serviceName){
    return this.services[serviceName];
  }

  /**
   * [initializeServices description]
   * @return {[type]} [description]
   */
  initializeServices(callback) {
    var self = this;

    var initializeService = function(serviceName,cb){

      var serviceNameFile = `${serviceName}_service`;
      
      var serviceClass = require(`./services/${serviceNameFile}`)[upperCamelCase(serviceNameFile)];
      
      self.services[serviceName] = new serviceClass(self);
      
      self.services[serviceName].initialize(cb);

    }

    async.eachSeries(this.requiredServices,initializeService,callback);
  }

  /**
   * [executeRunner description]
   * @return {[type]} [description]
   */
  executeRunner() {
    var runnerName = argv.name;
    var runnerAction = argv.action;
    var runnerClass = require(`${this.applicationConfig.root()}/app/runners/${decamelize(runnerName)}`)[runnerName];
    var runner = new runnerClass();
    console.log(runner);
    console.log(runnerAction);
    runner[runnerAction](function(err){
      console.log(err);
      process.exit();
    })
  }



}

module.exports.RihandController = Controller;
module.exports.RihandRoutes = Routes;
module.exports.RihandMongooseOrmSchema = MongooseOrmSchema;
module.exports.RihandTask = Task;
module.exports.Rihand = Rihand;











