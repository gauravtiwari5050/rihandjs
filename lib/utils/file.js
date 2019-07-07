const fs = require('fs');
const NodeUtils = require('util');
const upperCamelCase = require('uppercamelcase');
const path = require('path');
const _ = require('lodash');
const yaml = require('js-yaml');
const readChunk = require('read-chunk');
const fileType = require('file-type');
const mime = require('mime-types');


class File {
  static async validClassesFromDirectory(directory) {
    return new Promise((resolve, reject) => {
      fs.readdir(directory, (err, files) => {
        if (err) {
          return reject(err);
        }
        let classes = [];
        try {
          classes = _.map(files, (fileName) => {
            if (/^\..*/.test(fileName)) {
              return null;
            }
            const baseFileName = path.parse(fileName).name;
            const Class = require(`${directory}/${fileName}`)[upperCamelCase(baseFileName)]; //eslint-disable-line
            return Class;
          });
        } catch (e) {
          console.log(e);
        }
        classes = _.compact(classes);
        return resolve(classes);
      });
    });
  }
  
  static directoryExists(directory) {
    return new Promise((resolve, reject) => {
      fs.stat(directory, (err, stats) => {
        if (err) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  static stats(source, callback) {
    return fs.lstat(source, callback);
  }

  static statsAwait(source) {
    return new Promise((resolve, reject) => {
      fs.lstat(source, (err, stats) => {
        if (err) {
          return reject(err);
        }
        return resolve(stats);
      });
    });
  }

  static async exists(source) {
    return new Promise((resolve) => {
      File.stats(source, (err) => {
        if (err) {
          return resolve(false);
        }
        return resolve(true);
      });
    });
  }

  static async read(file) {
    const readFile = NodeUtils.promisify(fs.readFile);
    return readFile(file);
  }
  static async readYaml(file) {
    const contents = await File.read(file);
    return yaml.safeLoad(contents);
  }
  static fileType(file) {
    const buffer = readChunk.sync(file, 0, fileType.minimumBytes);
    let object = fileType(buffer);
    if (_.isNil(object)) {
      object = {
        mime: mime.lookup(file),
      };
    }
    return object;
  }
}

module.exports.File = File;
