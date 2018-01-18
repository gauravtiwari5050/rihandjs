const upperCamelCase = require('uppercamelcase');

class CacheService extends require('./service').Service {
  requiredServices() {
    return ['log'];
  }
  initialize(options, callback) {
    const self = this;
    const cacheStoreType = self.application.configuration.value('cache_store') || 'memory';

    const cacheStoreFile = `${cacheStoreType}_store`;
    const CacheStore = require(`../cache/${cacheStoreFile}`)[upperCamelCase(cacheStoreFile)]; //eslint-disable-line
    const cacheStore = new CacheStore();
    cacheStore.initialize(options, (errInitialization) => {
      if (errInitialization) {
        return callback(errInitialization);
      }
      this.cache = cacheStore;
      return callback(null);
    });
  }

  start(options, callback) {
    return callback(null);
  }
}

module.exports.CacheService = CacheService;
