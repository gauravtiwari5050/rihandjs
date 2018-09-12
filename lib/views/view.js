const ejs = require('ejs');
const async = require('async');
const _ = require('lodash');
const path = require('path');
const { Route } = require('../routing/routes');
const fs = require('fs');

class ViewData {
  constructor() {
    this.assetPipelineService = null;
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

  assetPath(assetName) {
    return this.assetPipelineService.assetPath(assetName);
  }
  css(assetName) {
    return this.assetPipelineService.css(assetName);
  }
  js(assetName) {
    return this.assetPipelineService.js(assetName);
  }

  stylesheetLinkTag(assetName) {
    return this.css(assetName);
  }
  lazyJavascript(assetName) {
    const originalUrl = this.assetPath(`${assetName}.js`);
    const variableName = `jsElement${_.random(0, 1000)}`;
    const script = `
      <script type="application/javascript">
        // DOM: Create the script element
        var ${variableName} = document.createElement("script");
        // set the type attribute
        ${variableName}.type = "application/javascript";
        // make the script element load file
        ${variableName}.src = '${originalUrl}';
        // finally insert the element to the body element in order to load the script
        document.body.appendChild(${variableName});
      </script>
    `;
    return script;
  }
  javascriptIncludeTag(assetName, lazy) {
    if (lazy === true) {
      return this.lazyJavascript(assetName);
    }
    return this.js(assetName);
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
    this.data.assetPipelineService = options.assetPipelineService;
    this.viewService = options.viewService;
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
    const variables = _.extend(self.viewService.locals, self.variables);
    self.data.addVariables(variables);
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
    if (_.isNil(file)) {
      return callback(null, null);
    }
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
      if (_.isNil(candidate)) {
        return cb(null, null);
      }
      let candidateFile = path.resolve(self.appRoot, candidate);
      candidateFile = candidateFile.replace(/:/g, '');
      return fs.access(candidateFile, fs.constants.F_OK | fs.constants.R_OK, (err) => { // eslint-disable-line
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
            return cb(null);
          });
        },
        function (cb) {
          self.resolveFile(self.templateFile, (err, resolvedFile) => {
            if (err) {
              return cb(err);
            }
            self.templateFile = resolvedFile;
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
