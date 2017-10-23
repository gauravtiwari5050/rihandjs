const upperCamelCase = require('uppercamelcase');
const camelCase = require('camelcase');
const { cleanPathUrl } = require('../utils/helper');
const _ = require('lodash');
const async = require('async');

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
    const controllerClassName = upperCamelCase(this.controller);
    const controllerFile = cleanPathUrl(`${this.props.applicationRoot}/controllers/${this.namespace}/${this.controller}`);
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

  invoke(props, request, response, next) {
    const ControllerClass = this.controllerClass();
    const invokeProps = _.extend({
      namespace: this.namespace,
      action: this.action,
    }, this.props, props);
    const controllerClassInstance = new ControllerClass(invokeProps);
    const actionChain = this.getActionChain();

    async.eachSeries(actionChain, (actionName, cb) => {
      controllerClassInstance[actionName](request, response, cb);
    }, (err) => {
      if (err) {
        return next(err);
      }
      return controllerClassInstance.renderResponse(request, response, next);
    });
  }
}

module.exports.RouteTarget = RouteTarget;
