'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var uuid = require('node-uuid');
var fs = require('fs');

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var port = process.env.PORT || 3000;

fs.mkdir('events', function () {});

function saveEvent (request, response) {
  var filename = 'events/' + uuid() + '.json';
  var content = request.body;

  fs.writeFile(filename, JSON.stringify(content));
  response.sendStatus(200);
}

app.post('/event', saveEvent);

app.listen(port, function () {
  var versionInfo = require('../package.json');
    console.log('%s@%s listening on %s', versionInfo.name, versionInfo.version, port);
});