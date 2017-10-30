const assert = require('assert');
const Rihand = require('../../../index.js');
const express = require('express');
const request = require('supertest'); //eslint-disable-line
const path = require('path');
const { Application } = require('../../../lib/application/application');

describe('integration: Route', () => {
  const application = new Application({
    rootDirectory: path.resolve(__dirname, '../../test_apps/basic_app/'),
    env: 'test',
  });
  before((done) => {
    application.initializeServices(['asset_pipeline', 'view'], (err) => {
      done(err);
    });
  });
  describe('method: loadRoute', () => {
    it('should loadRoute correctly', () => {
      Rihand.Route.instance = null;
      require('../../test_apps/basic_app/config/routes').loadRoutes();
      const rootNamespace = Rihand.Route.getInstance();
      assert.equal(1, rootNamespace.namespaces.length);
      assert.equal(2, rootNamespace.routes.length);
      const apiNamespace = rootNamespace.namespaces[0];
      assert.equal('json', apiNamespace.props.format);
    });
  });

  describe('method: getRouteTable', () => {
    it('should return valid RouteTable instance', () => {
      Rihand.Route.instance = null;
      require('../../test_apps/basic_app/config/routes').loadRoutes();
      const rootNamespace = Rihand.Route.getInstance();
      const routeTable = rootNamespace.getRouteTable();
      assert.equal(2, routeTable.entries.length);
      assert.equal(2, routeTable.entries[0].targets.length);
      assert.equal(1, routeTable.entries[1].targets.length);
    });
  });

  describe('method: getRouter', () => {
    it('should return valid Router instance', (done) => {
      const rootNamespace = new Rihand.Route('/');
      rootNamespace.setApplication(application);
      /*
        Set up the routes first
       */
      rootNamespace.setup(function () {
        this.Get('/ => test#root_valid');
      });
      const router = rootNamespace.getRouter();
      const app = express();
      app.use('/', router);
      request(app)
        .get('/')
        .expect(200)
        .end((err) => {
          done(err);
        });
    });
  });
});
