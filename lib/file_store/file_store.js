const _ = require('lodash');

const availableTargets = {
  disk: require('./targets/disk').Disk,
};

class FileStore {
  target() {
    return 'disk';
  }
  directory() {
    return '/';
  }
  getTargetClass() {
    const target = this.target();
    if (_.isString(target)) {
      return availableTargets[target];
    }
    return target;
  }
  save(fileName, file, callback) {
    const TargetClass = this.getTargetClass();
    const targetInstance = new TargetClass({
      fileStore: this,
    });
    return targetInstance.save(fileName, file, (err, targetFile) => {
      if (err) {
        return callback(err);
      }
      return callback(null, {
        file: targetFile,
        versions: [],
      });
    });
  }
}
module.exports.FileStore = FileStore;
