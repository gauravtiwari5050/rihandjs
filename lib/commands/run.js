const { Logger } = require('../logging/log');
const _ = require('lodash');
const upperCamelCase = require('uppercamelcase');
const camelCase = require('camelcase');
const async = require('async');
const fs = require('fs');

class Run extends require('./command').Command {
  run(callback) {
    const self = this;
    self.application.initializeServices([
      'log',
      'asset_pipeline',
      'view',
      'web',
      'initializer',
      'mail',
      'queue',
    ], (err) => {
      if (err) {
        return callback(err);
      }
      const runnerName = self.commandLineOptions._.shift() || self.commandLineOptions.runner;
      if (_.isNil(runnerName)) {
        Logger.error('Runner not provided');
        return self.help(callback);
      }

      return self.resolveFile(runnerName, (errResolveFile, runnerFile) => {
        if (errResolveFile) {
          Logger.error(errResolveFile);
          return self.help(callback);
        }
        const RunnerClass = require(runnerFile)[upperCamelCase(runnerName)]; //eslint-disable-line
        if (_.isNil(RunnerClass)) {
          const errMessage = `${runnerFile} should export ${upperCamelCase(runnerName)}`;
          Logger.error(errMessage);
          return callback(errMessage);
        }
        const runner = new RunnerClass({
          application: self.application,
        });

        let actionName = self.commandLineOptions._.shift() || self.commandLineOptions.action;

        if (_.isNil(actionName)) {
          Logger.info('Action name not specified, will invoke "run" by default');
          actionName = 'run';
        }
        if (_.isUndefined((runner[actionName]))) {
          actionName = camelCase(actionName);
        }
        if (_.isUndefined(runner[actionName])) {
          const errMessage = `Could not find method name ${actionName} defined in file ${runnerFile}`;
          return callback(errMessage);
        }
        return runner[actionName]((errRunner) => {
          if (errRunner) {
            return callback(errRunner, { exit: 1 });
          }
          return callback(null, { exit: 0 });
        });
      });
    });
  }

  resolveFile(runnerName, callback) {
    const self = this;
    let candidates = [
      `${self.application.root()}/app/runners/${runnerName}.js`,
      `${self.application.root()}/app/runners/${camelCase(runnerName)}.js`,
    ];
    candidates = _.uniq(candidates);
    let resolvedFile = null;
    return async.eachSeries(candidates, (candidate, cb) => {
      if (_.isNil(candidate)) {
        return cb(null, null);
      }
      return fs.access(candidate, fs.constants.F_OK | fs.constants.R_OK, (err) => { // eslint-disable-line
        if (err) {
          return cb(null);
        }
        resolvedFile = candidate;
        return cb(true);
      });
    }, () => {
      if (_.isEmpty(resolvedFile)) {
        return callback(`Could not find runner with name  '${runnerName}'.\n One of the following should be available \n ${candidates.join('\n')}`);
      }
      return callback(null, resolvedFile);
    });
  }

  help(callback) {
    Logger.info('Print run help here');
    callback('', { exit: 1 });
  }
}

module.exports.Run = Run;
