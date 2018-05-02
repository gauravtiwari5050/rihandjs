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
  async createTmpDir() {
    return new Promise((resolve, reject) => {
      tmp.dir((err, path) => {
        if (err) {
          return reject(err);
        }
        return resolve(path);
      });
    });
  }

  async prepare() {
    this.tmpDir = await this.createTmpDir();
  }
  async clean() {
    return new Promise((resolve, reject) => {
      return rimraf(this.tmpDir, (err) => {
        if (err) {
          return reject(err);
        }
        return resolve();
      });
    });
  }
  targetInstance() {
    const TargetClass = this.getTargetClass();
    const target = new TargetClass({
      fileStore: this,
    });
    if (_.isNil(target)) {
      throw new Error(`No storage target configured for ${this.target()}`);
    }
    return target;
  }
  async find(fileName) {
    await this.targetInstance().find(fileName);
  }
  async save(fileName, file) {
    await this.prepare();
    const targetFile = await this.targetInstance().save(fileName, file);
    await this.clean();
    return {
      file: targetFile,
      versions: [],
    };
  }

  async fetch(fileName, versions) {
    return await this.targetInstance().fetch(fileName);
  }
}
module.exports.FileStore = FileStore;
