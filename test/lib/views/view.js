const assert = require('assert');
const { expect } = require('chai'); // eslint-disable-line
const { View } = require('../../../lib/views/view');
const { Application } = require('../../../lib/application/application');
const path = require('path');
const cheerio = require('cheerio'); // eslint-disable-line

describe('class: View', () => {
  describe('method: render', () => {
    it('should correctly render view', (done) => {
      const application = new Application({
        rootDirectory: path.resolve(__dirname, '../../test_apps/basic_app/'),
        env: 'test',
      });
      application.initializeServices(['asset_pipeline', 'view'], (err) => {
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
        const assetPipelineService = application.service('asset_pipeline');
        const viewService = application.service('view');
        viewService.locals.$fromViewService = 'from_view_service';

        const view = new View({
          layoutFile,
          templateFile,
          variables,
          appRoot,
          format,
          assetPipelineService,
          viewService,
        });
        return view.render((renderError, renderedView) => {
          if (renderError) {
            return done(renderError);
          }
          const $ = cheerio.load(renderedView);
          assert.equal('Application Layout', $('title').text());
          assert.equal('/assets/application.css', $('head').find('link').attr('href'));
          assert.equal('/assets/application.js', $('head').find('script').attr('src'));
          assert.equal('from_base_template_1', $('#from_base_template').text());
          assert.equal('from_view_service', $('#from_view_service').text());
          assert.equal('from_included_template_1', $('#from_included_template').text());
          assert.equal('/assets/pixel.png', $('#pixel').attr('src'));
          assert.equal('blockString1', $('#from_content_for_string_1').text());
          assert.equal('blockString2', $('#from_content_for_string_2').text());
          assert.equal('from_content_for_template_1', $('#from_content_for_template').text().trim());
          return done(null);
        });
      });
    });
  });
});
