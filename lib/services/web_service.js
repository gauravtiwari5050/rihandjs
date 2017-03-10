'use strict';
var express = require('express');
var hbs = require('handlebars');
var express_handlebars  = require('express-handlebars');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var compression = require('compression');
var connectAssets = require('connect-assets');
var Routes = require('../routing/routes').Routes;
var Controller = require('../controllers/controller').Controller;
var _ = require('lodash');
/**
 * Base class for starting web app;
 */
class WebService extends require('./service').Service {
  initialize(callback) {
    console.log("Initializing web service");

    this.web_application = express()
                          .use(morgan('combined'))
                          .use(bodyParser.json())
                          .use(bodyParser.urlencoded({ extended: false }))
                          .use(compression())
                          .use(express.static('public'));
    this.setupViewEngine();
    this.setupRoutes();
    callback(null);
  }

  setupViewEngine () {
    var connectAssetsConfiguration = {};

    // set paths
    connectAssetsConfiguration.paths = ['app/assets/js', 'app/assets/css', 'app/assets/bower_components','app/assets/images'];

    // set compile to false
    connectAssetsConfiguration.compile = true;
    

    var connectAssetsInstance = connectAssets(connectAssetsConfiguration);

    
    var assetPath= function() {
      assetPath = connectAssetsInstance.options.helperContext.assetPath.apply(this,arguments);
      return new hbs.SafeString(assetPath);
    };
    var css = function(){
      css = connectAssetsInstance.options.helperContext.css.apply(this,arguments);
      return new hbs.SafeString(css);
    };
    var js = function(){
      js = connectAssetsInstance.options.helperContext.js.apply(this,arguments);
      return new hbs.SafeString(js);
    };
    let handlebarsHelpers = {
      css: css,
      js: js,
      assetPath: assetPath
    };

    let handlebarsConfiguration = {
      defaultLayout: 'main',
      layoutsDir: 'app/views/layouts/',
      partialsDir: 'app/views/partials/',
      helpers: handlebarsHelpers,
      handlebars: hbs
    };

    let handlebars = express_handlebars.create(handlebarsConfiguration);
    this.web_application.engine('handlebars', handlebars.engine)
                          .set('views', 'app/views')
                          .set('view engine', 'handlebars');
                          //.use(connectAssetsInstance);
  }

  setupRoutes() {
    // TODO cwd should be an instance variable
    try {
      this.routes = Routes.getInstance({applicationConfig: this.app.applicationConfig,logger: this.app.logger});
      require(`${this.app.applicationConfig.root()}/config/routes`).loadRoutes();
      this.web_application.use('/',this.routes.rootNamespace().getRouter());
    } catch(e) {
      this.app.logger.log(e);
      throw new Error(`Rihand expects ${process.cwd()}/config/routes.js to export a function called loadRoutes`);
    }
    
  }

  start(options,callback){
    var self = this;
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