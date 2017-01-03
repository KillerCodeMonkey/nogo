const expect = require('expect.js'),
    proxyquire = require('proxyquire'),
    Promise = require('bluebird'),
    meHandlerMock = {
        objectSuccess: true,
        objectError: false,
        models: {
            user: {
                findById: function (id, cb) {
                    if (meHandlerMock.objectError) {
                        return cb({
                            error: 'FAIL'
                        });
                    }
                    return cb(null, meHandlerMock.objectSuccess ? {} : null);
                }
            },
            senf: true
        },
        endpoints: {
            user: {
                v1: {
                    get: {
                        'object': {
                            object: true
                        },
                        'lol': {}
                    },
                    post: {
                        '': true
                    }
                }
            }
        },
        initDb: function () {
            return [this.models.user];
        },
        load: function () {
            return new Promise((resolve) => {
                resolve([this.models, this.endpoints]);
            });
        }
    },
    actionMiddleware = proxyquire('../../middleware/action', {
        '../util/modelEndpointHandler': meHandlerMock
    });

describe('Action middleware', function () {
    'use strict';

    it('404 - missing version', function (done) {
        return actionMiddleware({
            params: {},
            method: 'GET'
        }, {}, function (err) {
            if (!err) {
                expect(true).to.be(false);
                return done();
            }
            expect(err).to.be.an('object');
            expect(err.status).to.be(404);
            expect(err.name).to.be('no_version');
            return done();
        });
    });
    it('404 - no classname', function (done) {
        return actionMiddleware({
            params: {
                version: 'v1'
            },
            method: 'GET'
        }, {}, function (err) {
            if (!err) {
                expect(true).to.be(false);
                return done();
            }
            expect(err).to.be.an('object');
            expect(err.status).to.be(404);
            expect(err.name).to.be('no_classname');
            return done();
        });
    });
    it('404 - unkown model', function (done) {
        return actionMiddleware({
            params: {
                version: 'v1',
                classname: 'test'
            },
            method: 'GET'
        }, {}, function (err) {
            if (!err) {
                expect(true).to.be(false);
                return done();
            }
            expect(err).to.be.an('object');
            expect(err.status).to.be(404);
            expect(err.name).to.be('unknown_model');
            return done();
        });
    });
    it('404 - unkown endpoint', function (done) {
        return actionMiddleware({
            params: {
                version: 'v1',
                classname: 'senf'
            },
            method: 'GET'
        }, {}, function (err) {
            if (!err) {
                expect(true).to.be(false);
                return done();
            }
            expect(err).to.be.an('object');
            expect(err.status).to.be(404);
            expect(err.name).to.be('unknown_endpoint');
            return done();
        });
    });
    it('404 - no endpoints for version', function (done) {
        return actionMiddleware({
            params: {
                version: 'v2',
                classname: 'user',
                action: 'horst'
            },
            method: 'GET'
        }, {}, function (err) {
            if (!err) {
                expect(true).to.be(false);
                return done();
            }
            expect(err).to.be.an('object');
            expect(err.status).to.be(404);
            expect(err.name).to.be('no_endpoints_for_version');
            return done();
        });
    });
    it('404 - no endpoints for method', function (done) {
        return actionMiddleware({
            params: {
                version: 'v1',
                classname: 'user',
                action: 'horst'
            },
            method: 'lenz'
        }, {}, function (err) {
            if (!err) {
                expect(true).to.be(false);
                return done();
            }
            expect(err).to.be.an('object');
            expect(err.status).to.be(404);
            expect(err.name).to.be('no_endpoints_for_method');
            return done();
        });
    });
    it('404 - action not found by action name', function (done) {
        return actionMiddleware({
            params: {
                version: 'v1',
                classname: 'user',
                action: 'account'
            },
            method: 'GET'
        }, {}, function (err) {
            if (!err) {
                expect(true).to.be(false);
                return done();
            }
            expect(err).to.be.an('object');
            expect(err.status).to.be(404);
            expect(err.name).to.be('action_not_found');
            return done();
        });
    });
    it('404 - action not found by object', function (done) {
        return actionMiddleware({
            params: {
                version: 'v1',
                classname: 'user',
                objectid: '1234'
            },
            method: 'POST'
        }, {}, function (err) {
            if (!err) {
                expect(true).to.be(false);
                return done();
            }
            expect(err).to.be.an('object');
            expect(err.status).to.be(404);
            expect(err.name).to.be('action_not_found');
            return done();
        });
    });
    it('404 - missing object', function (done) {
        return actionMiddleware({
            params: {
                version: 'v1',
                classname: 'user',
                action: 'object'
            },
            method: 'GET'
        }, {}, function (err) {
            if (!err) {
                expect(true).to.be(false);
                return done();
            }
            expect(err).to.be.an('object');
            expect(err.status).to.be(404);
            expect(err.name).to.be('missing_object');
            return done();
        });
    });
    it('404 - not object action', function (done) {
        return actionMiddleware({
            params: {
                version: 'v1',
                classname: 'user',
                action: 'lol',
                objectid: '1234'
            },
            method: 'GET'
        }, {}, function (err) {
            if (!err) {
                expect(true).to.be(false);
                return done();
            }
            expect(err).to.be.an('object');
            expect(err.status).to.be(404);
            expect(err.name).to.be('not_object_action');
            return done();
        });
    });
    it('404 - action not found class action', function (done) {
        return actionMiddleware({
            params: {
                version: 'v1',
                classname: 'user'
            },
            method: 'GET'
        }, {}, function (err) {
            if (!err) {
                expect(true).to.be(false);
                return done();
            }
            expect(err).to.be.an('object');
            expect(err.status).to.be(404);
            expect(err.name).to.be('action_not_found');
            return done();
        });
    });
    it('404 - object not found', function (done) {
        meHandlerMock.objectSuccess = false;
        return actionMiddleware({
            params: {
                version: 'v1',
                classname: 'user',
                action: 'object',
                objectid: '1234'
            },
            method: 'GET'
        }, {}, function (err) {
            meHandlerMock.objectSuccess = true;
            if (!err) {
                expect(true).to.be(false);
                return done();
            }
            expect(err).to.be.an('object');
            expect(err.status).to.be(404);
            expect(err.name).to.be('object_not_found');
            return done();
        });
    });
    it('404 - db error while retrieving object', function (done) {
        meHandlerMock.objectError = true;
        return actionMiddleware({
            params: {
                version: 'v1',
                classname: 'user',
                action: 'object',
                objectid: '1234'
            },
            method: 'GET'
        }, {}, function (err) {
            meHandlerMock.objectError = false;
            if (!err) {
                expect(true).to.be(false);
                return done();
            }
            expect(err).to.be.an('object');
            expect(err.status).to.be(404);
            expect(err.name.error).to.be('FAIL');
            return done();
        });
    });
    it('200 - get object', function (done) {
        return actionMiddleware({
            params: {
                version: 'v1',
                classname: 'user',
                action: 'object',
                objectid: '1234'
            },
            method: 'GET'
        }, {}, function (err) {
            if (err) {
                return done(err);
            }
            return done();
        });
    });
    it('200 - get object with defined req.customData', function (done) {
        return actionMiddleware({
            params: {
                version: 'v1',
                classname: 'user',
                action: 'object',
                objectid: '1234'
            },
            customData: {},
            method: 'GET'
        }, {}, function (err) {
            if (err) {
                return done(err);
            }
            return done();
        });
    });
    it('200 - call without object', function (done) {
        return actionMiddleware({
            params: {
                version: 'v1',
                classname: 'user',
                action: 'lol'
            },
            method: 'GET'
        }, {}, function (err) {
            if (err) {
                return done(err);
            }
            return done();
        });
    });
    it('200 - call class request', function (done) {
        return actionMiddleware({
            params: {
                version: 'v1',
                classname: 'user'
            },
            method: 'POST'
        }, {}, function (err) {
            if (err) {
                return done(err);
            }
            return done();
        });
    });
    it('200 - object request', function (done) {
        return actionMiddleware({
            params: {
                version: 'v1',
                classname: 'user',
                objectid: '1234'
            },
            method: 'GET'
        }, {}, function (err) {
            if (err) {
                return done(err);
            }
            return done();
        });
    });
});
