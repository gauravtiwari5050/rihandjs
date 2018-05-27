const fs = require('fs');
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
}

module.exports.File = File;
