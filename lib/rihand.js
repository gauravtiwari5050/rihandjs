'use strict';
var fs = require('fs');
var upperCamelCase = require('uppercamelcase');
var express = require('express');
var hbs = require('handlebars');
var express_handlebars  = require('express-handlebars');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var compression = require('compression');
var connectAssets = require('connect-assets');  
var _ = require('lodash');
var async = require('async');


/**
 * Module Dependencies
 */


var RihandRoutes = require('./routes/rihand_routes').RihandRoutes;
var RihandController = require('./controllers/rihand_controller').RihandController;
var RihandApplicationConfig = require('./config/rihand_application_config').RihandApplicationConfig;
var RihandMongooseSchema = require('./schemas/mongoose/rihand_mongoose_schema').RihandMongooseSchema;
var RihandLog = require('./logging/rihand_log').RihandLog;



/**
 * Framework Object
 */
class Rihand {
  /**
   * @return {[type]}
   */
  constructor (options) {
    
    this.applicationConfig = new RihandApplicationConfig();
    this.logger = new RihandLog(this.applicationConfig);
    this.initializeWebApplication();

    this.logger.log('Initiated Rihand');
    
    
  }

  setupViewEngine () {
    var connectAssetsInstance = connectAssets({paths: ['app/assets/js', 'app/assets/css', 'app/assets/bower_components','app/assets/images']});
    
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
                          .set('view engine', 'handlebars')
                          .use(connectAssetsInstance);
  }

  initializeWebApplication(options) {
    this.web_application = express()
                          .use(morgan('combined'))
                          .use(bodyParser.json())
                          .use(bodyParser.urlencoded({ extended: false }))
                          .use(compression());
    this.setupViewEngine();
  }


  startApp() {
    var self = this;
    this.loadOrms(function(){
      self.loadRoutes();
      self.loadModels();
      self.web_application.listen(5000,()=>{
        self.logger.log('Listening');
      });
    });

    
  }

  /**
   * @return {[type]}
   */
  loadRoutes() {
    // TODO cwd should be an instance variable
    try {
      this.routes = RihandRoutes.getInstance({applicationConfig: this.applicationConfig,logger: this.logger});
      require(`${process.cwd()}/config/routes`).loadRoutes();
      this.web_application.use('/',this.routes.rootNamespace().getRouter());
    } catch(e) {
      this.logger.log(e);
      throw new Error(`Rihand expects ${process.cwd()}/config/routes.js to export a function called loadRoutes`);
    }
    
  }

  loadOrms(callback) {
    var self = this;
    this.logger.log('Loading Orms');
    var ormNames = this.applicationConfig.value('orms',[]);

    var orms = {};
    for(var ormName of ormNames ) {
      var name = `rihand_orm_${ormName}`;
      var ormClass = require(`./orms/${name}`)[upperCamelCase(name)];
      orms[ormName] = new ormClass({applicationConfig: this.applicationConfig,logger: this.logger});
    }
    async.forEach(Object.keys(orms),function(orm,callback){
      orms[orm].setup(callback);
    },function(err){
      if(err) {
        throw new Error(err);
      }
      self.logger.log('Done setting up orms');
      callback(null);
    });

  }


  /**
   * @return
   */
  loadModels () {
    let modelSubdirectories = ['app/models'];
    for(var modelSubdirectory of modelSubdirectories) {
      let files = fs.readdirSync(`${this.applicationConfig.root()}/${modelSubdirectory}`);
      for(var file of files) {
        let model_file = file.split('.');
        if(model_file === null || model_file[0] === null) {
          continue;
        }
        let modelName = upperCamelCase(model_file[0]);
        let modelLoadPath = `${this.applicationConfig.root()}/${modelSubdirectory}/${model_file[0]}`;

        this.logger.log(`Loading ${modelName} from  ${modelLoadPath}.js`);
        var modelClass = require(modelLoadPath)[modelName];
        if(_.isUndefined(modelClass)){
          throw new Error(`${modelLoadPath} should export ${modelName}`);
        }

      }
    }
  }

}

module.exports.RihandController = RihandController;
module.exports.RihandRoutes = RihandRoutes;
module.exports.RihandMongooseSchema = RihandMongooseSchema;
module.exports.Rihand = Rihand;











