'use strict';
var _ = require('lodash');
/**
 * TODO Comment
 */
class Controller {
  /**
   * TODO Comment
   * @return {Controller}
   */
  constructor () {
          
  }

  

  /**
   * [getInheritanceChain description]
   * @return {[type]} [description]
   */
  getInheritanceChain() {
    var chain = [];
    var instanceProto = Object.getPrototypeOf(this);
    var className = instanceProto.constructor.name;
    while( className !== 'Controller' && className !== 'Object'){
      chain.push(className);
      instanceProto = Object.getPrototypeOf(instanceProto);
      className = instanceProto.constructor.name;
    }

    return chain;

  }

  /**
   * [getFilters description]
   * @param  {[type]} at [description]
   * @return {[type]}    [description]
   */
  getFilters(at,actionName){
    var filters = [];
    var allFilters = Controller.filters[at];
    var inheritanceChain = this.getInheritanceChain();
    inheritanceChain.forEach(function(controllerName){
      var controllerFilters =allFilters[controllerName] || [];
      filters = filters.concat(controllerFilters);
    });
    filters = _.uniqWith(filters,function(x,y){
      return (x.method == y.method);
    });
    var filtersInUse = _.map(filters,function(filter){
      var method = filter.method;
      var only = filter.options.only || [];
      var except = filter.options.except || [];

      var use = null;
      
      if(only.length === 0){
        use = true;
      }
      
      if(only.length > 0 && _.includes(only,actionName)){
        use = true;
      }

      if(except.length > 0 && _.includes(except,actionName)){
        use = false;
      }

      if(use === true){
        return method;
      } else {
        return null;
      }


    });


    return _.compact(filtersInUse);
  }

  /**
   * TODO Comment
   * @return {}
   */
  getBeforeFilters (actionName) {
    return this.getFilters('BEFORE',actionName);
  }

  /**
   * TODO comment
   * @return {[type]}
   */
  getAfterFilters (actionName) {
    return this.getFilters('AFTER',actionName);
  }

  /**
   * TODO Comment
   * @return {[type]}
   */
  get layout() {
    return this.__layout;
  }

  /**
   * TODO comment
   * @param  {[type]}
   * @return {[type]}
   */
  set layout(layout) {
    this.__layout = layout;
  }

  /**
   * @return {[type]}
   */
  get view() {
    return this.__view;
  }

  /**
   * TODO comment
   * @param  {[type]}
   * @return {[type]}
   */
  set view(view) {
    this.__view = view;
  }

  /**
   * TODO comment
   * @return {[type]}
   */
  get format() {
    return this.__format;
  }

  /**
   * TODO comment
   * @param  {[type]}
   * @return {[type]}
   */
  set format(format) {
    this.__format = format;
  }


  /**
   * TODO comment
   * @return {[type]}
   */
  get redirect_code() {
    return this.__redirect_code;
  }

  /**
   * TODO comment
   * @param  {[type]}
   * @return {[type]}
   */
  set redirect_code(redirect_code) {
    this.__redirect_code = redirect_code;
  }

  /**
   * TODO comment
   * @return {[type]}
   */
  get redirect_url() {
    return this.__redirect_url;
  }

  /**
   * TODO comment
   * @param  {[type]}
   * @return {[type]}
   */
  set redirect_url(redirect_url) {
    this.__redirect_url = redirect_url;
  }

  /**
   * TODO comment
   * @param {[type]}
   * @param {[type]}
   */
  setRedirect (redirect_code,redirect_url)  {
    this.__redirect_code = redirect_code;
    this.__redirect_url = redirect_url;
  }


  /**
   * TODO comment
   * @param  {[type]}
   * @return {[type]}
   */
  set render_json (render_json) {
    this.__render_json = render_json;
  }

  /**
   * TODO comment
   * @return {[type]}
   */
  get render_json () {
    return this.__render_json;
  }

  /**
   * TODO comment
   * @return {[type]}
   */
  get action_name () {
    return this.__action_name;
  }

  /**
   * TODO comment
   * @param  {[type]}
   * @return {[type]}
   */
  set action_name (action_name) {
    this.__action_name = action_name;
  }

  get response_code () {
    return this.__response_code || 200;
  }

  set response_code (code) {
    this.__response_code = code;
  }




  /**
   * get a json consisting of all view variables
   * view variables are the variables that will be available to the views while rendering
   * view variables start with _ and has a single _
   * @return {[type]}
   */
  getViewVariables () {
    var keys = Object.keys(this);
    keys = _.filter(keys, (key) => {
      return (key.match(/^_/) && !key.match(/^__/));
    });
    //pick view variables and leave internal variables of type @__xxx
      
    var view_variables = {};

    for(var key of keys){
      view_variables[key] = this[key];
    }

    return view_variables;
  }

  /**
   * @return {[type]}
   */
  getJson () {
    if(this.__render_json !== null && this.__render_json !== undefined){
      return this.__render_json;
    }
    else {
      return this.getViewVariables();
    }
  }

}

/** 
 * Class variables
 */


/**
 * [before_filters description]
 * @type {Array}
 */
Controller.filters = {
  BEFORE: {},
  AFTER: {},
};

/**
 * [after_filters description]
 * @type {Array}
 */
Controller.after_filters = [];

Controller.insert_filter = function(at,callerControllerName,method,options) {

  var controllerBeforeFilters = Controller.filters[at][callerControllerName] || [];

  var methods = [];
  if( method instanceof Array){
    methods = method;
  } else {
    methods.push(method);
  }



  methods.forEach(function(method){

    _.extend({ only: [], except: [] },options);
    var invokeObject = {
      method: method,
      options:  _.extend({ only: [], except: [] },options)
    };

    controllerBeforeFilters.push(invokeObject);
  });

  
  Controller.filters[at][callerControllerName] = controllerBeforeFilters;
};


Controller.before_filter = function(method,options) {
  Controller.insert_filter('BEFORE',this.name,method,options);
};
Controller.after_filter = function(method,options) {
  Controller.insert_filter('AFTER',this.name,method,options);
};

module.exports.Controller = Controller;




