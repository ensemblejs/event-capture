'use strict';

let appRoot = require('app-root-path');
let packageInfo = require(appRoot + '/package.json');

export let logger = require('bunyan').createLogger({
  name: packageInfo.name,
  version: packageInfo.version,
  streams: [
    {
      level: 'debug',
      stream: process.stdout
    }
  ]
});

import * as consoleColour from 'js-console-color';

consoleColour.envAssign({
  debug: ['blue', 'dim'],
  info: ['black'],
  warn: ['bgYellow', 'black'],
  error: ['bgRed', 'black']
});

export let debug = consoleColour.debug;
export let info = consoleColour.info;
export let warn = consoleColour.warn;
export let error = consoleColour.error;