const _ = require('lodash');
const { Application } = require('../application/application');

class Mail {
  mailLayout() {
    return 'mailer';
  }
  constructor(options) {
    this.application = options.application;
    this.layout = 'mailer';
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
          if (_.isFunction(target.callback)) {
            target.deliver();
          }
        };
      },
    });
  }

  deliver() {
    const application = Application.getInstance();
    const MailClass = require(`${application.root()}/app/mail/${_.snakeCase(this.className)}`)[this.className]; // eslint-disable-line
    const mailObject = new MailClass({
      application,
    });
    this.methodArgs.push(this.callback);
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
