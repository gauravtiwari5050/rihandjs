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
   * TODO Comment
   * @return {}
   */
  getBeforeFilters () {
    return [];
  }

  /**
   * TODO comment
   * @return {[type]}
   */
  getAfterFilters () {
    return [];
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
Controller.before_filters = [];

/**
 * [after_filters description]
 * @type {Array}
 */
Controller.after_filters = [];

module.exports.Controller = Controller;




