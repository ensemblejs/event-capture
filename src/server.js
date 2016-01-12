'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var uuid = require('node-uuid');
var fs = require('fs');
var logger = require('./logger').logger;
var expressBunyanLogger = require('express-bunyan-logger');
var now = require('present');
var moment = require('moment');
var getRepoInfo = require('git-repo-info');
var os = require('os');
var mkdirp = require('mkdirp');
var path = require('path');

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressBunyanLogger({
  logger: logger,
  excludes: [
    'req',
    'res',
    'res-headers',
    'response-hrtime',
    'short-body',
    'req-headers',
    'incoming',
    'req_id'
  ]
}));
app.use(expressBunyanLogger.errorLogger({
  logger: logger
}));


var port = process.env.PORT || 3000;

function writeEvent(content) {
  var p = path.join('events/', content['app-id']);
  var filename = path.join(p, uuid() + '.json');

  mkdirp(p);
  fs.writeFile(filename, JSON.stringify(content));
}

function saveEvent (req, res) {
  var start = now();

  var content = req.body;
  content['app-id'] = req.params.appId;
  writeEvent(content);
  res.sendStatus(200);

  var duration = now() - start;

  var saveEventDuration = {
    'app-id': 'event-capture',
    'duration': duration,
    'name': 'saveEvent',
    'node-env': process.env.NODE_ENV || 'development',
    'sha': getRepoInfo().sha,
    'source': os.hostname(),
    'timestamp': moment()
  };

  writeEvent(saveEventDuration);
}

function respond404 (req, res) {
  res.sendStatus(404);
}

app.post('/event/:appId', saveEvent);
app.get('*', respond404);

app.listen(port, function () {
  var versionInfo = require('../package.json');
    console.log('%s@%s listening on %s', versionInfo.name, versionInfo.version, port);
});