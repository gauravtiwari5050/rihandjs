const ejs = require('ejs');
const async = require('async');
const _ = require('lodash');
const path = require('path');
const { Route } = require('../routing/routes_v2');
const fs = require('fs');

class ViewData {
  constructor() {
    this.blockStrings = {};
    this.blockTemplates = {};
  }

  addVariables(_vars) {
    const self = this;
    _.forOwn(_vars, (value, key) => {
      self[key] = value;
    });
  }
  addVariable(variable, value) {
    const self = this;
    if (_.isNil(variable)) {
      return;
    }
    self[variable] = value;
  }

  contentFor(block, str) {
    this.blockStrings[block] = str;
  }

  contentForTemplate(block, templateFile) {
    this.blockTemplates[block] = templateFile;
  }

  yieldFor(block) {
    return this.blockStrings[block];
  }
}
class View {
  constructor(options) {
    const self = this;
    self.layoutFile = options.layoutFile;
    self.templateFile = options.templateFile;
    self.variables = options.variables;
    self.appRoot = options.appRoot;
    self.format = options.format;
    this.data = new ViewData();
  }

  get vars() {
    return this.data.variables;
  }
  set vars(_vars) {
    this.data.vars = _vars || {};
  }

  renderFile(templateFile, body, callback) {
    const self = this;
    self.data.addVariable('body', body);
    return ejs.renderFile(templateFile, self.data, {}, callback);
  }
  renderToString(templateFile, body, callback) {
    const self = this;

    async.map(_.toPairs(self.data.blockTemplates), (pair, cb) => {
      const block = pair[0];
      self.resolveFile(pair[1], (err, blockTemplateFile) => {
        if (err) {
          return cb(err);
        }

        return self.renderFile(
          blockTemplateFile,
          null,
          (errBlockTemplate, renderedBlockTemplate) => {
            if (errBlockTemplate) {
              return cb(err);
            }
            self.data.blockStrings[block] = renderedBlockTemplate;

            return cb(null);
          },
        );
      });
    }, (err) => {
      if (err) {
        return callback(err);
      }
      self.data.blockTemplates = {};
      return self.renderFile(templateFile, body, callback);
    });
  }

  renderView(callback) {
    const self = this;
    self.data.addVariables(self.variables);
    self.renderToString(self.templateFile, null, (err, renderedTemplate) => {
      if (err) {
        return callback(err);
      }
      if (_.isNil(self.layoutFile)) {
        return callback(null, renderedTemplate);
      }
      return self.renderToString(self.layoutFile, renderedTemplate, (errLayout, renderedLayout) => {
        if (errLayout) {
          return callback(errLayout);
        }
        return callback(null, renderedLayout);
      });
    });
  }

  resolveFile(file, callback) {
    const self = this;
    const mimeObject = Route.getMimeObject(self.format);
    if (_.isNil(mimeObject)) {
      return callback(`Invalid format ${self.format} for generating view`);
    }
    const candidates = [file];
    _.map(mimeObject.extensions, (extension) => {
      candidates.push(`${file}.${extension}`);
      candidates.push(`${file}.${extension}.ejs`);
    });

    let resolvedFile = null;
    return async.eachSeries(candidates, (candidate, cb) => {
      const candidateFile = path.resolve(self.appRoot, candidate);
      fs.access(candidateFile, fs.constants.F_OK | fs.constants.R_OK, (err) => { // eslint-disable-line
        if (err) {
          return cb(null);
        }
        resolvedFile = candidateFile;
        return cb(true);
      });
    }, () => {
      if (_.isEmpty(resolvedFile)) {
        return callback(`Could not find template file ${file}.\n One of the following should be available relative to application root\n ${candidates.join('\n')}`);
      }
      return callback(null, resolvedFile);
    });
  }

  render(callback) {
    const self = this;
    async.waterfall(
      [
        function (cb) {
          self.resolveFile(self.layoutFile, (err, resolvedFile) => {
            if (err) {
              return cb(err);
            }

            self.layoutFile = resolvedFile;
            console.log("Layout file is", self.layoutFile);

            return cb(null);
          });
        },
        function (cb) {
          self.resolveFile(self.templateFile, (err, resolvedFile) => {
            if (err) {
              return cb(err);
            }
            self.templateFile = resolvedFile;
            console.log("templateFile file is", self.templateFile);
            return cb(null);
          });
        },
      ],

      (err) => {
        if (err) {
          return callback(err);
        }
        return self.renderView(callback);
      },
    );
  }
}
module.exports.View = View;
