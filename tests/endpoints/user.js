/*globals before, after, it, describe, process, require */
var request = require('supertest'),
    expect = require('expect.js'),
    require = require('../../config/require'),
    testHandler = require('util/testHandler'),
    app,
    user,
    admin,
    testuser,
    restURL;

describe('user model', function () {
    'use strict';
    this.timeout(5000);
    before(function (done) {
        require(['appServer'], function (appServer) {
            appServer.then(function (server) {
                app = server;
                testHandler.init(app, 'user').then(function () {
                    restURL = testHandler.getUrl();
                    admin = testHandler.getAdmin();
                    testHandler.register('lasmaranda.densivilla@schnitten.sx', 'Lassmaranda', 'Dennsiewillja', 'kicken').then(function (newUser) {
                        testuser = newUser;
                        testHandler.login(testuser.email, testuser.password, false, testuser).then(function () {
                            done();
                        }, done);
                    }, done);
                }, done);
            }, done);
        });
    });

    after(function (done) {
        testHandler.finish().then(done, done);
    });

    describe('POST /user - register user', function () {
        it('200', function (done) {
            request(app)
                .post(restURL)
                .send({
                    'email': 'bengtler@gmail.com',
                    'password': 'test1234',
                    'language': 'en'
                })
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.email).to.be('bengtler@gmail.com');
                    expect(data.password).not.to.be(undefined);
                    expect(data.password).to.be.a('string');
                    user = data;
                    done();
                });
        });
        it('200 - second user in production mode', function (done) {
            process.env.NODE_ENV = 'production';
            request(app)
                .post(restURL)
                .send({
                    'email': 'bengtler2@gmail.com',
                    'password': 'test1234',
                    'language': 'en'
                })
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.email).to.be('bengtler2@gmail.com');
                    expect(data.password).to.be(undefined);
                    delete process.env.NODE_ENV;
                    done();
                });
        });
        it('200 - login new user', function (done) {
            request(app)
                .post('/api/v1/authentication/login')
                .send({
                    'login': user.email,
                    'password': user.password,
                    'token': '12346',
                    'platform': 'android',
                    'language': 'de'
                })
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.accessToken).not.to.be(undefined);
                    user.accessToken = data.accessToken;
                    done();
                });
        });
        it('400 - empty login', function (done) {
            request(app)
                .post(restURL)
                .send({
                    'email': ''
                })
                .expect(400)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.error).not.to.be(null);
                    expect(data.error).to.be.a('string');
                    expect(data.error).to.be('invalid_structure');
                    expect(data.param).to.be('email');

                    done();
                });
        });
        it('400 - without email', function (done) {
            request(app)
                .post(restURL)
                .expect(400)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.error).not.to.be(null);
                    expect(data.error).to.be.a('string');
                    expect(data.error).to.be('missing_parameter');
                    expect(data.param).to.be('email');
                    done();
                });
        });
    });
    describe('GET /user/account - get logged in user', function () {
        it('200 - new user', function (done) {
            request(app)
                .get(restURL + '/account')
                .set('Authorization', 'Bearer ' + user.accessToken)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data._id).to.be(user._id);
                    expect(data.email).to.be(user.email);
                    done();
                });
        });
        it('403 - without login', function (done) {
            request(app)
                .get(restURL + '/account')
                .expect(403, done);
        });
    });
    describe('GET /user/id/[userid] - get user by id', function () {
        it('200 - new user', function (done) {
            request(app)
                .get(restURL + '/id/' + testuser._id)
                .set('Authorization', 'Bearer ' + user.accessToken)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data._id).to.be(testuser._id);
                    expect(data.email).to.be(testuser.email);
                    expect(data.username).to.be(testuser.username);
                    done();
                });
        });
        it('200 - without login', function (done) {
            request(app)
                .get(restURL + '/id/' + user._id)
                .expect(200, done);
        });
    });
    describe('GET /user?filter=username&value=senf - get users', function () {
        it('200', function (done) {
            request(app)
                .get(restURL + '?filter=username&value=senf')
                .set('Authorization', 'Bearer ' + user.accessToken)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.entries.length).to.be(0);
                    done();
                });
        });
        it('200 - without myself and admin users', function (done) {
            request(app)
                .get(restURL)
                .set('Authorization', 'Bearer ' + user.accessToken)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.entries.length).to.be(2);
                    done();
                });
        });
        it('200 - without login', function (done) {
            request(app)
                .get(restURL)
                .expect(200, done);
        });
    });
    describe('GET /user/check - check if user exists', function () {
        it('200 - by known email', function (done) {
            request(app)
                .get(restURL + '/check?email=' + user.email)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.exists).to.be(true);
                    done();
                });
        });
        it('200 - by unkown email', function (done) {
            request(app)
                .get(restURL + '/check?email=schnitte@test.com')
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.exists).to.be(false);
                    done();
                });
        });
        it('200 - by unkown username', function (done) {
            request(app)
                .get(restURL + '/check?username=schnitte')
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.exists).to.be(false);
                    done();
                });
        });
    });
    describe('PUT /user/sendPassword - send new password', function () {
        it('200 - in production', function (done) {
            process.env.NODE_ENV = 'production';
            request(app)
                .put(restURL + '/sendPassword')
                .send({
                    email: user.email
                })
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.password).to.be(undefined);
                    delete process.env.NODE_ENV;
                    done();
                });
        });
        it('200', function (done) {
            request(app)
                .put(restURL + '/sendPassword')
                .send({
                    email: user.email
                })
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.password).not.to.be(null);
                    expect(data.password.length).to.be(8);
                    user.password = data.password;
                    testHandler.login(user.email, user.password, false, user).then(function () {
                        done();
                    }, function (err) {
                        done(err);
                    });
                });
        });
        it('400 - by invalid email', function (done) {
            request(app)
                .put(restURL + '/sendPassword')
                .send({
                    email: 'test'
                })
                .expect(400)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.error).not.to.be(null);
                    expect(data.error).to.be.a('string');
                    expect(data.error).to.be('invalid_structure');
                    expect(data.param).to.be('email');

                    done();
                });
        });
        it('400 - without email', function (done) {
            request(app)
                .put(restURL + '/sendPassword')
                .send()
                .expect(400)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.error).not.to.be(null);
                    expect(data.error).to.be.a('string');
                    expect(data.error).to.be('missing_parameter');
                    expect(data.param).to.be('email');

                    done();
                });
        });
        it('400 - with number as email', function (done) {
            request(app)
                .put(restURL + '/sendPassword')
                .send({
                    email: 1
                })
                .expect(400)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.error).not.to.be(null);
                    expect(data.error).to.be.a('string');
                    expect(data.error).to.be('wrong_type');
                    expect(data.param).to.be('email');

                    done();
                });
        });
        it('404 - not existing user', function (done) {
            request(app)
                .put(restURL + '/sendPassword')
                .send({
                    email: 'test@test.haha'
                })
                .expect(404, done);
        });
        it('400 - already loggedin', function (done) {
            request(app)
                .put(restURL + '/sendPassword')
                .set('Authorization', 'Bearer ' + user.accessToken)
                .send({
                    email: user.email
                })
                .expect(400)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.error).not.to.be(null);
                    expect(data.error).to.be.a('string');
                    expect(data.error).to.be('user_already_loggedin');

                    done();
                });
        });
    });
    describe('PUT /user/account - update user', function () {
        var object = {
            email: 'nankazu@testsenfler.com',
            newPassword: '123456ab',
            firstName: 'Senfmann',
            lastName: 'Schmidt',
            username: 'schnitterich'
        };
        it('200', function (done) {
            object.password = user.password;
            request(app)
                .put(restURL + '/account')
                .set('Authorization', 'Bearer ' + user.accessToken)
                .send(object)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.email).to.be(object.email);
                    expect(data.firstName).to.be(object.firstName);
                    expect(data.lastName).to.be(object.lastName);
                    expect(data.username).to.be(object.username);
                    expect(data.normalizedUsername).to.be(object.username.toLowerCase());
                    user.email = object.email;
                    user.password = object.newPassword;
                    testHandler.login(object.email, object.newPassword, false, user).then(function () {
                        done();
                    }, function (err) {
                        done(err);
                    });
                });
        });
        it('400 - by invalid email', function (done) {
            request(app)
                .put(restURL + '/account')
                .set('Authorization', 'Bearer ' + user.accessToken)
                .send({
                    email: 'test'
                })
                .expect(400)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.error).not.to.be(null);
                    expect(data.error).to.be.a('string');
                    expect(data.error).to.be('invalid_structure');
                    expect(data.param).to.be('email');

                    done();
                });
        });
        it('400 - by invalid new password', function (done) {
            request(app)
                .put(restURL + '/account')
                .set('Authorization', 'Bearer ' + user.accessToken)
                .send({
                    newPassword: 'test'
                })
                .expect(400)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.error).not.to.be(null);
                    expect(data.error).to.be.a('string');
                    expect(data.error).to.be('invalid_structure');
                    expect(data.param).to.be('newPassword');

                    done();
                });
        });
        it('400 - by invalid username', function (done) {
            request(app)
                .put(restURL + '/account')
                .set('Authorization', 'Bearer ' + user.accessToken)
                .send({
                    username: 'baz'
                })
                .expect(400)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.error).not.to.be(null);
                    expect(data.error).to.be.a('string');
                    expect(data.error).to.be('invalid_structure');
                    expect(data.param).to.be('username');

                    done();
                });
        });
        it('400 - by invalid username (max)', function (done) {
            request(app)
                .put(restURL + '/account')
                .set('Authorization', 'Bearer ' + user.accessToken)
                .send({
                    username: 'testasdfasdfasdfasdfasdfasdasdfasdf'
                })
                .expect(400)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.error).not.to.be(null);
                    expect(data.error).to.be.a('string');
                    expect(data.error).to.be('invalid_structure');
                    expect(data.param).to.be('username');

                    done();
                });
        });
        it('400 - change email without password', function (done) {
            request(app)
                .put(restURL + '/account')
                .set('Authorization', 'Bearer ' + user.accessToken)
                .send({
                    email: 'hihihihih@hihi.com'
                })
                .expect(400)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.error).not.to.be(null);
                    expect(data.error).to.be.a('string');
                    expect(data.error).to.be('missing_parameter');
                    expect(data.param).to.be('password');

                    done();
                });
        });
        it('400 - set new password without password', function (done) {
            request(app)
                .put(restURL + '/account')
                .set('Authorization', 'Bearer ' + user.accessToken)
                .send({
                    newPassword: 'test123'
                })
                .expect(400)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.error).not.to.be(null);
                    expect(data.error).to.be.a('string');
                    expect(data.error).to.be('missing_parameter');
                    expect(data.param).to.be('password');

                    done();
                });
        });
        it('400 - with number as email', function (done) {
            request(app)
                .put(restURL + '/account')
                .set('Authorization', 'Bearer ' + user.accessToken)
                .send({
                    email: 1
                })
                .expect(400)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.error).not.to.be(null);
                    expect(data.error).to.be.a('string');
                    expect(data.error).to.be('wrong_type');
                    expect(data.param).to.be('email');

                    done();
                });
        });
        it('400 - with existing email', function (done) {
            request(app)
                .put(restURL + '/account')
                .set('Authorization', 'Bearer ' + user.accessToken)
                .send({
                    email: 'bengtler2@gmail.com',
                    password: object.newPassword
                })
                .expect(400)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var data = res.body;
                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.error).not.to.be(null);
                    expect(data.error).to.be.a('string');
                    expect(data.error).to.be('email_exists');
                    done();
                });
        });
        it('403 - winthout login', function (done) {
            request(app)
                .put(restURL + '/account')
                .send({
                    email: user.email
                })
                .expect(403, done);
        });
    });
    describe('DELETE /user/id/[id] - delete user', function () {
        it('403 - without login', function (done) {
            request(app)
                .del(restURL + '/id/' + testuser._id)
                .expect(403, done);
        });
        it('200', function (done) {
            request(app)
                .del(restURL + '/id/' + testuser._id)
                .set('Authorization', 'Bearer ' + admin.accessToken)
                .expect(200, done);
        });
        it('404', function (done) {
            request(app)
                .get(restURL + '/id/' + testuser._id)
                .set('Authorization', 'Bearer ' + user.accessToken)
                .expect(404, done);
        });
    });
});
