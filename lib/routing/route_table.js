const _ = require('lodash');

class ContraintsControllerAction {
  constructor() {
    this.constraints = [];
    this.controller = null;
    this.action = null;
    this.namespace = null;
  }
}
class RouteTableEntry {
  constructor() {
    this.httpMethod = null;
    this.path = null;
    this.constraintControllerActions = [];
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
  use(route) {
    const self = this;
    let namespace = '/';
    if (!_.isNil(route.parent)) {
      namespace = route.parent.resolvePath();
    }

    const path = `${namespace}/${route.path}`;

    route.httpMethods.forEach((httpMethod) => {
      const rte = new RouteTableEntry();
      rte.httpMethod = httpMethod;
      rte.path = this.cleanPathUrl(path);
      rte.namespace = this.cleanPathUrl(namespace);
      rte.controller = route.controllerName;
      rte.action = route.actionName;
      self.entries.push(rte);
    });
  }
}

module.exports.RouteTable = RouteTable;
