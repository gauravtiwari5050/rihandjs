'use strict';

var express = require('express');
var extend = require('extend');
var async = require('async');
var uppercamelcase = require('uppercamelcase');
var decamelize = require('decamelize');
var _ = require('lodash');
var fs =  require('fs');

/**
 * [rihandRoutesInstance description]
 * @type {[type]}
 */

/**
 *  Class that controls routing in the framework
 *  A singleton of this class will be used
 */
class Routes {
  /**
   * @return {Routes}
   */
  constructor (options) {
    /**
     * return if an instance is already initialized
     */
    this.options = options;
    this.namespace_identifier = options.namespace_identifier || '/';
    this.namespaces = {};
    this.routes = [];
    this.controllers = [];

    this.layouts = {};

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

  getActionNameForSubdomain(controller, actionName, request){
    var currentActionName = actionName;
    var subdomains = request.subdomains;

    while(subdomains.length > 0){
      var probableActionName = subdomains.reverse().join('_') + '_' + actionName;
      if((typeof controller[probableActionName]) === 'function'){
        return probableActionName;
      }
      subdomains.shift();
    }
    return currentActionName;
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
    let controllerClass = require(`${process.cwd()}/app/controllers/${this.namespace_identifier}/${controllerFileName.toLowerCase()}`)[`${controllerName}Controller`];

    if(!controllerClass) {
      // TODO check whether the controller extends from RihandControler
      throw new Error(`Rihand expects ${process.cwd()}/app/controllers/${this.namespace_identifier}/${controllerFileName.toLowerCase()} to export a ${controllerName}Controller`);
    }
    this.controllers[controllerName] = controllerClass;


    // preserve this
    let self = this;

    // get the default response format
    let responseFormat = _.get(routeProperties,'defaults.format','html');
    this.logger.log(`responseFormat ${responseFormat}`);

    let layout = 'application';

    if( fs.existsSync(`${process.cwd()}/app/views/layouts/${controllerFileName.toLowerCase()}.ejs`)){
      layout = controllerFileName.toLowerCase();
    }

    var internalRoutingClosure  = (request, response, next)  => {


      let controller = new self.controllers[controllerName]();
      controller.format = responseFormat;
      controller.layout = layout;
      // action chain 
      // before_filters ... action ... after_filters

      var actionChain = controller.getBeforeFilters(actionName);
      actionName = self.getActionNameForSubdomain(controller, actionName, request)
      actionChain.push(actionName);
      actionChain = actionChain.concat(controller.getAfterFilters(actionName));



      var actionExecutor = (actionName,actionExecutorCallback) => {

        
        // check if the action name is defined
        if(actionName.constructor.name === 'Function') {
           actionName(request, response, (err) => {
            if(err){
              this.logger.log(err);
            }
            actionExecutorCallback(err);
          });
        }
        else if(_.isUndefined(controller[actionName])){
          actionExecutorCallback(null);
        }
        else {
          controller[actionName](request, response, (err) => {
            if(err){
              this.logger.log(err);
              actionExecutorCallback(err);
            }
            
            else if(controller.redirect_url) {
              this.logger.log('Halting actionChain as redirect detected');
              response.redirect(controller.redirect_code,controller.redirect_url);
              actionExecutorCallback('REDIRECT_DETECTED');
            } else {
              actionExecutorCallback(null);
            }

          });
        }  
      
      };

      var renderResponse = () => {
        if(controller.response_code  !== 200){
          var viewData = {}
          extend(viewData,{_layoutFile: `layouts/error`});
          // return response.status(controller.response_code).send('Not found');
          var targetFile = `error/${controller.response_code}.ejs`;
          return response.status(controller.response_code).render(targetFile,viewData);
        }
        if(controller.format == 'json') {
          this.logger.log('Rendering json');
          response.setHeader('content-type', 'application/json');
          response.send(controller.getJson());
          //return next();
        }
        else if(controller.format == 'html'){
          var viewData = controller.getViewVariables();
          extend(viewData,{_layoutFile: `layouts/${controller.layout}`});

          /* extend view data with request object*/
          extend(viewData, {request: request});

          
          var effectiveActionName = controller.action_name || actionName;
          if(!_.isNil(controller.view)){
            effectiveActionName = controller.view;
          }

          extend(viewData, {
            controller_name: controllerName.toLowerCase(),
            action_name: effectiveActionName.toLowerCase()
          });

          var targetFile = `${this.namespace_identifier}/${controllerName.toLowerCase()}/${effectiveActionName}.ejs`;
          // remove consecutive '/'
          targetFile = targetFile.replace(/\/+/g,'/');

          // remove leading and trailng '/'
          targetFile = targetFile.replace(/^[\/]+|[\/]+$/g,'')

          response.render(targetFile,viewData);
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

  Get ()  {
    var args = [].slice.call(arguments, 0);
    args.unshift('GET');
    this.setupRoute.apply(this,args);
  }
  Post ()  {
    var args = [].slice.call(arguments, 0);
    args.unshift('POST');
    this.setupRoute.apply(this,args);
  }

  getRouter () {
    var self = this;
    console.log("Getting router for " + this.namespace_identifier);
    return this.expressRouter;
  }

  setup(method){
    method.call(this);
  }

  namespace(name){
    var namespace_identifier = `${this.namespace_identifier}/${name}`;
    var options = _.clone(this.options);
    options.namespace_identifier = namespace_identifier;

    this.namespaces[name] = this.namespaces[name] || new Routes(options);
    //this.expressRouter.use(name,_namespace.getRouter());
    this.expressRouter.use(`/${name}`,this.namespaces[name].getRouter());
    return this.namespaces[name];
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
