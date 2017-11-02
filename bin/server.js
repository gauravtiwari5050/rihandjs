#! /usr/bin/env node
const { Server } = require('../lib/commands/server');

const server = new Server({
  commandLineOptions: {},
});
server.execute((err) => {
  if (err) {
    console.log('Error starting rihand server', err);
  }
});

