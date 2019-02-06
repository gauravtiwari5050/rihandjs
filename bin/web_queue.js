#! /usr/bin/env node
const { WebQueue } = require('../lib/commands/web_queue');

const webQueue = new WebQueue({
  commandLineOptions: {},
});
webQueue.execute((err) => {
  if (err) {
    console.log('Error starting rihand server', err);
  }
});

