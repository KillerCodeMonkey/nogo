var expect = require('expect.js'),
    proxyquire = require('proxyquire'),
    Promise = require('bluebird'),
    meHandlerMock = {
        models: {
            user: {}
        },
        initDb: function () {
            return [this.models.user];
        },
        load: function () {
            var self = this;
            return new Promise(function (resolve) {
                resolve([self.models, self.endpoints]);
            });
        }
    },
    action1 = {
        pager: true,
        models: ['user'],
        files: []
    },
    action2 = {},
    executeMiddleware = proxyquire('../../middleware/execute', {
        '../util/modelEndpointHandler': meHandlerMock
    });

describe('Execute middleware', function () {
    'use strict';

    it('200 - no custom request data --> push trough', function (done) {
        return executeMiddleware({
        }, {}, function (err) {
            if (err) {
                return done(err);
            }
            return done();
        });
    });
    it('200 - no action in custom request data --> push trough', function (done) {
        return executeMiddleware({
            customData: {}
        }, {}, function (err) {
            if (err) {
                return done(err);
            }
            return done();
        });
    });
    it('200 - no action in custom request data --> push trough', function (done) {
        return executeMiddleware({
            customData: {}
        }, {}, function (err) {
            if (err) {
                return done(err);
            }
            return done();
        });
    });
    it('200 - with action pager, file, models', function (done) {
        action1.exec = function (req, res, User, next) {
            expect(req).to.be.an('object');
            expect(req.files).to.be.an('object');
            expect(User).to.be.an('object');
            expect(next).to.be.a('function');
            expect(req.user).to.be('test');
            expect(req.accessToken).to.be('123');
            expect(req.authentication).to.be('yes');
            expect(req.db).to.be('lol');
            expect(req.object).to.be('huhu');
            expect(req.params).to.be('hehe');
            return done();
        };
        return executeMiddleware({
            customData: {
                action: action1,
                user: 'test',
                accessToken: '123',
                authentication: 'yes',
                object: 'huhu',
                params: 'hehe'
            },
            db: 'lol',
            query: {}
        }, {}, function (err) {
            if (err) {
                return done(err);
            }
            return done();
        });
    });
    it('200 - with action and file req.file', function (done) {
        action1.exec = function (req, res, User, next) {
            expect(req).to.be.an('object');
            expect(req.files).to.be.an('array');
            expect(req.files.length).to.be(1);
            expect(req.files[0]).to.be(true);
            return done();
        };
        return executeMiddleware({
            customData: {
                action: action1
            },
            query: {},
            file: true
        }, {}, function (err) {
            if (err) {
                return done(err);
            }
            return done();
        });
    });
    it('200 - with action and file req.files', function (done) {
        action1.exec = function (req, res, User, next) {
            expect(req).to.be.an('object');
            expect(req.files).to.be.an('array');
            expect(req.files.length).to.be(2);
            expect(req.files[0]).to.be(true);
            expect(req.files[1]).to.be(false);
            return done();
        };
        return executeMiddleware({
            customData: {
                action: action1
            },
            query: {},
            files: [true, false]
        }, {}, function (err) {
            if (err) {
                return done(err);
            }
            return done();
        });
    });
    it('200 - with nothing special', function (done) {
        action2.exec = function (req, res, User, next) {
            expect(req).to.be.an('object');
            expect(req.files).to.be(undefined);
            expect(req.pager).to.be(undefined);
            expect(User).to.be.an('object');
            expect(next).to.be.a('function');
            expect(req.user).to.be(undefined);
            expect(req.accessToken).to.be(undefined);
            expect(req.authentication).to.be(undefined);
            expect(req.db).to.be(undefined);
            expect(req.object).to.be(undefined);
            expect(req.params).to.be(undefined);
            return done();
        };
        return executeMiddleware({
            customData: {
                action: action2
            }
        }, {}, function (err) {
            if (err) {
                return done(err);
            }
            return done();
        });
    });
    it('200 - throw error', function (done) {
        action2.exec = function (req, res, User, next) {
            throw 'lol';
        };
        return executeMiddleware({
            customData: {
                action: action2
            }
        }, {}, function (err) {
            if (!err) {
                return done(new Error('failed'));
            }
            expect(err).to.be('lol');
            return done();
        });
    });
});
