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

  async setupWebApplication() {
    // create web application using express
    this.webApplication = express();
    this.webApplication.use(cookieParser());
    const { secretKey } = await this.application
      .configuration
      .getYamlConfig('secrets.yml');
    if (_.isNil(secretKey)) {
      throw new Error('secretKey not found in config/secrets.yml');
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
    const connectAssetsInstance = this.application
      .service('asset_pipeline')
      .getConnectAssetsInstance();
    this.webApplication.use(connectAssetsInstance);
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

  async initialize(options) {
    await this.setupWebApplication(options);
  }

  setupRoutes() {
    const routeService = this.application.service('route');
    const applicationRouter = routeService.getRouter();
    _.map(routeService.getMountedEngines(), (mount) => {
      mount.method(this.webApplication);
    });
    this.webApplication.use(applicationRouter);
  }
  getWebApplication() {
    return this.webApplication;
  }

  async start() {
    const port = parseInt(this.application.configuration.value('port', '5050'), 10);
    await this.setupRoutes();
    console.log('Starting web server');
    return new Promise((resolve, reject) => {
      this.webApplication.listen(port, (errWebApplication) => { // eslint-disable-line
        if (errWebApplication) {
          Logger.error('Error starting web server', errWebApplication);
          return reject(errWebApplication);
        }
        Logger.info(`Http Server listening at ${port}`);
      });
    });
  }
}

module.exports.WebService = WebService;
