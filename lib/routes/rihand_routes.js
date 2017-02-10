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
class RihandRoutesNamespace {
  /**
   * @return {RihandRoutes}
   */
  constructor () {
    /**
     * return if an instance is already initialized
     */
    
    this.namespaces = {};
    this.routes = [];
    this.controllers = [];
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
    let verb = args.shift()

    if (!['GET','PUT','POST','DELETE','UPDATE'].includes(verb)) {
      throw new Error(`${verb} is not supported by Rihand`)
    }

    /*
    TODO comment
     */
    let routingString = args.shift()
    
    /*
    TODO comment
     */
    var routeProperties = {}

    /*
    TODO comment
     */
    for(var arg of args) {
      extend(true,routeProperties,arg)
    }

    /**
     * 
     */
    try {
      // TODO comment
      var path, route_to;
      [path,route_to] = routingString.split('=>')
      // TODO comment
      this.route(this.expressRouter,verb,path,route_to,routeProperties)
    } catch(e) {
      console.log(e)
      console.log(`{Error setting up route for ${routingString} ${routeProperties}}`)
    }

      
  }

  route(mountedOn, verb, routePath,routeTo, routeProperties ) {
    // trim the paths, get rid of extra spaces here
    console.log(`routePath ${routePath}`);
    console.log(`routeTo ${routeTo}`);
    console.log("routeProperties are");
    console.log(routeProperties);

    routePath = routePath.trim()
    routeTo = routeTo.trim()
    // get from and to
    let [controllerFileName,actionName] = routeTo.split('#');
    let controllerName = uppercamelcase(controllerFileName);

    // TODO process.cwd should be replaced with root of the project
    let controllerClass = require(`${process.cwd()}/app/controllers/${controllerFileName.toLowerCase()}`)[`${controllerName}Controller`]

    if(!controllerClass) {
      // TODO check whether the controller extends from RihandControler
      throw new Error(`Rihand expects ${process.cwd()}/app/controllers/${controllerFileName.toLowerCase()} to export a ${controllerName}Controller`)
    }
    this.controllers[controllerName] = controllerClass;

    // preserve this
    let self = this;

    // get the default response format
    let responseFormat = _.get(routeProperties,'defaults.format','html')
    console.log(`responseFormat ${responseFormat}`);

    var internalRoutingClosure  = (request, response, next)  => {
      let controller = new self.controllers[controllerName]();
      controller.format = responseFormat;
      // action chain 
      // before_filters ... action ... after_filters

      var actionChain = controller.getBeforeFilters()
      actionChain.push(actionName)
      actionChain = actionChain.concat(controller.getAfterFilters())

      var actionExecutor = (actionName,actionExecutorCallback) => {
        // check if the action name is defined
          if(_.isUndefined(controller[actionName])){
            actionExecutorCallback(null)
          }
          else if(controller.redirect_url) {
            console.log("Halting actionChain as redirect detected");
            response.redirect(controller.redirect_code,controller.redirect_url);
            actionExecutorCallback("REDIRECT_DETECTED");
          }
          else {
            controller[actionName](request, (err) => {
              if(err){
                console.log(err)
              }
              actionExecutorCallback(err)
            });
          }  
      
      }

      var renderResponse = () => {
        controller.format = "json";
        if(controller.format == "json") {
          console.log("Rendering json");
          response.setHeader('content-type', 'application/json');
          response.send(controller.getJson());
          next()
        }
        else if(controller.format == "html"){
          viewData = controller.getViewVariables();
          extend(viewData,{layout: 'landing'})
          effective_actionName = controller.getActionName() || actionName;
          response.render(`${controllerName.toLowerCase()}/${effective_actionName}.handlebars`,viewData)
        }
        else {
          next(`Unknown responseFormat - ${controller.format}`);
        }
      }

      async.eachSeries( actionChain, actionExecutor, (err) => {
          if(err) {
            next(err)
          }
          else {
            renderResponse()
          }
        }
      );

    }
    mountedOn[verb.toLowerCase()](routePath, internalRoutingClosure);
  }

  GET ()  {
    var args = [].slice.call(arguments, 0);
    args.unshift('GET')
    this.setupRoute.apply(this,args)
  }
      

  getRouter () {
      return this.expressRouter
  }
}

/**
 * TODO
 */
class RihandRoutes {
  constructor () {
    this.namespaces = {}
  }
  /**
   * TODO
   * @param  {[type]}
   * @return {[type]}
   */
  namespace (key)  {
    if(!key){
      throw new Error("Cannot fetch a namespace w/o a key")
    }
    if(this.namespaces[key] === undefined || this.namespaces[key] === null){
      this.namespaces[key] = new RihandRoutesNamespace();
    }
    return this.namespaces[key]
  }
  /**
   * @return {[type]}
   */
  rootNamespace () {
    return this.namespace('/');
  }
}

let rihandRoutesInstance =  new RihandRoutes();

module.exports.RihandRoutes = rihandRoutesInstance;
