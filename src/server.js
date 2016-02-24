'use strict';

import express from 'express';
import bodyParser from 'body-parser';
import {info, logger} from './logger';
import expressBunyanLogger from 'express-bunyan-logger';
import cors from 'cors';

var corsOptions = {
  origin: ['http://localhost:3000'],
  methods: ['POST'],
  allowedHeaders: ['content-type'],
  credentials: true,
  preflightContinue: true
};

let app = express();
app.use(bodyParser.json({limit: '5mb'}));
app.use(bodyParser.urlencoded({extended: true , limit: '5mb'}));
app.use(expressBunyanLogger.errorLogger({logger: logger}));

function respond404 (req, res) {
  res.sendStatus(404);
}

import {time} from './controllers/timer-controller';
import {getApp, getSession, getTimer} from './controllers/application-controller';

app.use(cors(corsOptions));

app.options('*', cors(corsOptions));

app.get('/app/:appId', getApp);
app.get('/app/:appId/sessions/:sessionId', getSession);
app.get('/app/:appId/sessions/:sessionId/timer/:name', getTimer);

app.post('/app/:appId/sessions/:sessionId/timer/:name', time);

app.get('*', respond404);

const port = process.env.PORT || 4000;
app.listen(port, function () {
  const versionInfo = require('../package.json');
  info(`${versionInfo.name}@${versionInfo.version} listening on ${port}`);
});


// let events = [];
// let eventQueue = [];
// let profileQueue = [];

// function getPayloadFromRequest (req) {
//   let content = req.body;
//   content['app-id'] = req.params.appId;
//   return content;
// }

// function createDurationPayload (start) {
//   return {
//     'app-id': 'event-capture',
//     'duration': now() - start,
//     'name': 'saveEvent',
//     'node-env': process.env.NODE_ENV || 'development',
//     'sha': getRepoInfo().sha,
//     'source': os.hostname(),
//     'timestamp': moment(),
//     'timestamp-unix': moment().unix()
//   };
// }

// function saveEvent (req, res) {
//   var start = now();
//   eventQueue.push(getPayloadFromRequest(req));
//   res.sendStatus(200);
//   eventQueue.push(createDurationPayload(start));
// }

// function saveProfileData (req, res) {
//   var start = now();
//   profileQueue.push(getPayloadFromRequest(req));
//   res.sendStatus(200);
//   eventQueue.push(createDurationPayload(start));
// }

// function uploadToS3 (event) {
//   var appId = event['app-id'];
//   var name = event.name;
//   var timestamp = event['timestamp-unix'];

//   var key = ['in', appId, name, timestamp, uuid() + '.json'].join('/');

//   var opts = {
//     Bucket: 'ensemblejs-events',
//     Key: key,
//     Body: JSON.stringify(event)
//   };

//   //: something with event
// }

// function getPercentile (percentile, values) {
//   if (values.length === 0) {
//     return 0;
//   }

//   var i = (percentile/100) * values.length;

//   if (Math.floor(i) === i) {
//     return (values[i-1] + values[i])/2;
//   } else {
//     return values[Math.floor(i)];
//   }
// }

// function calculateRate (samples, veryFirstTime, now, frequency) {
//   if (samples.length === 0) {
//     return 0;
//   }

//   var totalElapsed = (now - veryFirstTime) / 1000;
//   if (totalElapsed <= 0) {
//     return 0;
//   }

//   return (samples.length / totalElapsed) * frequency;
// }

// function sum (set) {
//   return reduce(set, function (sum, n) { return sum + n; }, 0);
// }

// function average (set) {
//   return sum(set) / set.length;
// }

// function squareDiff (set) {
//   var avg = average(set);

//   return map(set, function (value) {
//     var diff = value - avg;
//     return diff * diff;
//   });
// }

// function stddev (set) {
//   return Math.sqrt(average(squareDiff(set)));
// }

// function runTheNumbers (event) {
//   var samples = event.raw || [];
//   var sortedSamples = sortBy(samples);

//   event.appRuntime = event.appRuntime || 0;
//   event.min = first(sortedSamples);
//   event.max = last(sortedSamples);
//   event['50th'] = getPercentile(0.5, sortedSamples);
//   event['75th'] = getPercentile(0.75, sortedSamples);
//   event['95th'] = getPercentile(0.95, sortedSamples);
//   event['99th'] = getPercentile(0.99, sortedSamples);
//   event.rate = calculateRate(samples, event.veryFirstTime, event.veryLastTime, event.frequency);
//   event.average = average(samples);
//   event.total = sum(samples);
//   event.percentOfRuntime = sum(samples) / event.appRuntime;
//   event.standardDeviation = stddev(samples);

//   return event;
// }

// function allOfThem () { return true; }

// function uploadQueuedItems () {
//   var eventsToUpload = remove(eventQueue, allOfThem);
//   each(eventsToUpload, uploadToS3);

//   var profileDataToUpload = remove(profileQueue, allOfThem);
//   each(map(profileDataToUpload, runTheNumbers), uploadToS3);
// }

// setInterval(uploadQueuedItems, 15000);