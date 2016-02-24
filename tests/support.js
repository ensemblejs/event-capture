'use strict';

import request from 'request';

function body (res) {
  try {
    return JSON.parse(res.body);
  } catch (Exception) {
    return res.body;
  }
}

export function get (url, f) {
  request.get(`http://localhost:4000${url}`, function(err, res) {
    if (err) {
      console.error(err);
    }

    f(res, body(res));
  });
}

export function post (opts, f) {
  request.post(opts, function (err, res) {
    if (err) {
      console.error(err);
    }

    f(res, body(res));
  });
}

export function postUrl (url, body) {
  return {
    url: `http://localhost:4000${url}`,
    method: 'POST',
    headers: {
      'Accept': 'application/json'
    },
    json: true,
    body: body
  };
}