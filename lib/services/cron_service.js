const upperCamelCase = require('uppercamelcase');
const fs = require('fs');
const _ = require('lodash');
const schedule = require('node-schedule');
const { File } = require('../utils/file');

/**
 * Base class for services
 */
class CronService extends require('./service').Service {
  requiredServices() {
    return ['asset_pipeline', 'queue', 'view', 'route', 'web' ];
  }
  async initialize() {
    this.crons = [];
    const scheduleSubdirectories = ['app/crons'];
    for (const scheduleSubdirectory of scheduleSubdirectories) {
      const klasses = await File.validClassesFromDirectory(`${this.application.root()}/${scheduleSubdirectory}`);
      for (const Klass of klasses) {
        this.crons.push(new Klass());
      }
    }
  }

  async start(options) {
    this.crons.forEach((cron) => {
      schedule.scheduleJob(cron.when(), async () => {
        cron.run();
      });
    });
    await new Promise((resolve, reject) => {});
  }
}

module.exports.CronService = CronService;