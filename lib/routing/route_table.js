const _ = require('lodash');
const express = require('express');
const { RouteTarget } = require('./route_target');
const { cleanPathUrl } = require('../utils/helper');

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
      routeTarget.props = routeOptions.props;
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
    const path = `${this.path}\.:ext?`; // eslint-disable-line
    webServerRouter[this.httpMethod.toLowerCase()](path, (request, response, next) => {
      const target = self.matchTarget(request);
      if (_.isNil(target)) {
        return RouteTarget.fail(request, response, next);
      }
      const props = {};
      if (!_.isNil(request.params.ext)) {
        props.format = request.params.ext.toLowerCase();
      }
      return target.invoke(props, request, response, next);
    });
    return webServerRouter;
  }
}

class RouteTable {
  constructor() {
    this.entries = [];
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
    path = cleanPathUrl(path);
    namespace = cleanPathUrl(namespace);
    const routeOptions = {
      namespace,
      controller: route.controllerName,
      action: route.actionName,
      constraints: route.resolveConstraints(),
      props: route.resolveProps(),
    };

    route.httpMethods.forEach((httpMethod) => {
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
