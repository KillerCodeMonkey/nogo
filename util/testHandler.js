/* global define, require */
define([
    'supertest',
    'databaseConfig',
    'node-promise',
    'util/helper',
    'mongoose'
], function (request, dbConfig, promise, helper, mongoose) {
    'use strict';

    var url,
        app,
        user,
        admin,
        connection,
        Promise = promise.Promise,
        meHandler = require('util/modelEndpointHandler');

    function login(email, password, isAdmin, loginUser) {
        var q = new Promise();
        //ios: fef00cfc00e238a39db2f5be83bfdceb70d2e936ca2702fe6665bd4f20f51b5b android: APA91bE0JJYTocR7z6vSfi0ttczqDTkQk-7AS8ypttQaHC0SIzEufT-el8MKUEr6oSxpBED2ltC-krxN2lrfJJI1MiQAg1_hEYvPbTv7X5Mqsf47MM0kZmOveK72joea_9Ab_yHki1P3xib5lLzihV-U1EvrrBitOg
        request(app)
            .post('/api/v1/authentication/login')
            .send({
                login: email,
                password: password,
                token: 'fef00cfc00e238a39db2f5be83bfdceb70d2e936ca2702fe6665bd4f20f51b5b',
                platform: 'ios',
                uuid: email
            })
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return q.reject(err);
                }
                if (isAdmin) {
                    admin = res.body;
                } else {
                    if (!user && !isAdmin) {
                        user = res.body;
                    } else {
                        if (loginUser) {
                            loginUser.accessToken = res.body.accessToken;
                        } else {
                            user.accessToken = res.body.accessToken;
                        }
                    }
                }
                q.resolve();
            });

        return q;
    }

    return {

        // create client, set it active
        init: function (appServ, className) {
            var q = new Promise();

            helper.sendPassword = function (password, object) {
                var q2 = new Promise();
                if (object) {
                    object.password = password;
                } else {
                    object = {
                        password: password
                    };
                }
                q2.resolve(object);
                return q2;
            };

            // DB connection
            var adminconnection = mongoose.createConnection(dbConfig.host, dbConfig.dbname, dbConfig.port);
            adminconnection.on('open', function () {
                adminconnection.db.dropDatabase(function () {
                    adminconnection.close();
                    connection = mongoose.createConnection(dbConfig.host, dbConfig.dbname, dbConfig.port);

                    url = '/api/v1/' + className;

                    app = appServ;

                    meHandler.load().then(function () {
                        meHandler.init(connection, function (initModels) {
                            if (!initModels) {
                                return q.reject();
                            }
                            var newAdmin = new initModels.User({
                                email: 'admin@test.test',
                                permissions: ['user', 'admin'],
                                password: '123456abc'
                            });

                            newAdmin.save(function (err, saved) {
                                if (err) {
                                    return q.reject(err);
                                }

                                login(saved.email, '123456abc', true).then(function () {
                                    q.resolve();
                                }, q.reject);
                            });
                        });
                    }, q.reject);
                });
            });
            return q;
        },
        getUrl: function () {
            return url;
        },
        getUser: function () {
            return user;
        },
        getAdmin: function () {
            return admin;
        },
        getConnection: function () {
            return connection;
        },
        getModels: function () {
            var q = new Promise();
            meHandler.init(connection, function (models) {
                q.resolve(models);
            });
            return q;
        },
        finish: function () {
            var q = new Promise();

            if (user) {
                meHandler.init(connection, function (models) {
                    models.User.remove({
                        _id: user._id
                    }, function () {
                        models.Authentication.remove({
                            user: user._id
                        }, function () {
                            q.resolve();
                        });
                    });
                });
            } else {
                q.resolve();
            }

            return q;
        },
        register: function (email, firstName, lastName, password) {
            var q = new Promise();
            request(app)
                .post('/api/v1/user')
                .send({
                    'email': email,
                    'password': password,
                    'firstName': firstName,
                    'lastName': lastName
                })
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return q.reject(err);
                    }
                    user = res.body;
                    q.resolve(res.body);
                });

            return q;
        },
        login: login
    };
});
