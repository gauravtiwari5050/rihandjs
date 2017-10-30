const assert = require('assert');
const path = require('path');
const { Application } = require('../../../lib/application/application');


describe('class: RouteService', () => {
  describe('method: initialize', () => {
    it('should correctly set asset pipeline methods', (done) => {
      const application = new Application({
        rootDirectory: path.resolve(__dirname, '../../test_apps/basic_app/'),
        env: 'test',
      });

      application.initializeServices(['asset_pipeline', 'view', 'route'], (err) => {
        if (err) {
          return done(err);
        }
        const routeService = application.service('route');
        const router = routeService.getRouter();
        return done(null);
      });
    });
  });
});
