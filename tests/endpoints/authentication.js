/*globals before, require, after, it, describe */
var request = require('supertest'),
    expect = require('expect.js'),
    require = require('../../config/require'),
    testHandler = require('util/testHandler'),
    app,
    restURL,
    user;


describe('Authentication model', function () {
    'use strict';
    before(function (done) {
        this.timeout(8000);
        require(['appServer'], function (appServer) {
            appServer.then(function (server) {
                app = server;
                testHandler.init(app, 'authentication').then(function () {
                    restURL = testHandler.getUrl();
                    request(app)
                        .post('/api/v1/user')
                        .send({
                            'email': 'test@test.test',
                            'firstName': 'Senf',
                            'lastName': 'Mann',
                            'password': 'test1234'
                        })
                        .expect(200)
                        .end(function (err, res) {
                            if (err) {
                                return done(err);
                            }

                            var data = res.body;

                            expect(data).not.to.be(null);
                            expect(data).to.be.an('object');
                            expect(data.email).to.be('test@test.test');
                            expect(data.password).not.to.be(undefined);
                            expect(data.password).to.be.a('string');
                            user = data;
                            done();
                        });
                }, done);
            }, done);
        });
    });

    after(function (done) {
        testHandler.finish(app).then(done, done);
    });

    describe('GET /api - check if api is online', function () {
        it('200 - response code', function (done) {
            request(app)
                .get('/api')
                .expect(200, done);
        });
        it('200 - response "api_online"', function (done) {
            request(app)
                .get('/api')
                .expect(200)
                .expect('api_online', done);
        });
    });

    describe('POST /authentication/login - login', function () {
        it('200', function (done) {
            request(app)
                .post(restURL + '/login')
                .send({
                    'login': user.email,
                    'password': user.password,
                    'token': 'asdfgh',
                    'platform': 'android',
                    'uuid': '123'
                })
                .expect(200)
                .end(function (err, res) {
                    var data = res.body;
                    if (err) {
                        done(err);
                    } else {
                        expect(data).not.to.be(null);
                        expect(data).to.be.an('object');
                        expect(data.accessToken).not.to.be(null);
                        expect(data.accessToken).to.be.a('string');
                        expect(data.refreshToken).not.to.be(null);
                        expect(data.refreshToken).to.be.a('string');
                        expect(data.refreshToken).not.to.be(null);
                        expect(data.tokenType).to.be('Bearer');
                        expect(data.refreshToken).not.to.be(null);
                        expect(data.permissions).not.to.be(null);
                        expect(data.permissions).to.be.an('array');
                        expect(data.permissions).to.be.eql(['user']);
                        expect(data.user).to.be.an('object');
                        user.accessToken = data.accessToken;
                        user.refreshToken = data.refreshToken;
                        done();
                    }
                });
        });
        it('400 - wrong password', function (done) {
            request(app)
                .post(restURL + '/login')
                .send({
                    'login': user.email,
                    'password': '12345',
                    'token': '2345',
                    'platform': 'android'
                })
                .expect(400)
                .end(function (err, res) {
                    var data = res.body;
                    if (err) {
                        done(err);
                    } else {
                        expect(data).not.to.be(null);
                        expect(data).to.be.an('object');
                        expect(data.error).not.to.be(null);
                        expect(data.error).to.be.a('string');
                        expect(data.error).to.be('invalid_login_password_combination');
                        done();
                    }
                });
        });
        it('400 - invalid user', function (done) {
            request(app)
                .post(restURL + '/login')
                .send({
                    'login': 'test@foo.bar',
                    'password': 'asdf',
                    'token': 'asdf',
                    'platform': 'qwer'
                })
                .expect(400)
                .end(function (err, res) {
                    var data = res.body;
                    if (err) {
                        done(err);
                    } else {
                        expect(data).not.to.be(null);
                        expect(data).to.be.an('object');
                        expect(data.error).not.to.be(null);
                        expect(data.error).to.be.a('string');
                        expect(data.error).to.be('user_not_exists');
                        done();
                    }
                });
        });
        it('400 - missing user', function (done) {
            request(app)
                .post(restURL + '/login')
                .send({
                    'password': user.password
                })
                .expect(400)
                .end(function (err, res) {
                    var data = res.body;
                    if (err) {
                        done(err);
                    } else {
                        expect(data).not.to.be(null);
                        expect(data).to.be.an('object');
                        expect(data.error).not.to.be(null);
                        expect(data.error).to.be.a('string');
                        expect(data.error).to.be('missing_parameter');
                        expect(data.param).to.be('login');
                        done();
                    }
                });
        });
        it('400 - missing password', function (done) {
            request(app)
                .post(restURL + '/login')
                .send({
                    'login': user.email
                })
                .expect(400)
                .end(function (err, res) {
                    var data = res.body;
                    if (err) {
                        done(err);
                    } else {
                        expect(data).not.to.be(null);
                        expect(data).to.be.an('object');
                        expect(data.error).not.to.be(null);
                        expect(data.error).to.be.a('string');
                        expect(data.error).to.be('missing_parameter');
                        expect(data.param).to.be('password');
                        done();
                    }
                });
        });
        it('400 - missing user && password', function (done) {
            request(app)
                .post(restURL + '/login')
                .expect(400)
                .end(function (err, res) {
                    var data = res.body;
                    if (err) {
                        done(err);
                    } else {
                        expect(data).not.to.be(null);
                        expect(data).to.be.an('object');
                        expect(data.error).not.to.be(null);
                        expect(data.error).to.be.a('string');
                        expect(data.error).to.be('missing_parameter');
                        expect(data.param).to.be('login');
                        done();
                    }
                });
        });
        it('400 - missing_parameter_platform', function (done) {
            request(app)
                .post(restURL + '/login')
                .send({
                    'login': user.email,
                    'password': 'test1234',
                    'token': '1345'
                })
                .expect(400)
                .end(function (err, res) {
                    var data = res.body;
                    if (err) {
                        done(err);
                    } else {
                        expect(data).not.to.be(null);
                        expect(data).to.be.an('object');
                        expect(data.error).not.to.be(null);
                        expect(data.error).to.be.a('string');
                        expect(data.error).to.be('missing_parameter');
                        expect(data.param).to.be('platform');
                        done();
                    }
                });
        });
        it('400 - already logged in', function (done) {
            request(app)
                .post(restURL + '/login')
                .send({
                    'login': user.email,
                    'password': user.password,
                    'token': 'asdfgh',
                    'platform': 'android',
                    'uuid': '123'
                })
                .set('Authorization', 'Bearer ' + user.accessToken)
                .expect(400)
                .end(function (err, res) {
                    var data = res.body;
                    if (err) {
                        done(err);
                    } else {
                        expect(data).not.to.be(null);
                        expect(data).to.be.an('object');
                        expect(data.error).not.to.be(null);
                        expect(data.error).to.be('already_logged_in');
                        done();
                    }
                });
        });
    });
    describe('PUT /authentication/token - set token', function () {
        it('403 - without invalid store header', function (done) {
            request(app)
                .put(restURL + '/token')
                .send({
                    platform: 'android',
                    uuid: '123',
                    token: 'test'
                })
                .expect(403, done);
        });
        it('400 - missing_parameter_token', function (done) {
            request(app)
                .put(restURL + '/token')
                .set('Authorization', 'Bearer ' + user.accessToken)
                .expect(400)
                .end(function (err, res) {
                    var data = res.body;
                    if (err) {
                        return done(err);
                    }
                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.error).not.to.be(null);
                    expect(data.error).to.be.an('string');
                    expect(data.error).to.be('missing_parameter');
                    expect(data.param).to.be('token');
                    done();
                });
        });
        it('400 - missing_parameter_platform', function (done) {
            request(app)
                .put(restURL + '/token')
                .set('Authorization', 'Bearer ' + user.accessToken)
                .send({
                    token: 'test'
                })
                .expect(400)
                .end(function (err, res) {
                    var data = res.body;
                    if (err) {
                        return done(err);
                    }
                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.error).not.to.be(null);
                    expect(data.error).to.be.an('string');
                    expect(data.error).to.be('missing_parameter');
                    expect(data.param).to.be('platform');
                    done();
                });
        });
        it('400 - missing_parameter_uuid', function (done) {
            request(app)
                .put(restURL + '/token')
                .set('Authorization', 'Bearer ' + user.accessToken)
                .send({
                    token: 'test',
                    platform: 'android'
                })
                .expect(400)
                .end(function (err, res) {
                    var data = res.body;
                    if (err) {
                        return done(err);
                    }
                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.error).not.to.be(null);
                    expect(data.error).to.be.an('string');
                    expect(data.error).to.be('missing_parameter');
                    expect(data.param).to.be('uuid');
                    done();
                });
        });
        it('200 - set new token', function (done) {
            request(app)
                .put(restURL + '/token')
                .set('Authorization', 'Bearer ' + user.accessToken)
                .send({
                    platform: 'android',
                    uuid: '123',
                    token: 'test'
                })
                .expect(200, done);
        });
    });
    describe('POST /authentication/refresh - refresh access/refreshtoken', function () {
        it('200 - refresh tokens', function (done) {
            request(app)
                .post(restURL + '/refresh')
                .send({
                    'accessToken': user.accessToken,
                    'refreshToken': user.refreshToken
                })
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        done(err);
                    }
                    var data = res.body;
                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.accessToken).not.to.be(null);
                    expect(data.accessToken).to.be.a('string');
                    expect(data.refreshToken).not.to.be(null);
                    expect(data.refreshToken).to.be.a('string');
                    user.accessToken = data.accessToken;
                    user.refreshToken = data.refreshToken;
                    done();
                });
        });
        it('200 - refresh with new tokens', function (done) {
            request(app)
                .post(restURL + '/refresh')
                .send({
                    'accessToken': user.accessToken,
                    'refreshToken': user.refreshToken
                })
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        done(err);
                    }
                    var data = res.body;
                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.accessToken).not.to.be(null);
                    expect(data.accessToken).to.be.a('string');
                    expect(data.refreshToken).not.to.be(null);
                    expect(data.refreshToken).to.be.a('string');
                    user.accessToken = data.accessToken;
                    user.refreshToken = data.refreshToken;
                    done();
                });
        });
        it('403 - wrong accessToken', function (done) {
            request(app)
                .post(restURL + '/refresh')
                .send({
                    'accessToken': '1234',
                    'refreshToken': user.refreshToken
                })
                .expect(403, done);
        });
        it('400 - wrong refreshToken', function (done) {
            request(app)
                .post(restURL + '/refresh')
                .send({
                    'accessToken': user.accessToken,
                    'refreshToken': '1234'
                })
                .expect(400)
                .end(function (err, res) {
                    var data = res.body;
                    if (err) {
                        return done(err);
                    }
                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.error).not.to.be(null);
                    expect(data.error).to.be.an('string');
                    expect(data.error).to.be('invalid_refresh_token');
                    done();
                });
        });
        it('400 - missing accessToken', function (done) {
            request(app)
                .post(restURL + '/refresh')
                .send({
                    'refreshToken': user.refreshToken
                })
                .expect(400)
                .end(function (err, res) {
                    var data = res.body;
                    if (err) {
                        return done(err);
                    }
                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.error).not.to.be(null);
                    expect(data.error).to.be.an('string');
                    expect(data.error).to.be('missing_parameter');
                    expect(data.param).to.be('accessToken');
                    done();
                });
        });
        it('400 - missing refreshToken', function (done) {
            request(app)
                .post(restURL + '/refresh')
                .send({
                    'accessToken': user.accessToken
                })
                .expect(400)
                .end(function (err, res) {
                    var data = res.body;
                    if (err) {
                        return done(err);
                    }
                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.error).not.to.be(null);
                    expect(data.error).to.be.an('string');
                    expect(data.error).to.be('missing_parameter');
                    expect(data.param).to.be('refreshToken');
                    done();
                });
        });
        it('400 - missing access && refreshToken', function (done) {
            request(app)
                .post(restURL + '/refresh')
                .expect(400)
                .end(function (err, res) {
                    var data = res.body;
                    if (err) {
                        return done(err);
                    }
                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.error).not.to.be(null);
                    expect(data.error).to.be.an('string');
                    expect(data.error).to.be('missing_parameter');
                    expect(data.param).to.be('accessToken');
                    done();
                });
        });
    });
    describe('GET /authentication/logout - logout', function () {
        it('403 - without authorization header', function (done) {
            request(app)
                .get(restURL + '/logout')
                .expect(403, done);
        });
        it('200 - correct logout', function (done) {
            request(app)
                .get(restURL + '/logout')
                .set('Authorization', 'Bearer ' + user.accessToken)
                .expect(200, done);
        });
    });
});
