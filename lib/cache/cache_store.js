const { Application } = require('../application/application');

class CacheStore {
  fetch(key, callback) { // eslint-disable-line
    throw new Error('Not Implemented');
  }
  save(key, value, callback) { // eslint-disable-line
    throw new Error('Not Implemented');
  }

  delete(key, callback) { // eslint-disable-line
    throw new Error('Not Implemented');
  }
  initialize(options, callback) { // eslint-disable-line
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
