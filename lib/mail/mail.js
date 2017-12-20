const _ = require('lodash');
const nodemailer = require('nodemailer');
const { View } = require('../views/view');
const { cleanPathUrl } = require('../utils/helper');
const { Application } = require('../application/application');

class Mail {
  defaultTo() {
    return null;
  }
  defaultFrom() {
    return null;
  }
  defaultCC() {
    return null;
  }
  defaultBCC() {
    return null;
  }
  mailLayout() {
    return null;
  }
  mailContentType() {
    return null;
  }
  mailerInternalVariablePrefix() {
    return null;
  }
  constructor(options) {
    this.application = options.application;
    this.internalVariablePrefix = '$';
    this.layout = 'mailer';
    this.action = null;
    this.to = null;
    this.from = null;
    this.subject = null;
    this.attachments = [];
  }
  addAttachment(fileName, filePath) {
    this.attachments.push({
      filename: fileName,
      path: filePath,
    });
  }

  deliver(mailBody, callback) {
    const self = this;
    self.application.configuration.getYamlConfig('mail.yml', (errConfig, mailTransportConfig) => {
      if (errConfig) {
        return callback(errConfig);
      }
      const transporter = nodemailer.createTransport(mailTransportConfig);
      const mailOptions = {
        from: (self.from || self.defaultFrom()), // sender address
        to: (self.to || self.defaultTo()), // list of receivers
        subject: self.subject, // Subject line
      };
      const cc = self.cc || self.defaultCC() || [];
      const bcc = self.bcc || self.defaultBCC() || [];
      if (cc.length > 0) {
        mailOptions.cc = cc;
      }
      if (bcc.length > 0) {
        mailOptions.bcc = bcc;
      }
      if (self.attachments.length > 0) {
        mailOptions.attachments = self.attachments;
      }
      const contentType = this.contentType || this.mailContentType() || 'html';
      mailOptions[contentType] = mailBody;
      // send mail with defined transport object
      return transporter.sendMail(mailOptions, error => callback(error));
    });
  }
  process(callback) {
    const self = this;
    return self.render((errRender, renderedMail) => {
      if (errRender) {
        return callback(errRender);
      }
      return self.deliver(renderedMail, callback);
    });
  }
  getViewVariables() {
    const self = this;
    let keys = Object.keys(this);
    keys = _.filter(keys, (key) => { // eslint-disable-line
      return key.startsWith(self.mailerInternalVariablePrefix() || self.internalVariablePrefix);
    });
    // pick view variables and leave internal variables of type @__xxx
    const viewVariables = {};

    for (var key of keys) { // eslint-disable-line
      viewVariables[key] = this[key];
    }

    return viewVariables;
  }
  render(callback) {
    const mailer = _.snakeCase(this.constructor.name);
    const variables = _.extend({
      mailer,
      action: this.action,
    }, this.getViewVariables());
    const layout = this.mailLayout() || this.layout;
    let layoutFile = cleanPathUrl(`app/views/layouts/${layout}`);
    if (_.isNil(layout)) {
      layoutFile = null;
    }
    const templateFile = cleanPathUrl(`app/views/mail/${mailer}/${this.action}`);
    const appRoot = this.application.root();
    const format = this.mailContentType() || this.contentType || 'html';
    const assetPipelineService = this.application.service('asset_pipeline');
    const viewService = this.application.service('view');
    const view = new View({
      layoutFile,
      templateFile,
      variables,
      appRoot,
      format,
      assetPipelineService,
      viewService,
    });
    return view.render(callback);
  }
}

class MailDelivery {
  constructor() {
    this.proxy = null;
    this.className = null;
    this.methodName = null;
    this.methodArgs = null;
    this.delayParams = null;
    this.callback = null;
    // proxy to mail deliver object
    this.proxy = new Proxy(this, {
      // any method invoked on the proxy will hit the below get method
      get(target, name) {
        // if a delay method is invoked, we will return the main objects delay method
        if (name === 'delay') {
          return target.delay;
        }
        // else save method name that was invoked
        target.methodName = name; // eslint-disable-line
        // return a closure that would conditionally invoke the method on actual mailer object
        return function(...args) { // eslint-disable-line
          // the only convention is thay every method in a mail class will have the last
          // argument as a callback
          if (args.length > 0) {
            target.callback = args.pop(); // eslint-disable-line
          }
          target.methodArgs = args; // eslint-disable-line
          if (_.isNil(target.delayParams)) {
            // deliver immediately
            if (_.isFunction(target.callback)) {
              return target.deliver(errDelivery => target.callback(errDelivery));
            } else {
              throw new Error('Last argument to a mail method should be a callback');
            }
          }
          if (_.isFunction(target.callback)) {
            // TODO job persistence
            return target.callback();
          }
        };
      },
    });
  }

  run(callback) {
    return this.deliver(callback);
  }

  deliver(callback) {
    const application = Application.getInstance();
    const MailClass = require(`${application.root()}/app/mail/${_.snakeCase(this.className)}`)[this.className]; // eslint-disable-line
    const mailObject = new MailClass({
      application,
    });
    mailObject.action = this.methodName;

    this.methodArgs.push((errExecution) => {
      if (errExecution) {
        callback(errExecution);
      }
      mailObject.process(callback);
    });
    return mailObject[this.methodName](...this.methodArgs);
  }

  // sets the delay object
  delay(params) {
    this.delayParams = params || {};
    return this;
  }

  // a proxy object to recieve the name of the mailer class
  // Example:
  // Mailer.UserMail will return a proxy to MailDelivery object with className UserMail
  static getProxy() {
    return new Proxy({}, {
      get(target, name) {
        const mailDelivery = new MailDelivery();
        mailDelivery.className = name;
        return mailDelivery.proxy;
      },
    });
  }
}

module.exports.Mail = Mail;
module.exports.Mailer = MailDelivery.getProxy();
