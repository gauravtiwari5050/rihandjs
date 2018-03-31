class MemoryStore extends require('./cache_store').CacheStore {
  async initialize() {
    this.store = {};
  }
  async fetch(key) { // eslint-disable-line
    return this.store[key];
  }
  async save(key, value) {
    this.store[key] = value;
  }
  async delete(key) {
    delete this.store[key];
  }
}

module.exports.MemoryStore = MemoryStore;
