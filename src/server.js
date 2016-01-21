'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var uuid = require('node-uuid');
var logger = require('./logger').logger;
var expressBunyanLogger = require('express-bunyan-logger');
var now = require('present');
var moment = require('moment');
var getRepoInfo = require('git-repo-info');
var os = require('os');
var cors = require('cors');
var now = require('present');
var each = require('lodash').each;
var map = require('lodash').map;
var remove = require('lodash').remove;
var sortBy = require('lodash').sortBy;
var first = require('lodash').first;
var last = require('lodash').last;
var reduce = require('lodash').reduce;
var AWS = require('aws-sdk-promise');
var s3 = new AWS.S3();

var corsOptions = {
  origin: ['http://localhost:3000'],
  methods: ['POST'],
  allowedHeaders: ['content-type'],
  credentials: true,
  preflightContinue: true
};

var app = express();
app.use(bodyParser.json({limit: '5mb'}));
app.use(bodyParser.urlencoded({ extended: true , limit: '5mb'}));
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
    'req_id',
    'user-agent'
  ]
}));
app.use(expressBunyanLogger.errorLogger({
  logger: logger
}));


var port = process.env.PORT || 4000;

var eventQueue = [];
var profileQueue = [];

function getPayloadFromRequest (req) {
  var content = req.body;
  content['app-id'] = req.params.appId;
  return content;
}

function createDurationPayload (start) {
  return {
    'app-id': 'event-capture',
    'duration': now() - start,
    'name': 'saveEvent',
    'node-env': process.env.NODE_ENV || 'development',
    'sha': getRepoInfo().sha,
    'source': os.hostname(),
    'timestamp': moment(),
    'timestamp-unix': moment().unix()
  };
}

function saveEvent (req, res) {
  var start = now();
  eventQueue.push(getPayloadFromRequest(req));
  res.sendStatus(200);
  eventQueue.push(createDurationPayload(start));
}

function saveProfileData (req, res) {
  var start = now();
  profileQueue.push(getPayloadFromRequest(req));
  res.sendStatus(200);
  eventQueue.push(createDurationPayload(start));
}

function respond404 (req, res) {
  res.sendStatus(404);
}

app.options('*', cors(corsOptions));
app.post('/event/:appId', cors(corsOptions), saveEvent);
app.post('/profile/:appId', cors(corsOptions), saveProfileData);
app.get('*', respond404);

app.listen(port, function () {
  var versionInfo = require('../package.json');
  console.log('%s@%s listening on %s', versionInfo.name, versionInfo.version, port);
});

function uploadToS3 (event) {
  var appId = event['app-id'];
  var name = event.name;
  var timestamp = event['timestamp-unix'];

  var key = ['in', appId, name, timestamp, uuid() + '.json'].join('/');

  var opts = {
    Bucket: 'ensemblejs-events',
    Key: key,
    Body: JSON.stringify(event)
  };

  s3.upload(opts).send(function (err, req) {
    if (err) {
      console.error(err);
      return;
    }

    console.log(req);
  });
}

function totesTrue () { return true; }

function getPercentile (percentile, values) {
  if (values.length === 0) {
    return 0;
  }

  var i = (percentile/100) * values.length;

  if (Math.floor(i) === i) {
    return (values[i-1] + values[i])/2;
  } else {
    return values[Math.floor(i)];
  }
}

function calculateRate (samples, veryFirstTime, now, frequency) {
  if (samples.length === 0) {
    return 0;
  }

  var totalElapsed = (now - veryFirstTime) / 1000;
  if (totalElapsed <= 0) {
    return 0;
  }

  return (samples.length / totalElapsed) * frequency;
}

function runTheNumbers (event) {
  var samples = event.raw || [];
  var sortedSamples = sortBy(samples);
  var total = reduce(samples, function (sum, n) {
    return sum + n;
  }, 0);

  event.appRuntime = event.appRuntime || 0;
  event.min = first(sortedSamples);
  event.max = last(sortedSamples);
  event['50th'] = getPercentile(0.5, sortedSamples);
  event['75th'] = getPercentile(0.75, sortedSamples);
  event['95th'] = getPercentile(0.95, sortedSamples);
  event['99th'] = getPercentile(0.99, sortedSamples);
  event.rate = calculateRate(samples, event.veryFirstTime, event.veryLastTime, event.frequency);
  event.average = total / samples.length;
  event.total = total;
  event.percentOfRuntime = total / event.appRuntime;

  return event;
}

function uploadQueuedItems () {
  var eventsToUpload = remove(eventQueue, totesTrue);
  each(eventsToUpload, uploadToS3);

  var profileDataToUpload = remove(profileQueue, totesTrue);
  each(map(profileDataToUpload, runTheNumbers), uploadToS3);
}

setInterval(uploadQueuedItems, 15000);