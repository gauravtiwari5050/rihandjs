const _ = require('lodash');
const upperCamelCase = require('uppercamelcase');
const express = require('express');

/**
 * Class to hold properties for the routes
 */
class RouteProps {
  constructor() {
    this.format = null;
  }
}

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
    this.parent = parent;
    this.constraints = [];
    this.httpMethods = [];
    this.path = path;
    this.controllerName = null;
    this.actionName = null;
    this.props = new RouteProps();

    this.router = null;

    // check of parent exists and has a router to use
    if (!_.isNil(this.parent) && !_.isNil(this.parent.router)) {
      // set current router to use parents router
      this.router = this.parent.router;
    }
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
Route.MIME_TYPES = {
  HTML: 'text/html',
  TEXT: 'text/plain',
  JSON: 'application/json',
  JSONP: 'application/jsonp',
  CSV: 'text/csv',
  XML: 'application/xml',
  RSS: 'application/rss+xml',
  ATOM: 'application/atom+xml',
  YAML: 'text/x-yaml',
};


/**
 *  Class that controls routing in the framework
 *  A singleton of this class will be used
 */
class Namespace {
  /**
   * Constructor for creating a Route instance
   * @constructor
   * @param  {Object} options - Options for creating a routing namespace,
   *                           'options.path' will be used to setup the base route
   */
  constructor(options) {
    if (_.isNil(options)) {
      options = {}; // eslint-disable-line
    }

    this.path = options.path || '/';
    this.parent = options.parent || null;
    this.router = options.router || null;

    // if no router has been passed
    if (_.isNil(this.router)) {
      // check of parent exists and has a router to use
      if (!_.isNil(this.parent) && !_.isNil(this.parent.router)) {
        // set current router to use parents router
        this.router = this.parent.router;
      }
    }
    this.namespaces = [];
    this.routes = [];
    this.constraints = [];
    this.props = new RouteProps();
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
   * A constraint method is a plain javascript function which takes the form (request, callback)
   *
   * @callback constraintMethod
   * @param {Request} request - Request Object given by the web server
   * @param {Function} callback - <p>
   *                                  Callback to be invoked when constraintMethod
   *                                   is done executing
   *                              </p>
   *                              <p>callback(true) Should be true only if constaint is valid</p>
   */

  /**
   * @param  {constraintMethod} constraintMethod - A function/method which will be evaluated before
   *                                                invoking route
   * @return {Namespace} Namespace instance on which constraint was originally called
   */
  constraint(constraintMethod) {
    this.constraints.push(constraintMethod);
  }

  /**
   * @param  {String} path - Setsup route at given path
   * @return {Route} Instance of route
   */
  match(path) {
    const route = new Route(this, path);
    this.routes.push(route);
    return route;
  }

  /**
   * @param  {String} path - Adds a new namespace at given path
   * @return {Namespace} Namespace on which namespace method was called
   */
  namespace(path) {
    const newNamespace = new Namespace({
      path,
      parent: this,
    });
    this.namespaces.push(newNamespace);
    return newNamespace;
  }

  /**
   * getRouter description]
   * @return {[type]} [description]
   */
  getRouter() {
    const expressRouter = express.Router();
  }
}

/**
 * Extend route class with methods to directly call Get/Put/Patch etc
 */
Route.HTTP_METHODS.forEach(function(httpMethod){  // eslint-disable-line
  Namespace.prototype[upperCamelCase(httpMethod)] = function(pathString) { // eslint-disable-line
    const [path, controllerAction] = pathString.split('=>').map((str) => { return str.trim() }); // eslint-disable-line
    if (_.isEmpty(path)) {
      throw new Error(`Invalid path passed while setting ${httpMethod} route : ${pathString}`);
    }
    const route = new Route(this, path.trim());
    route.via(httpMethod);
    if (!_.isEmpty(controllerAction)) {
      route.to(controllerAction.trim());
    }
    this.routes.push(route);
    return route;
  };
});


/**
 * Extend Namespace, Route classes with  methods to set the format
 */
[Namespace, Route].forEach(function(klass){ // eslint-disable-line
  for (const format of Object.keys(Route.MIME_TYPES)) { // eslint-disable-line
    klass.prototype[format.toLowerCase()] = function() { // eslint-disable-line
      this.props.format = format;
      return this;
    };
  }
});

Namespace.instance = null;

Namespace.getInstance = function(opts){ // eslint-disable-line
  if (Namespace.instance === null) {
    Namespace.instance = new Namespace(opts);
  }
  return Namespace.instance;
};

module.exports.Route = Route;
module.exports.Namespace = Namespace;
module.exports.Routes = Namespace;
