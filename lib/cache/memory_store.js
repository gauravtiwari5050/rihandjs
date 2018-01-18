class MemoryStore extends require('./cache_store').CacheStore {
  initialize(options, callback) {
    this.store = {};
    return callback(null);
  }
  fetch(key, callback) { // eslint-disable-line
    const value = this.store[key];
    if (callback) {
      return callback(null, value);
    }
    return this.store[key];
  }
  save(key, value, callback) {
    this.store[key] = value;
    if (callback) {
      return callback(null);
    }
    return null;
  }
  delete(key, callback) {
    delete this.store[key];
    if (callback) {
      return callback(null);
    }
    return null;
  }
}

module.exports.MemoryStore = MemoryStore;
