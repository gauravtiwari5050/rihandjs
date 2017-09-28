const _ = require('lodash');
/**
 * Class to handle information about specific route
 */
class Route {
  /**
   * @param  {string} path - Constructor takes in route path
   */
  constructor(path) {
    if (_.isNil(path)) {
      throw new Error('Path is need while setting up route');
    }
    this.constraints = [];
    this.restMethods = [];
    this.path = path;
    this.controllerName = null;
    this.actionName = null;
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
}

/**
 *  Class that controls routing in the framework
 *  A singleton of this class will be used
 */
class Namespace {
  /**
   * Constructor for creating a Route instance
   * @constructor
   * @param  {Object} options - Options for creating a routing namespace,
   *                           'options.namespaceIdentifier' will be used to setup the base route
   */
  constructor(options) {
    this.namespaceIdentifier = options.namespaceIdentifier || '/';
    this.namespaces = [];
    this.routes = [];
    this.constraints = [];
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

  match(path) {
    const route = new Route(path);
    this.routes.push(route);
    return route;
  }
}


Namespace.instance = null;

Namespace.getInstance = function(opts){ // eslint-disable-line
  if (Namespace.instance === null) {
    Namespace.instance = new Namespace(opts);
  }
  return Namespace.instance;
};

module.exports.Routes = Namespace;
