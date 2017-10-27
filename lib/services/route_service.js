const { Route } = require('../routing/routes');
const path = require('path');
/**
 * Route Service
 */
class RouteService extends require('./service').Service {
  getRouter() {
    return this.applicationRouter;
  }
  initialize(options, callback) {
    Route.clearInstance();
    const applicationNamespace = Route.getInstance();
    applicationNamespace.setApplication(this.application);
    const routesFile = path.resolve(this.application.root(), './config/routes');
    require(routesFile).loadRoutes(); // eslint-disable-line
    this.applicationRouter = applicationNamespace.getRouter();
    callback(null);
  }

  start(options, callback) {
    callback(null);
  }
}

module.exports.RouteService = RouteService;
