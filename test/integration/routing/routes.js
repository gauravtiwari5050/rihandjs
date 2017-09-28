const assert = require('assert');
const Rihand = require('../../../index.js');

describe('integration: Routes', () => {
  describe('method: loadRoutes', () => {
    Rihand.Routes.instance = null;
    it('should loadRoutes correctly', () => {
      require('../../test_apps/basic_app/config/routes').loadRoutes();
      const rootNamespace = Rihand.Routes.getInstance();
      assert.equal(1, rootNamespace.namespaces.length);
      assert.equal(1, rootNamespace.routes.length);
      const apiNamespace = rootNamespace.namespaces[0];
      assert.equal('JSON', apiNamespace.props.format);
    });
  });
});
