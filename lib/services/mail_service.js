const upperCamelCase = require('uppercamelcase');
const fs = require('fs');
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const _ = require('lodash');
const { Logger } = require('../logging/log');
/**
 * Mail Service
 */
class MailService extends require('./service').Service {
  requiredServices() {
    return ['asset_pipeline', 'view'];
  }
  initialize(options, callback) {
    console.log('Initializing mail service');
    return callback(null);
  }
  start(options, callback) {
    return callback(null);
  }
}

module.exports.MailService = MailService;
