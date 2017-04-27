'use strict';
var upperCamelCase = require('uppercamelcase');
var fs = require('fs');
var path = require('path');

var express = require('express');
var ejs_engine = require('ejs-mate');

var morgan = require('morgan');
var bodyParser = require('body-parser');
var compression = require('compression');
var connectAssets = require('connect-assets');
var Routes = require('../routing/routes').Routes;
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');


var _ = require('lodash');
/**
 * Base class for starting web app;
 */
class WebService extends require('./service').Service {
  initialize(callback) {
    console.log('Initializing web service');

    this.web_application = express()
                          .use(cookieParser())
                          .use(cookieSession({
                              name: 'session',
                              keys: ['key1','key2'],
                              // Cookie Options
                              maxAge: 24 * 60 * 60 * 1000 * 1000// 24 hours
                          }))
                          .use(morgan('combined'))
                          .use(bodyParser.json())
                          .use(bodyParser.urlencoded({ extended: false }))
                          .use(compression())
                          .use(express.static('public'));
    
    this.setupViewEngine();
    //this.setupRoutes();
    callback(null);
  }

  getWebApplication(){
    return this.web_application;
  }

  useMiddlewares() {
    var self = this;
    var middlewaresDirectory = `${this.app.applicationConfig.root()}/app/middlewares`;
    
    var middlewares = _.map(fs.readdirSync(middlewaresDirectory),function(fileName){
      var baseFileName = path.parse(fileName).name;
      var middlewareClass = require(`${middlewaresDirectory}/${fileName}`)[upperCamelCase(baseFileName)];
      if(_.isNil(middlewareClass)){
        throw new Error(`${middlewaresDirectory}/${fileName} should export a class called ${upperCamelCase(baseFileName)}`);
      }
      var middleware = new middlewareClass();
      return middleware;

    });
    
    middlewares = _.sortBy(middlewares,function(middleware){
      return middleware.priority();
    });
    
    middlewares.forEach(function(middleware){
      if(middleware.enabled() === true){
        console.log("Using ");
        console.log(middleware.call);
        self.web_application.use(middleware.call());
      }
    });

    
  }

  setupViewEngine () {
    var connectAssetsConfiguration = {};

    // set paths
    connectAssetsConfiguration.paths = ['app/assets/js', 'app/assets/css', 'app/assets/bower_components','app/assets/images', 'app/assets/fonts'];

    // set compile to false
    connectAssetsConfiguration.compile = false;

    if(process.env.NODE_ENV != 'production'){
      connectAssetsConfiguration.compile = true;
    }
    

    var connectAssetsInstance = connectAssets(connectAssetsConfiguration);

    
    var assetPath= function() {
      assetPath = connectAssetsInstance.options.helperContext.assetPath.apply(this,arguments);
      return new assetPath;
    };
    var css = function(){
      css = connectAssetsInstance.options.helperContext.css.apply(this,arguments);
      return new css;
    };
    var js = function(){
      js = connectAssetsInstance.options.helperContext.js.apply(this,arguments);
      return new js;
    };
    
    this.web_application.css = css;
    this.web_application.js = js;
    this.web_application.assetPath = assetPath;

    
    
    this.web_application.engine('ejs', ejs_engine)
                          .set('views', 'app/views')
                          .set('view engine', 'ejs')
                          .use(connectAssetsInstance);
  }

  setupRoutes() {
    // TODO cwd should be an instance variable
    try {
      this.routes = Routes.getInstance({applicationConfig: this.app.applicationConfig,logger: this.app.logger});
      require(`${this.app.applicationConfig.root()}/config/routes`).loadRoutes();
      this.web_application.use('/',this.routes.getRouter());
    } catch(e) {
      this.app.logger.log(e);
      throw new Error(`Rihand expects ${process.cwd()}/config/routes.js to export a function called loadRoutes`);
    }
    
  }

  start(options,callback){
    var self = this;
    self.useMiddlewares();
    // setup routes before starting
    self.setupRoutes();
    
    var port = options.port;
    if(_.isNil(port)){
      port = '5050';
    }
    port = parseInt(port);
    self.web_application.listen(port,()=>{
        self.app.logger.log('Listening');
        callback(null);
    });
  }

}

module.exports.WebService = WebService;