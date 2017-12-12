const AWS = require('aws-sdk');
const _ = require('lodash');
const fs = require('fs');
const mime = require('mime-types');
const { FileStoreTarget } = require('./file_store_target');
const { Application } = require('../../application/application');

class S3 extends FileStoreTarget {
  save(fileName, file, callback) {
    const { configuration } = Application.getInstance();
    configuration.getYamlConfig(this.fileStore.configFile(), (err, s3Config) => {
      if (err) {
        return callback(err);
      }
      const fileStream = fs.createReadStream(file);
      fileStream.on('error', callback);
      const s3 = new AWS.S3(s3Config);
      const s3Params = _.extend({
        Key: this.targetPath(fileName),
        Body: fileStream,
        ContentType: mime.lookup(file),
      }, s3Config);
      return s3.upload(s3Params, (errS3, data) => {
        if (errS3) {
          return callback(errS3);
        }
        return callback(null, {
          name: fileName,
          path: data,
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

module.exports.S3 = S3;
