const assert = require('assert');
const { expect } = require('chai'); // eslint-disable-line
const { RouteTarget } = require('../../../lib/routing/route_target');
const path = require('path');
const HttpMocks = require('node-mocks-http'); // eslint-disable-line

describe('class: RouteTarget', function() { // eslint-disable-line
  describe('method: isApplicable', function() { // eslint-disable-line
    it('should return isApplicable true', function() { // eslint-disable-line
      const routeTarget = new RouteTarget();
      const request = new HttpMocks.createRequest();  // eslint-disable-line
      routeTarget.constraints.push(function (request) { // eslint-disable-line
        return true;
      });
      assert.equal(true, routeTarget.isApplicable(request));
    });
  });
  describe('method: invoke', function() { // eslint-disable-line
    it('should invoke with mocked request, response', function(done) { // eslint-disable-line
      const routeTarget = new RouteTarget();
      routeTarget.controller = 'test_controller';
      routeTarget.action = 'test_action';
      routeTarget.namespace = '/';
      routeTarget.props.format = 'JSON';
      routeTarget.props.applicationRoot = path.resolve(__dirname, '../../test_apps/basic_app');
      const request = new HttpMocks.createRequest();  // eslint-disable-line
      const response = new HttpMocks.createResponse();  // eslint-disable-line

      routeTarget.invoke({}, request, response, (err) => {
        assert.equal(200, response.statusCode);
        done(err);
      });
    });
  });
});
