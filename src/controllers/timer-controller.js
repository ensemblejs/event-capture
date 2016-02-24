'use strict';

import {get, register, exists, start, timerExists, addTimer, addSamples} from '../services/application-service';

export function time (req, res) {
  const appId = req.params.appId;
  const sessionId = req.params.sessionId;
  const name = req.params.name;
  const frequency = req.body.frequency;
  const samples = req.body.samples;

  let application = get(appId);

  if (!application) {
    register(appId);
  }

  if (!exists(appId, sessionId)) {
    start(appId, sessionId);
  }

  if (!timerExists(appId, sessionId, name)) {
    addTimer(appId, sessionId, name, frequency);
  }

  addSamples(appId, sessionId, name, samples);

  res.sendStatus(200);
}

