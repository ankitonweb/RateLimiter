#!/usr/bin/env node

/* eslint no-console: ["error", { allow: ["error"] }] */

import debugLib from 'debug';
import http from 'http';
import fetch from 'node-fetch';

import app from '../app';

const debug = debugLib('ratelimiter:www');
debug.enabled = true;

const port = parseInt(process.env.VERTEX_PORT || '9071', 10);

const onListening = server => {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
  debug(`HTTP listening on ${bind}`);
};

const onError = error => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
};

app.set('port', port);

const server = http.createServer(app);
server.on('error', onError);
server.on('listening', () => onListening(server));
server.listen(port);
