const _ = require('lodash');
const tmp = require('tmp');
const rimraf = require('rimraf');

const availableTargets = {
  disk: require('./targets/disk').Disk,
  s3: require('./targets/s3').S3,
};

class FileStore {
  configFile() {
    return `${_.snakeCase(this.constructor.name)}.yml`;
  }

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
  prepare(callback) {
    const self = this;
    return tmp.dir((err, path) => {
      if (err) {
        return callback(err);
      }
      self.tmpDir = path;
      return callback(null);
    });
  }
  clean(callback, err, results) {
    return rimraf(this.tmpDir, () => {
      callback(err, results);
    });
  }
  save(fileName, file, callback) {
    const self = this;
    const TargetClass = this.getTargetClass();
    const targetInstance = new TargetClass({
      fileStore: this,
    });
    if (_.isNil(targetInstance)) {
      return callback(`No storage target configured for ${this.target()}`);
    }
    return self.prepare((errPrepare) => {
      if (errPrepare) {
        return callback(errPrepare);
      }
      return targetInstance.save(fileName, file, (err, targetFile) => {
        if (err) {
          return self.clean(callback, err);
        }
        return self.clean(callback, null, {
          file: targetFile,
          versions: [],
        });
      });
    });
  }

  fetch(fileName, versions, callback) {
    if (_.isNil(callback)) {
      callback = versions; // eslint-disable-line
      versions = null; // eslint-disable-line
    }
    const TargetClass = this.getTargetClass();
    const targetInstance = new TargetClass({
      fileStore: this,
    });
    if (_.isNil(targetInstance)) {
      return callback(`No storage target configured for ${this.target()}`);
    }
    return targetInstance.fetch(fileName, callback);
  }
}
module.exports.FileStore = FileStore;
