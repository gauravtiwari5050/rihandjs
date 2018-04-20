const _ = require('lodash');
const formic = require('formic');
const { Route } = require('../routing/routes');
const { View } = require('../views/view');
const { cleanPathUrl } = require('../utils/helper');
/**
 * Base class for all controllers
 */
class Controller {
  /**
   * creates an instance of controller
   * @param  {[type]} options [description]
   * @return {[type]}         [description]
   */
  constructor(options) {
    const self = this;
    if (_.isNil(options)) {
      options = {}; // eslint-disable-line
    }

    /*
      set up internal variables from passed options
     */
    Object.keys(options).forEach((key) => {
      this[key] = options[key];
    });

    self.internalVariablePrefix = self.internalVariablePrefix || '$';
  }
  /**
   * adds before filter for current controller
   * @param  {string} method - method(s) in the controller which need to be executed as prefilter
   * @param  {Object} options - a hash with "only", "except" arrays of action names
   *                            to choose specific action(s) before which before filters
   *                            will be executed
   */
  static beforeFilter(method, options) {
    const qualifiedName = this.getInheritanceChain().join('-');
    this.insertFilter('BEFORE', qualifiedName, method, options);
  }

  /**
   * adds after filter for current controller
   * @param  {string} method - method(s) in the controller which need to be executed as postfilter
   * @param  {Object} options - a hash with "only", "except" arrays of action names
   *                            to choose specific action(s) after which after filters
   *                            will be executed
   */
  static afterFilter(method, options) {
    const qualifiedName = this.getInheritanceChain().join('-');
    this.insertFilter('AFTER', qualifiedName, method, options);
  }

  /**
   * adds 'at' filter for current controller
   * @param  {string} method - method(s) in the controller which need to be executed as 'at' filter
   * @param  {Object} options - a hash with "only", "except" arrays of action names
   *                            to choose specific action(s) 'at' which 'at' filters
   *                            will be executed
   */
  static insertFilter(at, callerControllerName, method, options) {
    const controllerBeforeFilters = Controller.filters[at][callerControllerName] || [];

    let methods = [];
    if (method instanceof Array) {
      methods = method;
    } else {
      methods.push(method);
    }

    methods.forEach((meth) => {
      const invokeObject = {
        method: meth,
        options: _.extend({ only: [], except: [] }, options),
      };

      controllerBeforeFilters.push(invokeObject);
    });

    Controller.filters[at][callerControllerName] = controllerBeforeFilters;
  }

  static getInheritanceChainForControllerObject(controllerObject, chainOfClasses) {
    const chain = [];
    let instanceProto = Object.getPrototypeOf(controllerObject);
    let Klass = instanceProto.constructor;
    while (Klass.name !== 'Controller' && Klass.name !== 'Object') {
      if (chainOfClasses === true) {
        chain.push(Klass);
      } else {
        chain.push(Klass.name);
      }
      instanceProto = Object.getPrototypeOf(instanceProto);
      Klass = instanceProto.constructor;
    }
    return chain;
  }

  static getInheritanceChain() {
    const Klass = this;
    const controllerObject = new Klass();
    return Controller.getInheritanceChainForControllerObject(controllerObject);
  }

  /**
   * gets an array of class from which the current class is being inherited
   * @return {Array} classNames
   */
  getInheritanceChain(chainOfClasses) {
    return Controller.getInheritanceChainForControllerObject(this, chainOfClasses);
  }

  /**
   * gets actions to be run 'at' given actionName
   * @param  {string} at - BEFORE / AFTER
   * @param  {string} actionName
   * @return {Array} actionNames
   */
  getFilters(at, actionName) {
    let filters = [];
    const allFilters = Controller.filters[at];
    const inheritanceChain = this.getInheritanceChain(true);
    inheritanceChain.forEach((controllerName) => {
      const Klass = controllerName;
      const controllerObject = new Klass();
      const qualifiedName = controllerObject.getInheritanceChain().join('-');
      const controllerFilters = allFilters[qualifiedName] || [];
      filters = filters.concat(controllerFilters.slice().reverse());
    });
    filters = _.uniqWith(filters, (x, y) => { // eslint-disable-line
      return (x.method === y.method);
    });

    const filtersInUse = _.map(filters, (filter) => {
      const { method } = filter;
      const only = filter.options.only || [];
      const except = filter.options.except || [];

      let use = null;
      if (only.length === 0) {
        use = true;
      }
      if (only.length > 0 && _.includes(only, actionName)) {
        use = true;
      }

      if (except.length > 0 && _.includes(except, actionName)) {
        use = false;
      }

      if (use === true) {
        return method;
      }
      return null;
    });


    return _.compact(filtersInUse).reverse();
  }

