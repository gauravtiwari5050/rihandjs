const assert = require('assert');
const path = require('path');
const { Application } = require('../../../lib/application/application');


describe('class: QueueService', () => {
  describe('method: initialize', () => {
    it('should correctly set initialize queue service', (done) => {
      const application = new Application({
        rootDirectory: path.resolve(__dirname, '../../test_apps/basic_app/'),
        env: 'test',
      });

      application.initializeServices(['queue'], (err) => {
        if (err) {
          return done(err);
        }
        return done(null);
      });
    });
  });
});
