const _ = require('lodash');
const upperCamelCase = require('uppercamelcase');
const { RouteTable } = require('./route_table');

/**
 * Class to handle information about specific route
 */
class Route {
  /**
   * @return {Array} supported http httpMethods
   */
  static httpMethods() {
    return Route.HTTP_METHODS;
  }

  /**
   * @return {Object} supported mime types
   */
  static mimeTypes() {
    return Route.MIME_TYPES;
  }

  static getMimeObject(format) { // eslint-disable-line
    return _.find(Route.MIME_TYPES, (mimeType) => {
      const extension = _.find(mimeType.extensions, (ext) => { // eslint-disable-line
        return ext.toLowerCase() === format.toLowerCase();
      });
      return !_.isNil(extension);
    });
  }
  /**
   * @param  {string} path - Constructor takes in route path
   */
  constructor(parent, path) {
    if (_.isNil(path)) {
      path = parent; // eslint-disable-line
      parent = null; // eslint-disable-line
    }

    if (_.isNil(path)) {
      throw new Error('Path is need while setting up route');
    }
    this.category = null;
    this.parent = parent;
    this.constraints = [];
    this.httpMethods = [];
    this.path = path;
    this.controllerName = null;
    this.actionName = null;
    let parentProps = {};
    if (!_.isNil(parent)) {
      parentProps = parent.props;
    }
    this.props = _.extend({
      defaultLayout: 'application',
      internalVariablePrefix: '$',
      format: 'html',
    }, parentProps);
    this.children = [];
    this.mountedEngines = [];
  }


  /**
  * Setup routes in a namespace
  * @param  {Function} method - A function/method to be run in the context of the namespace
  * @return {Namespace} Namespace instance on which setup was originally called
  */
  setup(method) {
    method.call(this);
  }

  /**
  * @param  {String} path - Adds a new namespace at given path
  * @return {Namespace} Namespace on which namespace method was called
  */
  namespace(path) {
    const child = new Route(this, path);
    child.category = 'NAMESPACE';
    this.children.push(child);
    return child;
  }

  /**
   * @param  {string} controllerName - Sets controller file for the route
   * @return {Route} Route instance on which controller was set
   */
  controller(controllerName) {
    this.controllerName = controllerName;
    return this;
  }

  /**
   * @param  {string} actionName - Sets action for the route
   * @return {Route} Route instance on which action was called
   */
  action(actionName) {
    this.actionName = actionName;
    return this;
  }

  /**
   * @param  {string} controllerAction - Takes a string of the form 'controllerName#actionName'
   * @return {Route} Route instance on which 'to' was called
   */
  to(controllerAction) {
    if (_.isNull(controllerAction)) {
      throw new Error("'to' call to route needs 'controller#action'");
    }
    const [controllerName, actionName] = controllerAction.split('#');
    this.controllerName = controllerName;
    this.actionName = actionName;
    return this;
  }

  /**
   * @param { Array } httpMethods -  Comma seperated list of http methods
   * @return {Route} Route instance on which via was called
   */
  via(...args) {
    const self = this;
    if (args.length === 0) {
      throw new Error("'via' call expects at least one argument with http method");
    }
    args.forEach(function(httpMethod){ // eslint-disable-line
      httpMethod = httpMethod.toUpperCase();  // eslint-disable-line
      if (!Route.httpMethods().includes(httpMethod)) {
        throw new Error(`${httpMethod} is not supported by Rihand`);
      }

      self.httpMethods.push(httpMethod);
      self.httpMethods = _.uniq(self.httpMethods);
    });
    return this;
  }

  /**
   * returns the final path on which this route should be mounted
   */
  resolvePath() {
    let resolvedPath = '';
    if (!_.isNil(this.parent)) {
      resolvedPath += `${this.parent.resolvePath()}/`;
    }

    resolvedPath += this.path;
    return resolvedPath; // replace : so that directory structures can be resolved correctly
  }

  resolveProps() {
    let resolvedProps = {};
    if (!_.isNil(this.parent)) {
      resolvedProps = _.extend(resolvedProps, this.parent.resolveProps());
    }
    _.extend(resolvedProps, this.props);
    return resolvedProps;
  }

  resolveConstraints() {
    const resolvedConstraints = [];
    if (!_.isNil(this.parent)) {
      this.parent.resolveConstraints().forEach((constraint) => {
        resolvedConstraints.push(constraint);
      });
    }
    this.constraints.forEach((constraint) => {
      resolvedConstraints.push(constraint);
    });
    return resolvedConstraints;
  }

