const { Route } = require('../routing/routes');
const { File } = require('../utils/file');
const vhost = require('vhost');
const path = require('path');
const _ = require('lodash');
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
  async vhostRouters() {
    const routers = [];
    const vhostsDirectory = `${this.application.root()}/config/vhosts`;
    const vhostsDirectoryExists = await File.directoryExists(vhostsDirectory);
    if (vhostsDirectoryExists === true) {
      const vhosts = await File.validClassesFromDirectory(vhostsDirectory);
      console.log(`Found ${vhosts.length} vhosts`);
      for (const VHost of vhosts) {
        const hosts = VHost.hosts();
        for (const host of hosts) {
          Route.clearInstance(host);
          const routeInstance = Route.getInstance(host);
          routeInstance.setApplication(this.application);
          VHost.loadRoutes(routeInstance);
          const router = routeInstance.getRouter();
          const vhostRouter = vhost(host, router);
          routers.push(vhostRouter);
        }
      }
    }
    return routers;
  }
  async primaryRouter() {
    Route.clearInstance();
    this.routeInstance = Route.getInstance();
    this.routeInstance.setApplication(this.application);
    const routesFile = path.resolve(this.application.root(), './config/routes');
    require(routesFile).loadRoutes(this.routeInstance); // eslint-disable-line
    const primaryRouter = this.routeInstance.getRouter();
    return primaryRouter;
  }

  async setup(webApplication) {
    this.webApplication = webApplication;
    /*_.map(this.getMountedEngines(), (mount) => {
      mount.method(this.webApplication);
    });*/
    const primaryRouter = await this.primaryRouter();
    const vhostRouters = await this.vhostRouters();
    for (const router of vhostRouters) {
      webApplication.use(router);
    }
    webApplication.use(primaryRouter);
  }
  async initialize() {

  }
}

module.exports.RouteService = RouteService;
