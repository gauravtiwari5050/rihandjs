const _ = require('lodash');
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
    self.internalVariablePrefix = options.internalVariablePrefix || '@';

    /*
      set up internal variables from passed options
     */
    Object.keys(options).forEach((key) => {
      this[`${self.internalVariablePrefix}${self.internalVariablePrefix}@${key}`] = options[key];
    });
  }
  /**
   * adds before filter for current controller
   * @param  {string} method - method(s) in the controller which need to be executed as prefilter
   * @param  {Object} options - a hash with "only", "except" arrays of action names
   *                            to choose specific action(s) before which before filters
   *                            will be executed
   */
  static beforeFilter(method, options) {
    Controller.insertFilter('BEFORE', this.name, method, options);
  }

  /**
   * adds after filter for current controller
   * @param  {string} method - method(s) in the controller which need to be executed as postfilter
   * @param  {Object} options - a hash with "only", "except" arrays of action names
   *                            to choose specific action(s) after which after filters
   *                            will be executed
   */
  static afterFilter(method, options) {
    Controller.insertFilter('AFTER', this.name, method, options);
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

  /**
   * gets an array of class from which the current class is being inherited
   * @return {Array} classNames
   */
  getInheritanceChain() {
    const chain = [];
    let instanceProto = Object.getPrototypeOf(this);
    let className = instanceProto.constructor.name;
    while (className !== 'Controller' && className !== 'Object') {
      chain.push(className);
      instanceProto = Object.getPrototypeOf(instanceProto);
      className = instanceProto.constructor.name;
    }

    return chain;
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
    const inheritanceChain = this.getInheritanceChain();
    inheritanceChain.forEach((controllerName) => {
      const controllerFilters = allFilters[controllerName] || [];
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
   * getter for layout
   * @return {String}
   */
  get layout() {
    return this[`${this.internalVariablePrefix}${this.internalVariablePrefix}layout`];
  }

  /**
   * setter for layout
   * @param  {String} layout
   */
  set layout(layout) {
    this[`${this.internalVariablePrefix}${this.internalVariablePrefix}layout`] = layout;
  }

  /**
   * getter for view
   * @return {String} view
   */
  get view() {
    return [`${this.internalVariablePrefix}${this.internalVariablePrefix}view`];
  }

  /**
   * setter for view
   * @param  {String} view
   */
  set view(view) {
    this[`${this.internalVariablePrefix}${this.internalVariablePrefix}view`] = view;
  }

  /**
   * getter for format
   * @return {String} format
   */
  get format() {
    return this[`${this.internalVariablePrefix}${this.internalVariablePrefix}format`];
  }

  /**
   * setter for format
   * @param  {String} format
   */
  set format(format) {
    this[`${this.internalVariablePrefix}${this.internalVariablePrefix}format`] = format;
  }

  get json () { // eslint-disable-line
    return this[`${this.internalVariablePrefix}${this.internalVariablePrefix}json`];
  }

  /**
   * setter for render json
   * @param  {Object} json
   */
  set json(json) { // eslint-disable-line
    this[`${this.internalVariablePrefix}${this.internalVariablePrefix}json`] = json;
  }

  get action() {
    return this[`${this.internalVariablePrefix}${this.internalVariablePrefix}action`];
  }

  set action(action) {
    this[`${this.internalVariablePrefix}${this.internalVariablePrefix}action`] = action;
  }

  get response_code() { // eslint-disable-line
    return this[`${this.internalVariablePrefix}${this.internalVariablePrefix}response_code`] || 200;
  }

  set response_code(code) { // eslint-disable-line
    this[`${this.internalVariablePrefix}${this.internalVariablePrefix}response_code`] = code;
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
    const privateVariablesPrefix = `${this.internalVariablePrefix}${this.internalVariablePrefix}`;

    keys = _.filter(keys, (key) => { // eslint-disable-line
      return key.startsWith(self.internalVariablePrefix) && !key.startsWith(privateVariablesPrefix);
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
    const key = `${this.internalVariablePrefix}${this.internalVariablePrefix}json`;
    if (!_.isNil(this[key])) {
      return this[key];
    }
    return this.getViewVariables();
  }

  sendResponse(request, response, next) {
    response.send('');
    next(null);
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
