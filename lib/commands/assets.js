const { Logger } = require('../logging/log');
const _ = require('lodash');
class Assets extends require('./command').Command {
  async run() {
    await this.application.initializeServices(['asset_pipeline', 'view', 'web']);
    let method = this.commandLineOptions._.shift();
    if (_.isEmpty(method)) {
      method = 'help';
    } else if (_.isNil(this[method])) {
      Logger.error(`Invalid command assets ${method}`);
      method = 'help';
    }
    await this[method]();
  }

  async help() {
    Logger.info('Print assets help here');
  }

  async compile() {
    const assetPipelineService = this.application.service('asset_pipeline');
    const configuration = assetPipelineService.connectAssetsConfiguration();
    configuration.build = true;
    configuration.compile = true;
    configuration.buildDir = this.application.configuration.value('output', configuration.buildDir);
    const connectAssetsInstance = assetPipelineService.newConnectAssetsInstance(configuration);
    return new Promise((resolve, reject) => {
      connectAssetsInstance.compile((err) => {
        if (err) {
          Logger.error('Error compiling assets', err);
          return reject(err);
        }
        Logger.info('Successfuly compiled assets');
        return resolve();
      });
    });
  }
}

module.exports.Assets = Assets;
