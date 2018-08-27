const upperCamelCase = require('uppercamelcase');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');

class InitializerService extends require('./service').Service {
  async useInitializers() {
    const self = this;
    const initializersDirectory = `${self.application.root()}/app/initializers`;
    let initializers = [];
    for (const fileName of fs.readdirSync(initializersDirectory)) {
      if (/^\..*/.test(fileName)) {
        continue;
      }
      const baseFileName = path.parse(fileName).name;
      const InitializerClass = require(`${initializersDirectory}/${fileName}`)[upperCamelCase(baseFileName)]; //eslint-disable-line
      if (_.isNil(InitializerClass)) {
        throw new Error(`${initializersDirectory}/${fileName} should export a class called ${upperCamelCase(baseFileName)}`);
      }
      const initializer = new InitializerClass({
        application: self.application,
      });
      const enabled = await initializer.enabled();
      if (enabled === true) {
        initializers.push(initializer);
      }
    }
    initializers = _.compact(initializers);
    initializers = _.sortBy(initializers, function (initializer) { //eslint-disable-line
      return initializer.priority();
    });

    for (const initializer of initializers) {
      await initializer.run();
    }
  }
  async initialize() { // eslint-disable-line
    await this.useInitializers();
  }
}

module.exports.InitializerService = InitializerService;
