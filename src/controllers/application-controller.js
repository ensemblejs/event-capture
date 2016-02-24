'use strict';

import {get, exists, session, timerData, timerExists} from '../services/application-service';

export function getApp (req, res) {
  const appId = req.params.appId;
  const application = get(appId);

  if (!application) {
    return res.sendStatus(404);
  }

  res.status(200).send(application);
}

export function getSession (req, res) {
  const appId = req.params.appId;
  const sessionId = req.params.sessionId;
  const application = get(appId);

  if (!application) {
    return res.sendStatus(404);
  }
  if (!exists(appId, sessionId)) {
    return res.sendStatus(404);
  }

  res.status(200).send(session(appId, sessionId));
}

export function getTimer (req, res) {
  const appId = req.params.appId;
  const sessionId = req.params.sessionId;
  const timerName = req.params.name;
  const application = get(appId);
  const after = req.query.after || 0;

  if (!application) {
    return res.sendStatus(404);
  }
  if (!exists(appId, sessionId)) {
    return res.sendStatus(404);
  }
  if (!timerExists(appId, sessionId, timerName)) {
    return res.sendStatus(404);
  }

  res.status(200).send(timerData(appId, sessionId, timerName, after));
}