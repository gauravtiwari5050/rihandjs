const upperCamelCase = require('uppercamelcase');

class CacheService extends require('./service').Service {
  requiredServices() {
    return ['log'];
  }
  async initialize(options) {
    const self = this;
    const cacheStoreType = self.application.configuration.value('cache_store') || 'memory';

    const cacheStoreFile = `${cacheStoreType}_store`;
    const CacheStore = require(`../cache/${cacheStoreFile}`)[upperCamelCase(cacheStoreFile)]; //eslint-disable-line
    const cacheStore = new CacheStore();
    await cacheStore.initialize(options);
  }
}

module.exports.CacheService = CacheService;
