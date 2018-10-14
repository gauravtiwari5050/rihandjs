const fs = require('fs');
const NodeUtils = require('util');
const upperCamelCase = require('uppercamelcase');
const path = require('path');
const _ = require('lodash');

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

  static async read(file) {
    const readFile = NodeUtils.promisify(fs.readFile);
    return readFile(file);
  }
}

module.exports.File = File;
