'use strict'
var fs = require('fs');
var upperCamelCase = require('uppercamelcase');
var express = require('express');
var hbs = require('handlebars')
var express_handlebars  = require('express-handlebars');
var morgan = require('morgan')
var bodyParser = require('body-parser')
var compression = require('compression')
var connectAssets = require('connect-assets');  
var _ = require('lodash');


/**
 * Module Dependencies
 */

/* var RihandController = require('controllers/rihand_controller');
var RihandMongooseModel = require('controllers/rihand_mongoose_model');
var RihandMailer = require('controllers/rihand_mailer');
*/
var RihandRoutes = require('./routes/rihand_routes').RihandRoutes;
var RihandController = require('./controllers/rihand_controller').RihandController;



/**
 * Framework Object
 */
class Rihand {
  /**
   * @return {[type]}
   */
  constructor (options) {
    console.log("Initiated a Rihand class");
    this.initializeWebApplication();
    this.loadRoutes();
  }

  setupViewEngine () {
    var connectAssetsInstance = connectAssets({paths: ['app/assets/js', 'app/assets/css', 'app/assets/bower_components','app/assets/images']})
    
    let handlebarsHelpers = {
      css: () => {
        css = connectAssets.options.helperContext.css.apply(this,arguments)
        return new hbs.SafeString(css)
      },
      js: () => {
        js = connectAssets.options.helperContext.js.apply(this,arguments)
        return new hbs.SafeString(js)
      },
      assetPath: () => {
        assetPath = connectAssets.options.helperContext.assetPath.apply(this,arguments)
        return new hbs.SafeString(assetPath)
      }
    }

    let handlebarsConfiguration = {
      defaultLayout: 'main',
      layoutsDir: "app/views/layouts/",
      partialsDir: "app/views/partials/",
      helpers: handlebarsHelpers,
      handlebars: hbs
    }

    let handlebars = express_handlebars.create(handlebarsConfiguration)
    this.web_application.engine('handlebars', handlebars.engine)
                          .set('views', 'app/views')
                          .set('view engine', 'handlebars')
  }

  initializeWebApplication(options) {
    this.web_application = express()
                          .use(morgan('combined'))
                          .use(bodyParser.json())
                          .use(bodyParser.urlencoded({ extended: false }))
                          .use(compression())
                          //.use(connectAssets)
    // this.setupViewEngine();
  }

  startApp() {
    this.web_application.use('/',RihandRoutes.rootNamespace().getRouter());
    this.web_application.listen(5000,()=>{
      console.log("Listening");
    });
  }

  /**
   * @return {[type]}
   */
  loadRoutes() {
    // TODO cwd should be an instance variable
    try {
      require(`${process.cwd()}/config/routes`).loadRoutes();
    } catch(e) {
      console.log(e);
      throw new Error(`Rihand expects ${process.cwd()}/config/routes.js to export a function called loadRoutes`);
    }
    
      
    
  }


  /**
   * @return
   */
  loadModels () {
    let modelSubdirectories = ["app/models"]
    for(var modelSubdirectory of modelSubdirectories) {
      let files = fs.readdirSync(`${process.cwd()}/${modelSubdirectory}`)
      for(var file of files) {
        let model_file = file.split('.')
        if(model_file === null || model_file[0] === null) {
          continue;
        }
        let modelName = upperCamelCase(model_file[0])
        console.log(`Loading ${modelName} from  ${process.cwd()}/${modelSubdirectory}/${model_file[0]}.coffee`)

      }
    }
  }

}

module.exports.RihandController = RihandController;
module.exports.RihandRoutes = RihandRoutes;
module.exports.Rihand = Rihand;










