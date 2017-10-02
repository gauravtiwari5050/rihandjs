const _ = require('lodash');
const express = require('express');

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

  apply(request, response, next) {
    response.send("Hello");
    next(null);
  }
}
class RouteTableEntry {
  constructor() {
    this.httpMethod = null;
    this.path = null;
    this.targets = [];
  }

  insertOrUpdateTarget(routeOptions) {
    let routeTarget = _.find(this.targets, (target) => { // eslint-disable-line
      return (
        target.namespace === routeOptions.namespace
        &&
        target.controller === routeOptions.controller
        &&
        target.action === routeOptions.action
      );
    });
    if (_.isNil(routeTarget)) {
      routeTarget = new RouteTarget();
      routeTarget.controller = routeOptions.controller;
      routeTarget.action = routeOptions.action;
      routeTarget.namespace = routeOptions.namespace;
      routeTarget.props = routeTarget.props;
      this.targets.push(routeTarget);
    }
    routeOptions.constraints.forEach((constraint) => {
      routeTarget.constraints.push(constraint);
    });
    return routeTarget;
  }

  matchTarget(request) {
    return _.find(this.targets, (target) => { // eslint-disable-line
      return target.isApplicable(request);
    });
  }
  extendRouter(webServerRouter) {
    const self = this;
    webServerRouter[this.httpMethod.toLowerCase()](this.path, (request, response, next) => {
      const target = self.matchTarget(request);
      if (_.isNil(target)) {
        return RouteTarget.fail(request, response, next);
      }
      return target.apply(request, response, next);
    });
    return webServerRouter;
  }
}

class RouteTable {
  constructor() {
    this.entries = [];
  }

  cleanPathUrl(path) { // eslint-disable-line
    if (_.isNil(path)) {
      return '';
    }
    return path.replace(/\/+/g, '/');
  }

  insertOrUpdateRouteTableEntry(httpMethod, path, routeOptions) {
    let rte = _.find(this.entries, (entry) => { // eslint-disable-line
      return (entry.httpMethod === httpMethod && entry.path === path);
    });
    if (_.isNil(rte)) {
      rte = new RouteTableEntry();
      rte.httpMethod = httpMethod;
      rte.path = path;
      this.entries.push(rte);
    }
    rte.insertOrUpdateTarget(routeOptions);
    return rte;
  }

  use(route) {
    const self = this;
    let namespace = '/';
    if (!_.isNil(route.parent)) {
      namespace = route.parent.resolvePath();
    }

    let path = `${namespace}/${route.path}`;
    path = this.cleanPathUrl(path);
    namespace = this.cleanPathUrl(namespace);

    route.httpMethods.forEach((httpMethod) => {
      const routeOptions = {
        namespace,
        controller: route.controllerName,
        action: route.actionName,
        constraints: route.resolveConstraints(),
        props: route.resolveProps(),
      };
      self.insertOrUpdateRouteTableEntry(httpMethod, path, routeOptions);
    });
  }

  getRouter() {
    const router = express.Router();
    this.entries.forEach((entry) => {
      entry.extendRouter(router);
    });
    return router;
  }
}

module.exports.RouteTable = RouteTable;