  constraint(constraintMethod) {
    this.constraints.push(constraintMethod);
    return this;
  }

  get namespaces() {
    return _.filter(this.children, (child) => {  // eslint-disable-line
      return child.category === 'NAMESPACE';
    });
  }

  get routes() {
    return _.filter(this.children, (child) => {  // eslint-disable-line
      return child.category === 'ROUTE';
    });
  }


  /**
   * [extendRouteTable description]
   * @param  {[type]} routeTable [description]
   * @return {[type]}            [description]
   */
  extendRouteTable(routeTable) {
    routeTable.use(this);
    this.children.forEach((child) => {
      child.extendRouteTable(routeTable);
    });
  }


  /**
  * getRouteTable returns RouteTable for a given namespace
  * @return {RouteTable}
  */
  getRouteTable() {
    const routeTable = new RouteTable();
    this.extendRouteTable(routeTable);
    return routeTable;
  }
  /**
  * getRouter description]
  * @return {[type]} [description]
  */
  getRouter() {
    const routeTable = this.getRouteTable();
    return routeTable.getRouter();
  }

  setApplication(application) {
    this.props.application = application;
  }

  Mount(method) {
    this.mountedEngines.push({
      method,
    });
  }
}

/**
 * HTTP_METHODS httpMethods valid for Rihand
 * @type {Array}
 */
Route.HTTP_METHODS = ['GET', 'PUT', 'POST', 'DELETE', 'UPDATE', 'PATCH'];

/**
 * MIME_TYPES mime types recognized by Rihand by default
 * @type {Object}
 */
Route.MIME_TYPES = [
  {
    template: true,
    extensions: ['html', 'htm'],
    content_type: 'text/html; charset=utf-8',
  },
  {
    template: true,
    extensions: ['text', 'txt'],
    content_type: 'text/plain; charset=utf-8',
  },
  {
    template: false,
    extensions: ['js', 'json'],
    content_type: 'application/json',
  },
  {
    template: true,
    extensions: ['csv'],
    content_type: 'text/csv; charset=utf-8',
  },
  {
    template: true,
    extensions: ['xml'],
    content_type: 'application/xml',
  },
  {
    template: true,
    extensions: ['rss'],
    content_type: 'application/rss+xml',
  },
  {
    template: true,
    extensions: ['atom'],
    content_type: 'application/atom+xml',
  },
  {
    template: false,
    extensions: ['yaml'],
    content_type: 'text/x-yaml; charset=utf-8',
  },
];

/**
 * Extend route class with methods to directly call Get/Put/Patch etc
 */
Route.HTTP_METHODS.forEach(function(httpMethod){  // eslint-disable-line
  Route.prototype[upperCamelCase(httpMethod)] = function(pathString) { // eslint-disable-line
    const [path, controllerAction] = pathString.split('=>').map((str) => { return str.trim() }); // eslint-disable-line
    if (_.isEmpty(path)) {
      throw new Error(`Invalid path passed while setting ${httpMethod} route : ${pathString}`);
    }
    const route = new Route(this, path.trim());
    route.via(httpMethod);
    if (!_.isEmpty(controllerAction)) {
      route.to(controllerAction.trim());
    }
    route.category = 'ROUTE';
    this.children.push(route);
    return route;
  };
});


/**
 * Extend Route, Route classes with  methods to set the format
 */

[Route].forEach(function(klass){ // eslint-disable-line
  Route.MIME_TYPES.forEach((mimeType) => {
    const extensions = mimeType.extensions || [];
    extensions.forEach((extension) => {
      klass.prototype[extension.toLowerCase()] = function() { // eslint-disable-line
        this.props.format = extension.toLowerCase();
        return this;
      };
    });
  });
});

global.rihandRouteInstances = {};

Route.getInstance = function(id){ // eslint-disable-line
  if (_.isNil(id)) {
    id = '__PRIMARY__';
  }
  if (_.isNil(global.rihandRouteInstances[id])) {
    global.rihandRouteInstances[id] = new Route('/');
  }
  return global.rihandRouteInstances[id];
};

Route.clearInstance = function(id){ // eslint-disable-line
  if (_.isNil(id)) {
    id = '__PRIMARY__';
  }
  global.rihandRouteInstances[id] = null;
};


module.exports.Route = Route;

