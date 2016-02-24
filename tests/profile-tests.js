'use strict';

import {get, post, postUrl} from './support';
import expect from 'expect';
import sinon from 'sinon';
import moment from 'moment';
import {map} from 'lodash';

require('../src/server');

describe('an application under profile', function () {
  describe('sending a session event', function () {
  });

  describe('sending a profile event', function () {
    beforeEach(done => {
      post(postUrl('/app/myApp/sessions/1/timer/latency', {
        frequency: 100,
        samples: [1]
      }), () => done());
    });

    it('should create an application if one does not exist', done => {
      get('/app/myApp', (res, app) => {
        expect(app.id).toEqual('myApp');
        done();
      });
    });

    it('should create an session if one does not exist', done => {
      get('/app/myApp', (res, app) => {
        expect(app.sessions.length).toEqual(1);
        done();
      });
    });

    it('should not create duplicate session', done => {
      post(postUrl('/app/myApp/sessions/1/timer/latency', {}), () => {
        get('/app/myApp', (res, app) => {
          expect(app.sessions.length).toEqual(1);
          done();
        });
      });
    });

    it('should add a timer', done => {
      get('/app/myApp/sessions/1', (res, session) => {
        expect(session.id).toEqual('1');
        expect(session.timers.latency.name).toEqual('latency');
        done();
      });
    });

    it('should add a timer metadata', done => {
      get('/app/myApp/sessions/1', (res, session) => {
        expect(session.timers.latency.frequency).toEqual(100);
        done();
      });
    });

    it('should ignore subsequent frequency values', done => {
      post(postUrl('/app/myApp/sessions/1/timer/latency', {frequency: 1}), () => {
        get('/app/myApp/sessions/1', (res, session) => {
          expect(session.timers.latency.frequency).toEqual(100);
          done();
        });
      });
    });

    it('should default frequency to 1 if not sent', done => {
      post(postUrl('/app/myApp/sessions/2/timer/latency', {}), () => {
        get('/app/myApp/sessions/2', (res, session) => {
          expect(session.timers.latency.frequency).toEqual(1);
          done();
        });
      });
    });

    it('should add the sample information', done => {
      post(postUrl('/app/myApp/sessions/3/timer/latency', {samples: [2]}), () => {
        get('/app/myApp/sessions/3', (res, session) => {
          expect(map(session.timers.latency.samples, 'value')).toEqual([2]);

          post(postUrl('/app/myApp/sessions/3/timer/latency', {samples: [3]}), () => {
            get('/app/myApp/sessions/3', (res, session) => {
              expect(map(session.timers.latency.samples, 'value')).toEqual([2, 3]);
              done();
            });
          });
        });
      });
    });

    it('should concatenate multiple samples', done => {
      post(postUrl('/app/myApp/sessions/4/timer/latency', {samples: [2, 3]}), () => {
        get('/app/myApp/sessions/4', (res, session) => {
          expect(map(session.timers.latency.samples, 'value')).toEqual([2, 3]);
          done();
        });
      });
    });
  });
});

describe('application controller', function () {
  describe('GET /app/:appId', function () {
    it('should return a 404 if the application is not found', done => {
      get('/app/notFound', res => {
        expect(res.statusCode).toEqual(404);
        done();
      });
    });
  });

  describe('GET /app/:appId/sessions/:sessionId', function () {
    beforeEach(done => {
      post(postUrl('/app/found/sessions/found/timer/latency', {}), () => done());
    });

    it('should return a 404 if the application is not found', done => {
      get('/app/notFound/sessions/found', res => {
        expect(res.statusCode).toEqual(404);
        done();
      });
    });

    it('should return a 404 if the session is not found', done => {
      get('/app/found/sessions/notFound', res => {
        expect(res.statusCode).toEqual(404);
        done();
      });
    });
  });

  describe('GET /app/:appId/sessions/:sessionId/timer/:name', function () {
    it('should return a 404 if the application is not found', done => {
      get('/app/notFound/sessions/33/timer/latency', res => {
        expect(res.statusCode).toEqual(404);
        done();
      });
    });

    it('should return a 404 if the session is not found', done => {
      get('/app/pong/sessions/notFound/timer/latency', res => {
        expect(res.statusCode).toEqual(404);
        done();
      });
    });

    it('should return a 404 if the timer is not found', done => {
      get('/app/pong/sessions/33/timer/notFound', res => {
        expect(res.statusCode).toEqual(404);
        done();
      });
    });

    describe('with data', function () {
      let clock;

      beforeEach(done => {
        clock = sinon.useFakeTimers(moment('2012-05-20').valueOf());

        post(postUrl('/app/pong/sessions/33/timer/latency', {
          samples: [3, 4, 51, 3, 3, 4]
        }), () => { done(); });
      });

      afterEach(function () {
        clock.restore();
      });

      it('should return the samples', done => {
        get('/app/pong/sessions/33/timer/latency', (res, timer) => {
          expect(map(timer.samples, 'value')).toEqual([3, 4, 51, 3, 3, 4]);
          done();
        });
      });

      it('should return the frequency', done => {
        get('/app/pong/sessions/33/timer/latency', (res, timer) => {
          expect(timer.frequency).toEqual(1);
          done();
        });
      });

      it('should return the time of last sample', done => {
        get('/app/pong/sessions/33/timer/latency', (res, timer) => {
          expect(timer.updated).toEqual(1337436000);
          done();
        });
      });

      describe('with after filter', function () {
        beforeEach(done => {
          clock.tick(1000);

          post(postUrl('/app/pong/sessions/33/timer/latency', {
            samples: [1, 2, 3]
          }), () => { done(); });
        });

        it('should return any samples received since then', done => {
          get('/app/pong/sessions/33/timer/latency?after=1337436000', (res, timer) => {
            expect(map(timer.samples, 'value')).toEqual([1, 2, 3]);
            expect(timer.updated).toEqual(1337436001);

            done();
          });
        });

        it('should return an empty array if no new samples', done => {
          get('/app/pong/sessions/33/timer/latency?after=2999999999', (res, timer) => {
            expect(timer.samples).toEqual([]);
            expect(timer.updated).toEqual(1337436001);

            done();
          });
        });
      });
    });

  });
});