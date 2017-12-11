class FileStoreTarget {
  constructor(options) {
    this.fileStore = options.fileStore;
  }
  save(fileName, file, callback) {
    return callback('Not Implemented');
  }
}
module.exports.FileStoreTarget = FileStoreTarget;

