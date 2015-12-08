var expect = require('expect.js'),
    proxyquire = require('proxyquire'),
    Promise = require('bluebird'),
    meHandlerMock = {
        models: {
            user: {
                success: true,
                error: false,
                findById: function (id) {
                    var self = this;
                    return {
                        exec: function () {
                            return new Promise(function (resolve, reject) {
                                if (self.error) {
                                    return reject({
                                        error: 'FAIL'
                                    });
                                }
                                return resolve(self.success ? {} : null);
                            });
                        }
                    };
                }
            },
            authentication: {
                success: true,
                error: false,
                findOne: function (selector) {
                    var self = this;
                    return {
                        exec: function () {
                            return new Promise(function (resolve, reject) {
                                if (self.error) {
                                    return reject({
                                        error: 'FAIL'
                                    });
                                }
                                return resolve(self.success ? {} : null);
                            });
                        }
                    };
                }
            }
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
            return [this.models.authentication, this.models.user];
        },
        load: function () {
            var self = this;
            return new Promise(function (resolve) {
                return resolve([self.models, self.endpoints]);
            });
        }
    },
    jwtMock = {
        error: null,
        verify: function (token, secret, cb) {
            if (this.error) {
                return cb(this.error);
            }
            cb(null, '1234');
        }
    },
    authenticationMiddleware = proxyquire('../../middleware/authentication', {
        '../util/modelEndpointHandler': meHandlerMock,
        'jsonwebtoken': jwtMock
    });

describe('Authentication middleware', function () {
    'use strict';

    it('200 - no header', function (done) {
        return authenticationMiddleware({}, {}, function (err) {
            if (err) {
                return done(err);
            }
            done();
        });
    });
    it('200 - no auth header', function (done) {
        return authenticationMiddleware({
            headers: {}
        }, {}, function (err) {
            if (err) {
                return done(err);
            }
            done();
        });
    });
    it('200 - no correct auth header', function (done) {
        return authenticationMiddleware({
            headers: {
                'authorization': 'test'
            }
        }, {}, function (err) {
            if (err) {
                return done(err);
            }
            done();
        });
    });
    it('200 - bearer auth header', function (done) {
        return authenticationMiddleware({
            headers: {
                'authorization': 'Bearer xxxxxx'
            }
        }, {}, function (err) {
            if (err) {
                return done(err);
            }
            done();
        });
    });
    it('200 - not bearer auth header', function (done) {
        return authenticationMiddleware({
            headers: {
                'authorization': 'lenz xxxxxx'
            },
            customData: {}
        }, {}, function (err) {
            if (err) {
                return done(err);
            }
            return done();
        });
    });
    it('404 - no auth', function (done) {
        meHandlerMock.models.authentication.success = false;
        return authenticationMiddleware({
            headers: {
                'authorization': 'lenz xxxxxx'
            }
        }, {}, function (err) {
            meHandlerMock.models.authentication.success = true;
            if (!err) {
                return done(new Error('failed'));
            }

            expect(err).to.be.an('object');
            expect(err.status).to.be(404);
            expect(err.name).to.be('authentication_not_found');
            return done();
        });
    });
    it('404 - no user', function (done) {
        meHandlerMock.models.user.success = false;
        return authenticationMiddleware({
            headers: {
                'authorization': 'lenz xxxxxx'
            }
        }, {}, function (err) {
            meHandlerMock.models.user.success = true;
            if (!err) {
                return done(new Error('failed'));
            }
            expect(err).to.be.an('object');
            expect(err.status).to.be(404);
            expect(err.name).to.be('user_for_authentication_not_found');
            return done();
        });
    });
    it('401 - token expired', function (done) {
        jwtMock.error = {
            name: 'TokenExpiredError'
        };
        return authenticationMiddleware({
            headers: {
                'authorization': 'lenz xxxxxx'
            }
        }, {}, function (err) {
            jwtMock.error = null;
            if (!err) {
                return done(new Error('failed'));
            }
            expect(err).to.be.an('object');
            expect(err.status).to.be(401);
            return done();
        });
    });
    it('403 - unexpected error', function (done) {
        jwtMock.error = true;
        return authenticationMiddleware({
            headers: {
                'authorization': 'lenz xxxxxx'
            }
        }, {}, function (err) {
            jwtMock.error = null;
            jwtMock.throwError = false;
            if (!err) {
                return done(new Error('failed'));
            }
            expect(err).to.be.an('object');
            expect(err.status).to.be(403);
            expect(err.name).to.be('invalid_authorization');
            return done();
        });
    });
});
