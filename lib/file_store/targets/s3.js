const AWS = require('aws-sdk');
const _ = require('lodash');
const fs = require('fs');
const mime = require('mime-types');
const { FileStoreTarget } = require('./file_store_target');
const { Application } = require('../../application/application');
const { File } = require('../../utils/file');

class S3 extends FileStoreTarget {
  fileObject(fileName, s3, s3Config) {
    const object = {
      name: fileName,
      path: this.targetPath(fileName),
    };
    const url = s3.getSignedUrl('getObject', {
      Bucket: s3Config.Bucket,
      Key: this.targetPath(fileName),
      Expires: s3Config.signedUrlExpireSeconds || 300,
    });
    object.url = url;
    return object;
  }
  async save(fileName, file) {
    const { configuration } = Application.getInstance();
    const s3Config = await configuration.getYamlConfig(this.fileStore.configFile());
    return new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(file);
      fileStream.on('error', fileStreamError => reject(fileStreamError));
      const s3 = new AWS.S3(s3Config);
      const s3Params = _.extend({
        Key: this.targetPath(fileName),
        Body: fileStream,
        ContentType: File.fileType(file).mime,
      }, s3Config);
      s3.upload(s3Params, (errS3) => {
        if (errS3) {
          return reject(errS3);
        }
        return resolve(this.fileObject(fileName, s3, s3Config));
      });
    });
  }

  async fetch(fileName) {
    const { configuration } = Application.getInstance();
    const s3Config = await configuration.getYamlConfig(this.fileStore.configFile());
    const s3 = new AWS.S3(s3Config);
    return this.fileObject(fileName, s3, s3Config);
  }
}

module.exports.S3 = S3;
