const _ = require('lodash');
const { Application } = require('../../lib/application/application');

class Command {
  constructor(options) {
    this.commandLineOptions = options.commandLineOptions || {};
    this.application = null;
  }
  initializeApplication() {
    const rootDirectory = this.commandLineOptions.root || process.cwd();
    const env = this.commandLineOptions.env
      || this.commandLineOptions.environment
      || process.env.NODE_ENV;
    const applicationOptions = _.extend(_.clone(this.commandLineOptions), {
      rootDirectory,
      env,
    });
    this.application = new Application(applicationOptions);
  }
  async execute() {
    this.initializeApplication();
    await this.run();
  }
  async run() {
    throw new Error('Not implemented');
  }
}

module.exports.Command = Command;
