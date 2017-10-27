const path = require('path');
const request = require('supertest'); //eslint-disable-line
const { Application } = require('../../../lib/application/application');


describe('class: RouteService', () => {
  describe('method: initialize', () => {
    it('should correctly set asset pipeline methods', (done) => {
      const application = new Application({
        rootDirectory: path.resolve(__dirname, '../../test_apps/basic_app/'),
        env: 'test',
      });

      application.initializeServices(['asset_pipeline', 'view', 'route', 'web'], (err) => {
        if (err) {
          return done(err);
        }
        const webService = application.service('web');
        webService.setupRoutes((errSetupRoutes) => {
          if (errSetupRoutes) {
            return done(errSetupRoutes);
          }
          const webApplication = webService.getWebApplication();
          return request(webApplication)
            .get('/')
            .expect(200)
            .end((errSuperTest, response) => {
              done(errSuperTest);
            });
        });
      });
    });
  });
});
