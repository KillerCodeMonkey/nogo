let url,
    app,
    user,
    admin,
    connection;

const meHandler = require('./modelEndpointHandler'),
    request = require('supertest'),
    dbConfig = require('../config/database'),
    Promise = require('bluebird'),
    helper = require('./helper'),
    mongoose = require('mongoose');

function login(email, password, isAdmin, loginUser) {
    //ios: fef00cfc00e238a39db2f5be83bfdceb70d2e936ca2702fe6665bd4f20f51b5b android: APA91bE0JJYTocR7z6vSfi0ttczqDTkQk-7AS8ypttQaHC0SIzEufT-el8MKUEr6oSxpBED2ltC-krxN2lrfJJI1MiQAg1_hEYvPbTv7X5Mqsf47MM0kZmOveK72joea_9Ab_yHki1P3xib5lLzihV-U1EvrrBitOg
    return new Promise(function (resolve, reject) {
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
                    return reject(err);
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
                resolve();
            });
    });
}

module.exports = {
    // create client, set it active
    init: function (appServ, className) {
        return new Promise(function (resolve, reject) {
            helper.sendPassword = function (password, object) {
                return new Promise(function (resolve2) {
                    if (object) {
                        object.password = password;
                    } else {
                        object = {
                            password: password
                        };
                    }
                    resolve2(object);
                });
            };

            // DB connection
            const adminconnection = mongoose.createConnection(dbConfig.host, dbConfig.dbname, dbConfig.port);
            adminconnection.on('open', function () {
                adminconnection.db.dropDatabase(function () {
                    adminconnection.close();
                    connection = mongoose.createConnection(dbConfig.host, dbConfig.dbname, dbConfig.port);

                    url = '/api/v1/' + className;

                    app = appServ;

                    meHandler.load().then(function () {
                        meHandler.init(connection, function (initModels) {
                            if (!initModels) {
                                return reject();
                            }
                            const newAdmin = new initModels.User({
                                email: 'admin@test.test',
                                permissions: ['user', 'admin'],
                                password: '123456abc'
                            });

                            newAdmin.save(function (err, saved) {
                                if (err) {
                                    return reject(err);
                                }

                                login(saved.email, '123456abc', true).then(function () {
                                    resolve();
                                }, reject);
                            });
                        });
                    }, reject);
                });
            });
        });
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
        return new Promise(function (resolve) {
            meHandler.init(connection, function (models) {
                resolve(models);
            });
        });
    },
    finish: function () {
        return new Promise(function (resolve) {
            if (user) {
                return meHandler.init(connection, function (models) {
                    models.User.remove({
                        _id: user._id
                    }, function () {
                        models.Authentication.remove({
                            user: user._id
                        }, function () {
                            resolve();
                        });
                    });
                });
            }
            resolve();
        });
    },
    register: function (email, firstName, lastName, password) {
        return new Promise(function (resolve, reject) {
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
                        return reject(err);
                    }
                    user = res.body;
                    resolve(res.body);
                });
        });
    },
    login: login
};
