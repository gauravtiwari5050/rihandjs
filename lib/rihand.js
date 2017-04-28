'use strict';
var fs = require('fs');
var path = require('path');
var upperCamelCase = require('uppercamelcase');
var _ = require('lodash');
var async = require('async');
var argv = require('./utils/command_line_args').CommandLineArgs;
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
var Initializer = require('./initializers/initializer').Initializer;
var Middleware = require('./middlewares/middleware').Middleware;



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
    
    argv.update(options.args);
    
    this.applicationConfig = new ApplicationConfig();
    this.logger = new ApplicationLog(this.applicationConfig);
    this.requiredServices = ['queue','orm', 'model', 'web'];
    this.services = {};

    global.rihand = this;
  }

  start(callback) {
    var self = this;
    console.log("Starting");

    
    if(argv.getValue('start')) {
      this.startService(argv.getValue('start'),function(err){
        callback(err);
      });
    } else if(argv.getValue('run')) {
      this.initializeServices(function(err){
        if(err){
          console.log(err);
        } else {
          self.executeRunner();
        }
      })
      
    } else {
      console.log("Pass start agruments");
      callback("Pass start agruments");
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
  startService (serviceName,callback){
    var self = this;
    

    self.initialize(function(){
      if(_.isNil(self.services[serviceName])){
        throw new Error(`Unknown service ${serviceName}`);
      }
      self.services[serviceName].start(argv,function(err){
        if(err){
          return callback(err);
        } else {
          console.log(`Started service ${serviceName}`);
          return callback(null);
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

    async.eachSeries(this.requiredServices,initializeService,function(err){
      if(err){
        callback(err);
      } else {
        self.runInitializers(callback);
      }
    });
  }

  runInitializers(callback) {
    
    var initializersDirectory = `${this.applicationConfig.root()}/app/initializers`;
    
    var initializers = _.map(fs.readdirSync(initializersDirectory),function(fileName){
      var baseFileName = path.parse(fileName).name;
      var initializerClass = require(`${initializersDirectory}/${fileName}`)[upperCamelCase(baseFileName)];
      if(_.isNil(initializerClass)){
        throw new Error(`${initializersDirectory}/${fileName} should export a class called ${upperCamelCase(baseFileName)}`);
      }
      var initializer = new initializerClass();
      return initializer;

    });
    
    initializers = _.sortBy(initializers,function(initializer){
      return initializer.priority();
    });
    

    async.eachSeries(
      initializers,
      
      function(initializer,cb){
        initializer.run(cb);
      },

      function(err){
        callback(err);
      }

    );
    
  }
  

  /**
   * [executeRunner description]
   * @return {[type]} [description]
   */
  executeRunner(callback) {
    var runnerName = argv.getValue('name');
    var runnerAction = argv.getValue('action');
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
module.exports.RihandInitializer = Initializer;
module.exports.RihandMiddleware = Middleware;
module.exports.Rihand = Rihand;











