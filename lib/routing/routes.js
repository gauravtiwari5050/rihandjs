'use strict';

var express = require('express');
var extend = require('extend');
var async = require('async');
var uppercamelcase = require('uppercamelcase');
var _ = require('lodash');

/**
 * [rihandRoutesInstance description]
 * @type {[type]}
 */

/**
 *  Class that controls routing in the framework
 *  A singleton of this class will be used
 */
class RoutesNamespace {
  /**
   * @return {Routes}
   */
  constructor (options) {
    /**
     * return if an instance is already initialized
     */
    
    this.namespaces = {};
    this.routes = [];
    this.controllers = [];
    this.logger = options.logger;
    this.time = new Date();

    this.expressRouter = express.Router();

    //this.setup();
  
  }

  /**
   * @return {[type]}
   */
  setupRoute () {

    /*
    TODO comment
     */
    var args = [].slice.call(arguments, 0);
    /*
    TODO comment
     */
    let verb = args.shift();

    if (!['GET','PUT','POST','DELETE','UPDATE'].includes(verb)) {
      throw new Error(`${verb} is not supported by Rihand`);
    }

    /*
    TODO comment
     */
    let routingString = args.shift();
    
    /*
    TODO comment
     */
    var routeProperties = {};

    /*
    TODO comment
     */
    for(var arg of args) {
      extend(true,routeProperties,arg);
    }

    /**
     * 
     */
    try {
      // TODO comment
      var path, route_to;
      [path,route_to] = routingString.split('=>');
      // TODO comment
      this.route(this.expressRouter,verb,path,route_to,routeProperties);
    } catch(e) {
      this.logger.log(e);
      this.logger.log(`{Error setting up route for ${routingString} ${routeProperties}}`);
    }

      
  }

  route(mountedOn, verb, routePath,routeTo, routeProperties ) {
    // trim the paths, get rid of extra spaces here
    this.logger.log(`routePath ${routePath}`);
    this.logger.log(`routeTo ${routeTo}`);
    this.logger.log('routeProperties are');
    this.logger.log(routeProperties);

    routePath = routePath.trim();
    routeTo = routeTo.trim();
    // get from and to
    let [controllerFileName,actionName] = routeTo.split('#');
    let controllerName = uppercamelcase(controllerFileName);

    // TODO process.cwd should be replaced with root of the project
    let controllerClass = require(`${process.cwd()}/app/controllers/${controllerFileName.toLowerCase()}`)[`${controllerName}Controller`];

    if(!controllerClass) {
      // TODO check whether the controller extends from RihandControler
      throw new Error(`Rihand expects ${process.cwd()}/app/controllers/${controllerFileName.toLowerCase()} to export a ${controllerName}Controller`);
    }
    this.controllers[controllerName] = controllerClass;

    // preserve this
    let self = this;

    // get the default response format
    let responseFormat = _.get(routeProperties,'defaults.format','html');
    this.logger.log(`responseFormat ${responseFormat}`);

    var internalRoutingClosure  = (request, response, next)  => {
      let controller = new self.controllers[controllerName]();
      controller.format = responseFormat;
      // action chain 
      // before_filters ... action ... after_filters

      var actionChain = controller.getBeforeFilters();
      actionChain.push(actionName);
      actionChain = actionChain.concat(controller.getAfterFilters());

      var actionExecutor = (actionName,actionExecutorCallback) => {
        // check if the action name is defined
        if(_.isUndefined(controller[actionName])){
          actionExecutorCallback(null);
        }
        else if(controller.redirect_url) {
          this.logger.log('Halting actionChain as redirect detected');
          response.redirect(controller.redirect_code,controller.redirect_url);
          actionExecutorCallback('REDIRECT_DETECTED');
        }
        else {
          controller[actionName](request, (err) => {
            if(err){
              this.logger.log(err);
            }
            actionExecutorCallback(err);
          });
        }  
      
      };

      var renderResponse = () => {
        if(controller.format == 'json') {
          this.logger.log('Rendering json');
          response.setHeader('content-type', 'application/json');
          response.send(controller.getJson());
          next();
        }
        else if(controller.format == 'html'){
          var viewData = controller.getViewVariables();
          extend(viewData,{_layoutFile: 'layouts/landing'});
          var effectiveActionName = controller.action_name || actionName;
          response.render(`${controllerName.toLowerCase()}/${effectiveActionName}.ejs`,viewData);
        }
        else {
          next(`Unknown responseFormat - ${controller.format}`);
        }
      };

      async.eachSeries( actionChain, actionExecutor, (err) => {
        if(err) {
          next(err);
        }
        else {
          renderResponse();
        }
      }
      );

    };
    mountedOn[verb.toLowerCase()](routePath, internalRoutingClosure);
  }

  GET ()  {
    var args = [].slice.call(arguments, 0);
    args.unshift('GET');
    this.setupRoute.apply(this,args);
  }
  POST ()  {
    var args = [].slice.call(arguments, 0);
    args.unshift('POST');
    this.setupRoute.apply(this,args);
  }
      

  getRouter () {
    return this.expressRouter;
  }
}

/**
 * TODO
 */
class Routes {
  constructor (options) {
    this.options = options;
    this.namespaces = {};
    
  }
  /**
   * TODO
   * @param  {[type]}
   * @return {[type]}
   */
  namespace (key)  {
    if(!key){
      throw new Error('Cannot fetch a namespace w/o a key');
    }
    if(this.namespaces[key] === undefined || this.namespaces[key] === null){
      this.namespaces[key] = new RoutesNamespace(this.options);
    }
    return this.namespaces[key];
  }
  /**
   * @return {[type]}
   */
  rootNamespace () {
    return this.namespace('/');
  }
}

/*let rihandRoutesInstance =  new Routes();

module.exports.Routes = rihandRoutesInstance;*/

Routes.instance = null;

Routes.getInstance = function(opts){
  if(Routes.instance === null){
    Routes.instance = new Routes(opts);
  }
  return Routes.instance;
};

module.exports.Routes = Routes;
