const assert = require('assert');
const { expect } = require('chai'); // eslint-disable-line
const { View } = require('../../../lib/views/view');
const { Application } = require('../../../lib/application/application');
const { AssetPipelineService } = require('../../../lib/services/asset_pipeline_service');
const path = require('path');

describe('class: View', function() { // eslint-disable-line
  describe('method: render', function() { // eslint-disable-line
    it('should correctly render view', function(done) { // eslint-disable-line
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
        const variables = {
          $var1: 1,
          $var2: 2,
        };
        const layoutFile = 'app/views/layouts/application';
        const templateFile = 'app/views/test/test_html';
        const appRoot = path.resolve(__dirname, '../../test_apps/basic_app/');
        const format = 'HTML';
        const view = new View({
          layoutFile,
          templateFile,
          variables,
          appRoot,
          format,
          assetPipelineService,
        });
        return view.render((renderError, renderedView) => {
          if (renderError) {
            return done(renderError);
          }
          console.log('Rendered View');
          console.log(renderedView);
          return done(null);
        });
      });
    });
  });
});
