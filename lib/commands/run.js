const { Logger } = require('../logging/log');
const _ = require('lodash');
const upperCamelCase = require('uppercamelcase');
const camelCase = require('camelcase');
const fs = require('fs');
const util = require('util');

class Run extends require('./command').Command {
  async run() {
    let services = [
      'log',
      'cache',
      'asset_pipeline',
      'view',
      'web',
      'initializer',
      'mail',
      'queue',
    ];
    const disabledServices = this.application.configuration.value('disabled_services', []);
    services = _.filter(services, service => _.includes(disabledServices, service) === false);
    await this.application.initializeServices(services);
    const runnerName = this.commandLineOptions._.shift() || this.commandLineOptions.runner;
    if (_.isNil(runnerName)) {
      Logger.error('Runner not provided');
      return this.help();
    }

    const runnerFile = await this.resolveFile(runnerName);
    const RunnerClass = require(runnerFile)[upperCamelCase(runnerName)]; //eslint-disable-line
    if (_.isNil(RunnerClass)) {
      const errMessage = `${runnerFile} should export ${upperCamelCase(runnerName)}`;
      Logger.error(errMessage);
      throw new Error(errMessage);
    }
    const runner = new RunnerClass({
      application: this.application,
    });

    let actionName = this.commandLineOptions._.shift() || this.commandLineOptions.action;

    if (_.isNil(actionName)) {
      Logger.info('Action name not specified, will invoke "run" by default');
      actionName = 'run';
    }
    if (_.isUndefined((runner[actionName]))) {
      actionName = camelCase(actionName);
    }
    if (_.isUndefined(runner[actionName])) {
      const errMessage = `Could not find method name ${actionName} defined in file ${runnerFile}`;
      throw new Error(errMessage);
    }
    await runner[actionName]();
    return { exit: 0 };
  }
  async resolveFile(runnerName) {
    const self = this;
    let candidates = [
      `${self.application.root()}/app/runners/${runnerName}.js`,
      `${self.application.root()}/app/runners/${camelCase(runnerName)}.js`,
    ];
    candidates = _.uniq(candidates);
    let resolvedFile = null;

    for (const candidate of candidates) {
      const fsAccess = util.promisify(fs.access);
      try {
        fs.accessSync(candidate, fs.constants.F_OK | fs.constants.R_OK);
        resolvedFile = candidate;
      } catch (errAccess) {
      }
    }
    if (_.isNil(resolvedFile)) {
      throw new Error(`Could not find runner with name  '${runnerName}'.\n One of the following should be available \n ${candidates.join('\n')}`);
    }
    return resolvedFile;
  }

  help() {
    Logger.info('Print run help here');
    return ({ exit: 1 });
  }
}

module.exports.Run = Run;
