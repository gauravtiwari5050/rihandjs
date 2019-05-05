const upperCamelCase = require('uppercamelcase');
const fs = require('fs');
const http = require('http');
const path = require('path');
const https = require('https');
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const connectFlash = require('connect-flash');
const _ = require('lodash');
const { Logger } = require('../logging/log');
const { File } = require('../utils/file');
const vhost = require('vhost');
/**
 * Web Service
 */
class WebService extends require('./service').Service {
  requiredServices() {
    return ['asset_pipeline', 'view', 'route', 'queue', 'mail'];
  }

  async setupHttpServer() {
    this.server = http.createServer(this.webApplication);
  }

  async setupHttpsServer() {
    const environment = this.application.configuration.environment();
    const defaultCertificatesDirectory = `${this.application.root()}/config/ssl/certificates/${environment}`;
    const certPath = this.application.configuration.value(
      'sslCertificate',
      `${defaultCertificatesDirectory}/server.cert`,
    );
    const keyPath = this.application.configuration.value(
      'sslCertificate',
      `${defaultCertificatesDirectory}/server.key`,
    );
    const cert = await File.read(certPath);
    const key = await File.read(keyPath);
    const sslOptions = {
      cert,
      key,
    };
    this.server = https.createServer(sslOptions, this.webApplication);
  }

  async setupServer() {
    this.serverProtocol = 'http';
    const ssl = this.application.configuration.value('ssl', false);
    if (ssl === true) {
      this.serverProtocol = 'https';
    }
    const serverSetupMethod = _.camelCase(`setup-${this.serverProtocol}-server`);
    await this[serverSetupMethod]();
  }

  async setupWebApplication() {
    // create web application using express
    this.webApplication = express();
    this.webApplication.use(cookieParser());
    this.webApplication.use(connectFlash());
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
      .use(bodyParser.urlencoded({ extended: true }))
      .use(compression());
    const staticFilesDirectory = path.resolve(
      this.application.root(),
      this.application.configuration.value('staticDirectory', 'public'),
    );
    this.webApplication.use(express.static(staticFilesDirectory));
    // mount additional static directories
    const staticDirectoriesConfigurationFile = path.resolve(
      this.application.root(),
      './config/static_directories.yml',
    );
    if ((await File.exists(staticDirectoriesConfigurationFile)) === true) {
      const staticDirectoriesConfiguration = await File.readYaml(
        staticDirectoriesConfigurationFile,
      );
      const envStaticDirectories = staticDirectoriesConfiguration[this.application.configuration.environment()] || [];
      
      for (const staticDirectory of envStaticDirectories) {
        const resolvedPath = path.resolve(
          this.application.root(),
          `.${staticDirectory.path}`,
        );
        console.log(resolvedPath);
        this.webApplication.use(staticDirectory.mount, express.static(resolvedPath));
      }
    }
    const connectAssetsInstance = this.application
      .service('asset_pipeline')
      .getConnectAssetsInstance();
    this.webApplication.use(connectAssetsInstance);
  }

  async initialize(options) {
    await this.setupWebApplication(options);
  }

  async setupRoutes() {
    const routeService = this.application.service('route');
    await routeService.setup(this.webApplication);
  }
  getWebApplication() {
    return this.webApplication;
  }

  async start() {
    const port = parseInt(this.application.configuration.value('port', '5050'), 10);
    await this.setupRoutes();
    await this.setupServer();
    console.log('Starting web server');
    return new Promise((resolve, reject) => {
      this.server.listen(port, (errWebApplication) => { // eslint-disable-line
        if (errWebApplication) {
          Logger.error('Error starting web server', errWebApplication);
          return reject(errWebApplication);
        }
        Logger.info(`${this.serverProtocol} server listening at ${port}`);
      });
    });
  }
}

module.exports.WebService = WebService;
