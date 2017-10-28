class Help extends require('./command').Command {
  run(callback) {
    console.log('Print help here');
    callback(null);
  }
}

module.exports.Help = Help;
