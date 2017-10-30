const assert = require('assert');
const { RouteTarget } = require('../../../lib/routing/route_target');
const path = require('path');
const HttpMocks = require('node-mocks-http'); // eslint-disable-line
const { Application } = require('../../../lib/application/application');

describe('class: RouteTarget', () => {
  const application = new Application({
    rootDirectory: path.resolve(__dirname, '../../test_apps/basic_app/'),
    env: 'test',
  });
  before((done) => {
    application.initializeServices(['asset_pipeline', 'view'], (err) => {
      done(err);
    });
  });

  describe('method: isApplicable', () => {
    it('should return isApplicable true', () => {
      const routeTarget = new RouteTarget();
      const request = new HttpMocks.createRequest();  // eslint-disable-line
      routeTarget.constraints.push(function (request) { // eslint-disable-line
        return true;
      });
      assert.equal(true, routeTarget.isApplicable(request));
    });
  });
  describe('method: invoke', () => {
    it('should check response from internalVariable', function(done) { // eslint-disable-line
      const routeTarget = new RouteTarget();
      routeTarget.controller = 'test';
      routeTarget.action = 'test_action';
      routeTarget.namespace = '/';
      routeTarget.props.format = 'JSON';
      routeTarget.props.application = application;
      const request = new HttpMocks.createRequest();  // eslint-disable-line
      const response = new HttpMocks.createResponse();  // eslint-disable-line
      routeTarget.invoke({}, request, response, (err) => {
        assert.equal('application/json', response.getHeader('Content-Type'));
        assert.equal(200, response.statusCode);
        const data = JSON.parse(response._getData()); // eslint-disable-line
        assert.equal(1, data.$var1);
        done(err);
      });
    });
    it('should check response from internalVariable', function(done) { // eslint-disable-line
      const routeTarget = new RouteTarget();
      routeTarget.controller = 'test';
      routeTarget.action = 'test_action_json';
      routeTarget.namespace = '/';
      routeTarget.props.format = 'JSON';
      routeTarget.props.application = application;
      const request = new HttpMocks.createRequest();  // eslint-disable-line
      const response = new HttpMocks.createResponse();  // eslint-disable-line
      routeTarget.invoke({}, request, response, (err) => {
        assert.equal('application/json', response.getHeader('Content-Type'));
        assert.equal(200, response.statusCode);
        const data = JSON.parse(response._getData()); // eslint-disable-line
        assert.equal(1, data.var1);
        done(err);
      });
    });
    it('should check response for  valid html', function(done) { // eslint-disable-line
      application.service('view').locals.$fromViewService = 'fromViewService';
      const routeTarget = new RouteTarget();
      routeTarget.controller = 'test';
      routeTarget.action = 'test_html_route_target';
      routeTarget.namespace = '/';
      routeTarget.props.format = 'HTML';
      routeTarget.props.application = application;
      routeTarget.props.layout = 'route_target_test';
      const request = new HttpMocks.createRequest();  // eslint-disable-line
      const response = new HttpMocks.createResponse();  // eslint-disable-line
      return routeTarget.invoke({}, request, response, (errRouteTarget) => {
        assert.equal('text/html; charset=utf-8', response.getHeader('Content-Type'));
        assert.equal(200, response.statusCode);
        done(errRouteTarget);
      });
    });
  });
});
