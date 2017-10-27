const assert = require('assert');
const { expect } = require('chai'); // eslint-disable-line
const { Route } = require('../../../lib/routing/routes');

describe('class: Route', function() { // eslint-disable-line
  const httpMethods = ['Get', 'Put', 'Patch', 'Delete', 'Update'];

  describe('method: constructor', function() { // eslint-disable-line
    it('should correctly set path', function() { // eslint-disable-line
      let namespace = new Route('/');
      assert.equal('/', namespace.path);
      namespace = new Route('/path');
      assert.equal('/path', namespace.path);
    });
  });
  describe('method: html', function() { // eslint-disable-line
    it('should set html as routeprops format', function() { // eslint-disable-line
      const namespace = new Route('/html');
      namespace.html();
      assert.equal('html', namespace.props.format);
    });
  });
  describe('method: json', function() { // eslint-disable-line
    it('should set json as routeprops format', function() { // eslint-disable-line
      const namespace = new Route('/json');
      namespace.json();
      assert.equal('json', namespace.props.format);
    });
  });
  describe(`methods: ${httpMethods}`, function() { // eslint-disable-line
    it('should setup routes with relevant methods', function() { // eslint-disable-line
      httpMethods.forEach(function(httpMethod){ // eslint-disable-line
        const namespace = new Route('/');
        namespace[httpMethod]('/path => controller#action');
        assert.equal(1, namespace.routes.length);
        let path = namespace.routes[0];
        assert.equal('/path', path.path);
        assert.deepEqual([httpMethod.toUpperCase()], path.httpMethods);
        namespace[httpMethod]('/path2');
        assert.equal(2, namespace.routes.length);
        path = namespace.routes[1]; // eslint-disable-line
        assert.equal('/path2', path.path);
      });
    });
  });
});
