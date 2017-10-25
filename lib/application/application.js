const _ = require('lodash');
const process = require('process');
const { Configuration } = require('../config/configuration');

class Application {
  getDefaultRootDirectory() {
    // TODO better way to determine root directory
    return process.cwd();
  }

  root() {
    return this.rootDirectory;
  }

  constructor(opts) {
    let options = opts;
    if (_.isNil(options)) {
      options = {};
    }
    this.rootDirectory = options.rootDirectory || this.getDefaultRootDirectory();
    this.configuration = new Configuration(_.extend(options, { application: this }));
  }
}

module.exports.Application = Application;
