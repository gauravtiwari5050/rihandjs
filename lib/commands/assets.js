const { Logger } = require('../logging/log');
const _ = require('lodash');
class Assets extends require('./command').Command {
  run(callback) {
    this.application.initializeServices(['asset_pipeline', 'view', 'web'], (err) => {
      if (err) {
        return callback(err);
      }
      let method = this.commandLineOptions._.shift();
      if (_.isEmpty(method)) {
        method = 'help';
      } else if (_.isNil(this[method])) {
        Logger.error(`Invalid command assets ${method}`);
        method = 'help';
      }
      return this[method](callback);
    });
  }

  help(callback) {
    Logger.info('Print assets help here');
    callback(null);
  }

  compile(callback) {
    const assetPipelineService = this.application.service('asset_pipeline');
    const configuration = assetPipelineService.connectAssetsConfiguration();
    configuration.build = true;
    configuration.compile = true;
    configuration.buildDir = this.application.configuration.value('output', configuration.buildDir);
    const connectAssetsInstance = assetPipelineService.newConnectAssetsInstance(configuration);
    connectAssetsInstance.compile((err) => {
      if (err) {
        Logger.error('Error compiling assets', err);
      } else {
        Logger.info('Successfuly compiled assets');
      }
      callback(err);
    });
  }
}

module.exports.Assets = Assets;
