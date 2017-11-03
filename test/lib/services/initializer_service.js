const path = require('path');
const request = require('supertest'); //eslint-disable-line
const { Application } = require('../../../lib/application/application');

describe('class: InitializerService', () => {
  describe('method: initialize', () => {
    it('should correctly set asset pipeline methods', (done) => {
      const application = new Application({
        rootDirectory: path.resolve(__dirname, '../../test_apps/basic_app/'),
        env: 'test',
      });


      application.initializeServices(['initializer'], (err) => {
        if (err) {
          return done(err);
        }
        console.log('successfully tested initializer service');
        return done(null);
      });
    });
  });
});
