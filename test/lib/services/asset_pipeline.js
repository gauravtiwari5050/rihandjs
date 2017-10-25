const assert = require('assert');
const { expect } = require('chai'); // eslint-disable-line
const path = require('path');
const { Application } = require('../../../lib/application/application');


describe('class: AssetPipelineService', () => {
  describe('method: initialize', () => {
    it('should correctly set asset pipeline methods', (done) => {
      const application = new Application({
        rootDirectory: path.resolve(__dirname, '../../test_apps/basic_app/'),
        env: 'test',
      });

      application.initializeServices(['asset_pipeline'], (err) => {
        if (err) {
          return done(err);
        }
        const assetPipelineService = application.service('asset_pipeline');
        const assetPathFunction = assetPipelineService.assetPath;
        assert.equal('/assets/pixel.png', assetPathFunction.apply(assetPipelineService, ['pixel.png']));
        return done(null);
      });
    });
  });
});
