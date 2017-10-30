const assert = require('assert');
const { expect } = require('chai'); // eslint-disable-line
const { Route } = require('../../../lib/routing/routes');

describe('class: Route', function() { // eslint-disable-line
  describe('method: constructor', function() { // eslint-disable-line
    it('should throw exception if path is not provided', function() { // eslint-disable-line
      expect(() => new Route()).to.throw();
    });

    it('should correctly set path provided', function() { // eslint-disable-line
      const route = new Route('/path');
      assert.equal('/path', route.path);
    });
  });

  describe('method: controller', function() { // eslint-disable-line
    const route = new Route('/path');
    it('should correctly set controller', function() { // eslint-disable-line

      route.controller('controllerName');
      assert.equal('controllerName', route.controllerName);
    });
  });
  describe('method: action', function() { // eslint-disable-line
    const route = new Route('/path');
    it('should correctly set action', function() { // eslint-disable-line

      route.action('actionName');
      assert.equal('actionName', route.actionName);
    });
  });

  describe('method: to', function() { // eslint-disable-line
    const route = new Route('/path');
    it('should correctly set controller and  action', function() { // eslint-disable-line
      route.to('controller#action');
      assert.equal('controller', route.controllerName);
      assert.equal('action', route.actionName);
    });
  });

  describe('method: via', function() { // eslint-disable-line
    const route = new Route('/path');
    it('should throw exception if called without arguments', function() { // eslint-disable-line
      expect(() => route.via()).to.throw();
    });
    it('should throw exception if called with invalid http method', function() { // eslint-disable-line
      expect(() => route.via('random')).to.throw();
    });
    it('should not throw exception if called with valid http method', function() { // eslint-disable-line
      expect(() => route.via('get')).to.not.throw();
    });
    it('should correctly update rest methods', function() { // eslint-disable-line
      route.via('get');
      assert.deepEqual(['GET'], route.httpMethods);

      route.via('put').via('post', 'patch');
      assert.deepEqual(['GET', 'PUT', 'POST', 'PATCH'], route.httpMethods);
    });
  });
});
