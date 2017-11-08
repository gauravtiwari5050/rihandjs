#! /usr/bin/env node
const process = require('process');
const minimist = require('minimist');
const _ = require('lodash');
const upperCamelCase = require('uppercamelcase');

const commandLineArgsArray = process.argv.slice(2);
const options = minimist(commandLineArgsArray);
let commandName = options._.shift();

if (_.isEmpty(commandName)) {
  commandName = 'help';
}


const Command = require(`../lib/commands/${commandName}`)[upperCamelCase(commandName)]; //eslint-disable-line

if (_.isNil(Command)) {
  console.log(`Unknown command ${commandName}. Please run rihand --help for options`);
  process.exit(-1);
}

const command = new Command({
  commandLineOptions: options,
});

command.execute((err, params) => {
  if (err) {
    console.log(`Error executing command ${commandName}`, err);
  }
  if (_.isNil(params)) {
    params = {}; // eslint-disable-line
  }

  if (err && _.isNil(params.exit)) {
    params.exit = 1; // eslint-disable-line
  }

  if (!_.isNil(params.exit)) {
    process.exit(params.exit);
  }
});

