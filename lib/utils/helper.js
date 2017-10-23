const _ = require('lodash');


module.exports.cleanPathUrl = function(path) { // eslint-disable-line
  if (_.isNil(path)) {
    return '';
  }
  return path.replace(/\/+/g, '/');
};

