const { cleanPathUrl } = require('../../utils/helper');

class FileStoreTarget {
  constructor(options) {
    this.fileStore = options.fileStore;
  }
  targetPath(fileName) {
    return cleanPathUrl(`${this.fileStore.directory()}/${fileName}`);
  }
  save(fileName, file, callback) {
    return callback('Not Implemented');
  }
}
module.exports.FileStoreTarget = FileStoreTarget;

