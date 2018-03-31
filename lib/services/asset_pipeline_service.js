const connectAssets = require('connect-assets');
const _ = require('lodash');
const path = require('path');
/**
 * AssetPipelineService
 */
class AssetPipelineService extends require('./service').Service {
  connectAssetsConfiguration() {
    const self = this;
    const configuration = {};

    // set paths fcontaining asset directories
    configuration.paths = [
      'app/assets/javascripts',
      'app/assets/stylesheets',
      'app/assets/images',
      'app/assets/fonts',
    ];
    configuration.paths = configuration.paths.concat(
      this.application.configuration.value('asset_directories'),
      [],
    );
    configuration.paths = _.compact(configuration.paths); // TODO remove this
    configuration.paths = _.map(configuration.paths, function (filePath) { //eslint-disable-line
      return path.resolve(self.application.root(), filePath);
    });

    // set compile to false by default in production environment
    configuration.compile = this.application.configuration.value('compileAssets', false);

    // write assets to disk in production environment
    configuration.build = this.application.configuration.value('writeAssetsToDisk', true);

    // set fingerprint to true by default
    configuration.fingerprinting = this.application.configuration.value('fingerprintAssets', true);

    const assetHost = this.application.configuration.value('assetHost');
    const assetPath = this.application.configuration.value('assetPath', 'assets');

    if (assetHost) {
      configuration.servePath = `${assetHost}/${assetPath}`;
    }

    configuration.buildDir = `public/${assetPath}`;
    configuration.precompile = ['*.*'];

    return configuration;
  }

  assetPath(...args) {
    return this
      .connectAssetsInstance
      .options
      .helperContext
      .assetPath
      .apply(this, args);
  }
  css(...args) {
    return this
      .connectAssetsInstance
      .options
      .helperContext
      .css
      .apply(this, args);
  }

  js(...args) {
    return this
      .connectAssetsInstance
      .options
      .helperContext
      .js
      .apply(this, args);
  }


  newConnectAssetsInstance(configuration) {
    return connectAssets(configuration);
  }
  async initialize() {
    this.connectAssetsInstance = this.newConnectAssetsInstance(this.connectAssetsConfiguration());
  }

  getConnectAssetsInstance() {
    return this.connectAssetsInstance;
  }
}

module.exports.AssetPipelineService = AssetPipelineService;
