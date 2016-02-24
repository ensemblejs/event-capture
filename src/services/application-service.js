'use strict';

import {filter, first, map, cloneDeep} from 'lodash';
import moment from 'moment';

let applications = {};

export function register (appId) {
  applications[appId] = {
    id: appId,
    sessions: []
  };
}

export function get (appId) {
  return applications[appId];
}

export function start (appId, sessionId) {
  applications[appId].sessions.push({
    id: sessionId,
    timers: {}
  });
}

export function exists (appId, sessionId) {
  return filter(applications[appId].sessions, {id: sessionId}).length > 0;
}

export function session (appId, sessionId) {
  return first(filter(applications[appId].sessions, {id: sessionId}));
}

export function timerExists (appId, sessionId, timerName) {
  var s = session(appId, sessionId);
  return s.timers[timerName] !== undefined;
}

export function addTimer (appId, sessionId, timerName, frequency = 1) {
  let s = session(appId, sessionId);

  s.timers[timerName] = {
    name: timerName,
    samples: [],
    frequency: frequency,
    updated: moment().unix()
  };
}

export function addSamples (appId, sessionId, timerName, samples) {
  let s = session(appId, sessionId);

  const updated = moment().unix();

  s.timers[timerName].samples = s.timers[timerName].samples.concat(map(samples, sample => {
    return { value: sample, updated: updated };
  }));
  s.timers[timerName].updated = updated;
}

export function timerData (appId, sessionId, timerName, after) {
  var data = cloneDeep(session(appId, sessionId).timers[timerName]);

  data.samples = filter(data.samples, sample => sample.updated > after);

  return data;
}