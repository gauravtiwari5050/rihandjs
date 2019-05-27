const _ = require('lodash');
const nodemailer = require('nodemailer');
const bytes = require('bytes');
const { View } = require('../views/view');
const { MailJob } = require('../jobs/mail_job');
const { Jobs } = require('../jobs/job');
const { File } = require('../utils/file');
const { cleanPathUrl } = require('../utils/helper');
const { Application } = require('../application/application');

class Mail {
  mailBaseUrl() {
    return null;
  }
  unsubscribe() {
    return null;
  }
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

  async attach(fileName, filePath) {
    const emailAttachmentSizeLimit = bytes.parse(this.application.configuration.value('emailAttachmentSizeLimit', `${Number.MAX_SAFE_INTEGER}`));
    const { size } = await File.statsAwait(filePath);
    if (size > emailAttachmentSizeLimit) {
      throw new Error(`Attachment at ${filePath} exceeds file size limits`);
    }
    this.addAttachment(fileName, filePath);
  }

  async deliver(mailBody) {
    const self = this;
    const mailTransportConfig = await self.application.configuration.getYamlConfig('mail.yml');
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

    let deliver = true;
    for (const Interceptor of this.application.service('mail').interceptors) {
      const interceptor = new Interceptor({
        application: this.application,
      });
      const active = await interceptor.active();
      if (active === true) {
        deliver = await interceptor.run(mailOptions);
        if (deliver !== true) {
          break;
        }
      }
    }

    // send mail with defined transport object
    return new Promise((resolve, reject) => {
      if (deliver !== true) {
        console.log('Skipping sending email')
        resolve();
        return;
      }
      transporter.sendMail(mailOptions, (error) => {
        if (error) {
          return reject(error);
        }
        return resolve();
      });
    });
  }
  async process() {
    const renderedMail = await this.render();
    await this.deliver(renderedMail);
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
  async render() {
    const mailer = _.snakeCase(this.constructor.name);
    const variables = _.extend({
      _,
      mailer,
      action: this.action,
    }, this.getViewVariables());
    variables.$unsubscribeLink = this.unsubscribe();
    variables.$mailBaseUrl = this.mailBaseUrl();
    const layout = this.mailLayout() || this.layout;
    let layoutFile = cleanPathUrl(`app/views/layouts/${layout}`);
    if (_.isNil(layout)) {
      layoutFile = null;
    }
    const templateFile = cleanPathUrl(`app/views/mail/${mailer}/${_.snakeCase(this.action)}`);
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
    return new Promise((resolve, reject) => {
      view.render((err, renderedView) => {
        if (err) {
          return reject(err);
        }
        return resolve(renderedView);
      });
    });
  }
}

class MailDelivery {
  constructor() {
    this.proxy = null;
    this.className = null;
    this.methodName = null;
    this.methodArgs = null;
    this.isDelayed = false;
    this.delayParams = null;
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
        return async function(...args) { // eslint-disable-line
          target.methodArgs = args; // eslint-disable-line
          if (target.isDelayed === true) {
            await target.queue();
          } else {
            await target.deliver();
          }
        };
      },
    });
  }

  async run() {
    await this.deliver();
  }

  async queue() {
    const options = {
      className: this.className,
      methodName: this.methodName,
      methodArgs: this.methodArgs,
    };
    const mailJob = new MailJob(options);
    const queuedJob = await Jobs.mail.submit(mailJob);
    if (!queuedJob) {
      throw new Error('Could not queue mail job');
    }
    return queuedJob;
  }

  async deliver() {
    const application = Application.getInstance();
    const MailClass = require(`${application.root()}/app/mail/${_.snakeCase(this.className)}`)[this.className]; // eslint-disable-line
    const mailObject = new MailClass({
      application,
    });
    mailObject.action = this.methodName;
    await mailObject[this.methodName](...this.methodArgs);
    await mailObject.process();
  }

  // sets the delay object
  delay(params) {
    this.isDelayed = true;
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
module.exports.MailDelivery = MailDelivery;
module.exports.Mailer = MailDelivery.getProxy();
