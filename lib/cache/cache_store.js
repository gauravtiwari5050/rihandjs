const { Application } = require('../application/application');

class CacheStore {
  async fetch(key) { // eslint-disable-line
    throw new Error('Not Implemented');
  }
  async save(key, value) { // eslint-disable-line
    throw new Error('Not Implemented');
  }

  async delete(key) { // eslint-disable-line
    throw new Error('Not Implemented');
  }
  async initialize(options) { // eslint-disable-line
    throw new Error('Not Implemented');
  }
  static getProxy() {
    return new Proxy({}, {
      get(target, name) {
        return function (...args) {
          const cacheService = Application.getInstance().service('cache');
          return cacheService.cache[name](...args);
        };
      },
    });
  }
}


module.exports.CacheStore = CacheStore;
module.exports.Cache = CacheStore.getProxy();
