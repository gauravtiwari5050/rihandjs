const { Route } = require('../routing/routes');
const path = require('path');
/**
 * Route Service
 */
class RouteService extends require('./service').Service {
  getRouter() {
    return this.applicationRouter;
  }
  getMountedEngines() {
    return this.routeInstance.mountedEngines;
  }
  initialize(options, callback) {
    Route.clearInstance();
    this.routeInstance = Route.getInstance();
    this.routeInstance.setApplication(this.application);
    const routesFile = path.resolve(this.application.root(), './config/routes');
    require(routesFile).loadRoutes(); // eslint-disable-line
    this.applicationRouter = this.routeInstance.getRouter();
    callback(null);
  }

  start(options, callback) {
    callback(null);
  }
}

module.exports.RouteService = RouteService;
