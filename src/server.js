'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var uuid = require('node-uuid');
var fs = require('fs');
var logger = require('./logger').logger;
var expressBunyanLogger = require('express-bunyan-logger');

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

function saveEvent (req, res) {
  var filename = 'events/' + uuid() + '.json';
  var content = req.body;

  fs.writeFile(filename, JSON.stringify(content));
  res.sendStatus(200);
}

function respond404 (req, res) {
  res.sendStatus(404);
}

app.post('/event', saveEvent);
app.get('*', respond404);

app.listen(port, function () {
  var versionInfo = require('../package.json');
    console.log('%s@%s listening on %s', versionInfo.name, versionInfo.version, port);
});