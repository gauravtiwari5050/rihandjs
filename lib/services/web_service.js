const upperCamelCase = require('uppercamelcase');
const fs = require('fs');
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const _ = require('lodash');
const { Logger } = require('../logging/log');
/**
 * Web Service
 */
class WebService extends require('./service').Service {
  requiredServices() {
    return ['asset_pipeline', 'view', 'route', 'queue'];
  }

  setupWebApplication(options, callback) {
    // create web application using express
    this.webApplication = express();
    this.webApplication.use(cookieParser());
    const { secretKey } = this.application
      .configuration
      .getYamlConfig('secrets.yml');
    if (_.isNil(secretKey)) {
      return callback('secretKey not found in config/secrets.yml');
    }
    const sessionName = this.application.configuration.value('sessionName', 'session');
    this.webApplication.use(cookieSession({
      name: sessionName,
      secret: secretKey,
    }));
    if (
      this.application.configuration.environment() === 'development'
      ||
      !(_.isNil(this.application.configuration.value('log_requests')))
    ) {
      this.webApplication.use(morgan('combined'));
    }
    const bodyParserPayload = {
      limit: this.application.configuration.value('postBodyLimit', '100kb'),
    };
    this.webApplication
      .use(bodyParser.json(bodyParserPayload))
      .use(bodyParser.urlencoded({ extended: false }))
      .use(compression());
    const staticFilesDirectory = path.resolve(
      this.application.root(),
      this.application.configuration.value('staticDirectory', 'public'),
    );
    this.webApplication.use(express.static(staticFilesDirectory));
    /*
    this.web_application.engine('ejs', ejs_engine)
                          .set('views', 'app/views')
                          .set('view engine', 'ejs')
    */
    const connectAssetsInstance = this.application
      .service('asset_pipeline')
      .getConnectAssetsInstance();
    this.webApplication.use(connectAssetsInstance);
    return callback(null);
  }

  useMiddlewares(callback) {
    const self = this;
    const middlewaresDirectory = `${this.app.applicationConfig.root()}/app/middlewares`;
    let middlewares = _.map(fs.readdirSync(middlewaresDirectory), (fileName) => {
      if (/^\..*/.test(fileName)) {
        return null;
      }
      const baseFileName = path.parse(fileName).name;
      const MiddlewareClass = require(`${middlewaresDirectory}/${fileName}`)[upperCamelCase(baseFileName)]; //eslint-disable-line
      if (_.isNil(MiddlewareClass)) {
        throw new Error(`${middlewaresDirectory}/${fileName} should export a class called ${upperCamelCase(baseFileName)}`);
      }
      return new MiddlewareClass();
    });

    middlewares = _.compact(middlewares);
    middlewares = _.sortBy(middlewares, function (middleware) { //eslint-disable-line
      return middleware.priority();
    });
    middlewares.forEach((middleware) => {
      if (middleware.enabled() === true) {
        self.web_application.use(middleware.call());
      }
    });
    return callback(null);
  }

  initialize(options, callback) {
    this.setupWebApplication(options, callback);
  }

  setupRoutes(callback) {
    const applicationRouter = this.application
      .service('route')
      .getRouter();
    this.webApplication.use(applicationRouter);
    return callback(null);
  }
  getWebApplication() {
    return this.webApplication;
  }

  start(options, callback) {
    const self = this;
    const port = parseInt(this.application.configuration.value('port', '5050'), 10);
    self.setupRoutes((err) => {
      if (err) {
        return callback(err);
      }
      return self.webApplication.listen(port, (errWebApplication) => {
        if (err) {
          Logger.error('Error starting web server', errWebApplication);
          return callback(errWebApplication);
        }
        Logger.info(`Http Server listening at ${port}`);
        return callback(null);
      });
    });
  }
}

module.exports.WebService = WebService;
