var _ = require('lodash');
var argv = require('yargs').argv;
class CommandLineArgs {
  constructor() {
    this.args = argv;
  }
  update(args){
    if(_.isNil(args)){
      return;
    }
    _.extend(this.args, args);
  }

  getValue(key) {
    return this.args[key];
  }
}

module.exports.CommandLineArgs = new CommandLineArgs();