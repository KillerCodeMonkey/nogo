var expect = require('expect.js'),
    proxyquire = require('proxyquire'),
    Promise = require('bluebird'),
    permissionMiddleware = require('../../middleware/permission');

describe('Permission middleware', function () {
    'use strict';

    it('200 - no custom request data --> push trough', function (done) {
        return permissionMiddleware({
        }, {}, function (err) {
            if (err) {
                return done(err);
            }
            return done();
        });
    });
    it('200 - no custom action in request data --> push trough', function (done) {
        return permissionMiddleware({
            customData: {}
        }, {}, function (err) {
            if (err) {
                return done(err);
            }
            return done();
        });
    });
    it('200 - action without any permission restrictions', function (done) {
        return permissionMiddleware({
            customData: {
                action: {
                    permissions: []
                }
            }
        }, {}, function (err) {
            if (err) {
                return done(err);
            }
            return done();
        });
    });
    it('403 - action permission restrictions but user has no', function (done) {
        return permissionMiddleware({
            customData: {
                action: {
                    permissions: ['user']
                },
                user: {}
            }
        }, {}, function (err) {
            if (!err) {
                return done(new Error('failed'));
            }
            expect(err.status).to.be(403);
            expect(err.name).to.be('permission_denied');
            return done();
        });
    });
    it('403 - action permission restrictions but user has wrong', function (done) {
        return permissionMiddleware({
            customData: {
                action: {
                    permissions: ['user']
                },
                user: {
                    permissions: ['lenz']
                }
            }
        }, {}, function (err) {
            if (!err) {
                return done(new Error('failed'));
            }
            expect(err.status).to.be(403);
            expect(err.name).to.be('permission_denied');
            return done();
        });
    });
    it('200 - user has correct permissions for action', function (done) {
        return permissionMiddleware({
            customData: {
                action: {
                    permissions: ['user']
                },
                user: {
                    permissions: ['user']
                }
            }
        }, {}, function (err) {
            if (err) {
                return done(err);
            }
            return done();
        });
    });
});