  /**
   * gets actions to be run before given actionName
   * @param  {string} actionName
   * @return {Array} actionNames
   */
  getBeforeFilters(actionName) {
    return this.getFilters('BEFORE', actionName);
  }

  /**
   * gets actions to be run after given actionName
   * @param  {string} actionName
   * @return {Array} actionNames
   */
  getAfterFilters(actionName) {
    return this.getFilters('AFTER', actionName);
  }

  /**
   * get a json consisting of all view variables
   * view variables are the variables that will be available to the views while rendering
   * view variables start with @ and has a single @
   * @return {[type]}
   */
  getViewVariables() {
    const self = this;
    let keys = Object.keys(this);
    keys = _.filter(keys, (key) => { // eslint-disable-line
      return key.startsWith(self.internalVariablePrefix);
    });

    // pick view variables and leave internal variables of type @__xxx
    const viewVariables = {};

    for (var key of keys) { // eslint-disable-line
      viewVariables[key] = this[key];
    }

    return viewVariables;
  }

  /**
   * returns json object to be used while rendering views
   * @return {Object}
   */
  getJson() {
    const key = 'json';
    if (!_.isNil(this[key])) {
      return this[key];
    }
    return this.getViewVariables();
  }

  renderTemplatizedView(request, response, next) {
    const variables = _.extend({
      request,
      response,
      controller: this.controller,
      action: this.action,
    }, this.getViewVariables());
    variables.formFor = (object) => {
      const formFor = new formic.FormFor(object);
      formFor.hidden('utf8', '✓');
      formFor.hidden('_csrf', request.csrfToken());
      return formFor;
    };
    let { layout } = this;
    if (_.isUndefined(layout)) {
      layout = this.controllerLayout();
    }
    if (_.isUndefined(layout)) {
      layout = this.defaultLayout;
    }
    let layoutFile = cleanPathUrl(`app/views/layouts/${layout}`);
    if (_.isNil(layout)) {
      layoutFile = null;
    }
    const templateFile = cleanPathUrl(`app/views/${this.namespace}/${this.controller}/${this.action}`);
    const appRoot = this.application.root();
    let { format } = this;
    format = format || this.props.format || 'html';
    const assetPipelineService = this.application.service('asset_pipeline');
    const viewService = this.application.service('view');
    const view = new View({
      layoutFile,
      templateFile,
      variables,
      appRoot,
      format,
      assetPipelineService,
      viewService,
    });
    return view.render((renderError, renderedView) => {
      if (renderError) {
        return next(renderError);
      }
      const mimeObject = Route.getMimeObject(format);
      return this.writeResponse(
        {
          payload: renderedView,
          content_type: mimeObject.content_type,
        },
        request,
        response,
        next,
      );
    });
  }
  renderResponse(request, response, next) {
    const format = this.format || this.props.format || 'html';
    const mimeObject = Route.getMimeObject(format);
    if (_.isNil(mimeObject)) {
      const errorObject = {
        code: 400,
        payload: `Unrecognized format ${format}`,
      };
      return this.sendError(errorObject, request, response, next);
    }
    if (mimeObject.template === true) {
      return this.renderTemplatizedView(request, response, next);
    } else { //eslint-disable-line
      const renderedObject = JSON.stringify(this.getJson());
      return this.writeResponse(
        {
          payload: renderedObject,
          content_type: mimeObject.content_type,
          noResponse: this.noResponse,
        },
        request,
        response,
        next,
      );
    }
  }

  sendError(errorObject, request, response, next) {  // eslint-disable-line
    response.status(errorObject.code || 500);
    response.set('Content-Type', errorObject.content_type || 'text/plain; charset=utf-8');
    response.send(errorObject.payload);
    return next(null);
  }

  writeResponse(responseObject, request, response, next) {
    if (responseObject.noResponse === true) {
      return;
    }
    response.status(responseObject.code || this.response_code || 200);
    response.header('Content-Type', responseObject.content_type);
    response.send(responseObject.payload);
  }

  controllerLayout() {
    return undefined;
  }
}


/**
 * static member to keep the filter chain for all controllers
 * @type {Object}
 */
Controller.filters = {
  BEFORE: {},
  AFTER: {},
};

module.exports.Controller = Controller;
