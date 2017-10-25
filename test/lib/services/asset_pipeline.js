const assert = require('assert');
const { expect } = require('chai'); // eslint-disable-line
const { View } = require('../../../lib/views/view');
const path = require('path');
const { Application } = require('../../../lib/application/application');
const { AssetPipelineService } = require('../../../lib/services/asset_pipeline_service');

describe('class: AssetPipelineService', () => {
  describe('method: initialize', () => {
    it('should correctly set asset pipeline methods', (done) => {
      const application = new Application({
        rootDirectory: path.resolve(__dirname, '../../test_apps/basic_app/'),
        env: 'test',
      });
      const assetPipelineService = new AssetPipelineService({
        application,
      });
      assetPipelineService.initialize({}, (err) => {
        if (err) {
          return done(err);
        }
        const assetPathFunction = assetPipelineService.assetPath;
        console.log(assetPathFunction.apply(assetPipelineService, ['pixel.png']));
        return done(null);
      });
    });
  });
});
