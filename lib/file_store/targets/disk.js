const fs = require('fs');
const mkdirp = require('mkdirp');

const { FileStoreTarget } = require('./file_store_target');


class Disk extends FileStoreTarget {
  // Taken as is from https://stackoverflow.com/a/14387791/1082861
  copyFile(source, target, cb) {
    let cbCalled = false;
    function done(err) {
      if (!cbCalled) {
        cb(err);
        cbCalled = true;
      }
    }

    const readStream = fs.createReadStream(source);
    readStream.on('error', err => done(err));

    const writeStream = fs.createWriteStream(target);
    writeStream.on('error', err => done(err));

    writeStream.on('close', done);

    readStream.pipe(writeStream);
  }
  save(fileName, file, callback) {
    const self = this;
    const source = file;
    const target = this.targetPath(fileName);
    return mkdirp(this.fileStore.directory(), (err) => {
      if (err) {
        return callback(err);
      }
      return self.copyFile(source, target, (errCopy) => {
        if (errCopy) {
          return callback(errCopy);
        }
        return callback(null, {
          name: fileName,
          path: target,
        });
      });
    });
  }

  fetch(fileName, callback) {
    return callback(null, {
      name: fileName,
      path: this.targetPath(fileName),
    });
  }
}

module.exports.Disk = Disk;
