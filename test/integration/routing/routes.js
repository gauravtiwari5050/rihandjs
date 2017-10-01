const assert = require('assert');
const Rihand = require('../../../index.js');

describe('integration: Routes', () => {
  describe('method: loadRoutes', () => {
    it('should loadRoutes correctly', () => {
      Rihand.Routes.instance = null;
      require('../../test_apps/basic_app/config/routes').loadRoutes();
      const rootNamespace = Rihand.Routes.getInstance();
      assert.equal(1, rootNamespace.namespaces.length);
      assert.equal(1, rootNamespace.routes.length);
      const apiNamespace = rootNamespace.namespaces[0];
      assert.equal('JSON', apiNamespace.props.format);
    });
  });

  describe('method: getRouteTable', () => {
    it('should return valid RouteTable instance', () => {
      Rihand.Routes.instance = null;
      require('../../test_apps/basic_app/config/routes').loadRoutes();
      const rootNamespace = Rihand.Routes.getInstance();
      const routeTable = rootNamespace.getRouteTable();
      console.log("Route table entries");
      console.log(routeTable.entries);
    });
  });
});
