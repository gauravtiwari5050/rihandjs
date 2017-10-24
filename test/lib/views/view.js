const assert = require('assert');
const { expect } = require('chai'); // eslint-disable-line
const { View } = require('../../../lib/views/view');
const path = require('path');

describe('class: View', function() { // eslint-disable-line
  describe('method: render', function() { // eslint-disable-line
    it('should correctly render view', function(done) { // eslint-disable-line
      
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
      });
      view.render((err, renderedView) => {
        if (err) {
          return done(err);
        }
        console.log("Rendered View");
        console.log(renderedView);
        return done(null);
      });
    });
  });
});
