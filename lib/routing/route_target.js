const upperCamelCase = require('uppercamelcase');
const camelCase = require('camelcase');
const { cleanPathUrl } = require('../utils/helper');
const _ = require('lodash');
const path = require('path');
const csrf = require('csurf');

class RouteTarget {
  constructor() {
    this.constraints = [];
    this.controller = null;
    this.action = null;
    this.namespace = null;
    this.props = {};
  }

  isApplicable(request) {
    let applicable = true;
    for (let i = 0; i < this.constraints.length; i += 1) {
      applicable = (this.constraints[i](request) === true);
      if (applicable === false) {
        break;
      }
    }
    return applicable;
  }

  controllerClass() {
    const controller = path.basename(this.controller);
    const controllerClassName = upperCamelCase(controller);
    let controllerFile = cleanPathUrl(`${this.props.application.root()}/app/controllers/${this.namespace}/${this.controller}`);
    controllerFile = controllerFile.replace(/:/g, '');
    const controllerClass = require(controllerFile)[controllerClassName]; // eslint-disable-line
    if (_.isNil(controllerClass)) {
      throw new Error(`${controllerFile} is expected to export a class called ${controllerClassName}`);
    }
    return controllerClass;
  }

  /**
   * gets a list of actions to be executed for the given routeTarget
   * @return {Array} actionChain
   */
  getActionChain() {
    // TODO check validity of current route here first and throw error if invalid

    const actionName = this.action;
    const actionNameUpcase = camelCase(this.action);
    const ControllerClass = this.controllerClass();

    const controllerClassInstance = new ControllerClass();
    let action = null;
    if (!_.isNil(controllerClassInstance[actionName])) {
      action = actionName;
    } else if (!_.isNil(controllerClassInstance[actionNameUpcase])) {
      action = actionNameUpcase;
    }

    if (_.isNil(action)) {
      throw new Error(`${ControllerClass.name} should have a method called ${actionName} or ${actionNameUpcase}`);
    }
    let actionChain = controllerClassInstance.getBeforeFilters(action);
    actionChain.push(action);
    actionChain = actionChain.concat(controllerClassInstance.getAfterFilters(action));
    return actionChain;
  }

  async validateCsrf(controllerInstance, request, response) {
    return new Promise((resolve, reject) => {
      const method = csrf({ cookie: true });
      method(request, response, (err) => {
        if (err) {
          return reject(err);
        }
        return resolve();
      });
    });
  }
  async invoke(props, request, response, next) {
    let ControllerClass = null;
    try {
      ControllerClass = this.controllerClass();
    } catch (err) {
      console.log(err);
      return next(err);
    }
    const invokeProps = _.extend({
      namespace: this.namespace,
      controller: this.controller,
      action: this.action,
    }, this.props, props);
    const controllerClassInstance = new ControllerClass(invokeProps);
    let actionChain = null;
    try {
      actionChain = this.getActionChain();
    } catch (errActionChain) {
      return next(errActionChain);
    }
    if (controllerClassInstance.skipCsrf() === false) {
      try {
        await this.validateCsrf(controllerClassInstance, request, response);
      } catch (errCsrf) {
        return next(errCsrf);
      }
    }
    let actionChainError = null;
    for (let i = 0; i < actionChain.length; i += 1) {
      const actionName = actionChain[i];
      const isChainMethodAsync = Object.prototype.toString.call(controllerClassInstance[actionName]) === '[object AsyncFunction]';
      let awaitOn = null;
      if (isChainMethodAsync === true) {
        awaitOn = controllerClassInstance[actionName](request, response);
      } else {
        awaitOn = new Promise((resolve, reject) => {
          controllerClassInstance[actionName](request, response, (err) => {
            if (err) {
              return reject(err);
            }
            return resolve(null);
          });
        });
      }
      try {
        await awaitOn; // eslint-disable-line
      } catch (err) {
        console.log('Caught error', err);
        actionChainError = err;
        break;
      }
      if (controllerClassInstance.noResponse === true) {
        console.log('Terminating action chain');
        return next(null);
      }
    }
    if (actionChainError) {
      return controllerClassInstance.sendError({
        payload: actionChainError.message,
      }, request, response, next);
    }
    if (response.headersSent) {
      return next(null);
    }
    
    return controllerClassInstance.renderResponse(request, response, next);
  }
}

module.exports.RouteTarget = RouteTarget;
