const expect = require('expect.js'),
    proxyquire = require('proxyquire'),
    Promise = require('bluebird'),
    pagerMiddleware = require('../../middleware/pager');

describe('Pager middleware', function () {
    'use strict';

    it('200 - no custom request data --> push trough', function (done) {
        return pagerMiddleware({
            customData: {
                action: {}
            }
        }, {}, function (err) {
            if (err) {
                return done(err);
            }
            return done();
        });
    });
    it('200 - no custom action in request data --> push trough', function (done) {
        return pagerMiddleware({
            customData: {
                action: {}
            }
        }, {}, function (err) {
            if (err) {
                return done(err);
            }
            return done();
        });
    });
    it('200 - pager without any stuff', function (done) {
        return pagerMiddleware({
            customData: {
                action: {
                    pager: true,
                }
            },
            query: {}
        }, {}, function (err) {
            if (err) {
                return done(err);
            }
            return done();
        });
    });
    it('200 - pager all stuff', function (done) {
        return pagerMiddleware({
            customData: {
                action: {
                    pager: true,
                }
            },
            query: {
                filter: [
                    'test',
                    'test',
                    'test',
                    'test2',
                    'lenz'
                ],
                value: [
                    '1234',
                    '1234',
                    1234,
                    true
                ],
                orderBy: 'test',
                orderDesc: true,
                page: 1,
                limit: 10
            }
        }, {}, function (err) {
            if (err) {
                return done(err);
            }
            return done();
        });
    });
});
