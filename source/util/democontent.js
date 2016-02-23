var connection,
    Promise = require('bluebird'),
    mongoose = require('mongoose'),
    databaseConfig = require('../config/database'),
    meHandler = require('./modelEndpointHandler'),
    demoContent = function () {
        'use strict';
        var tasks = [];

        // DB connection
        return new Promise(function (resolve, reject) {
            connection = mongoose.createConnection(databaseConfig.host, databaseConfig.dbname, databaseConfig.port);
            connection.on('open', function () {
                connection.db.dropDatabase(function (err) {
                    connection.close();
                    if (err) {
                        return reject(err);
                    }

                    connection.on('error', function (connectionErr) {
                        connection.close();
                        reject(connectionErr);
                    });


                    meHandler.load().then(function () {
                        meHandler.init(connection, function (models) {
                            var user = new models.User({
                                    lastName: 'Senfmann',
                                    firstName: 'Horst',
                                    username: 'meisterLampe',
                                    email: 'test@test.test',
                                    password: '123456'
                                }),
                                user1 = new models.User({
                                    lastName: 'Schnitzel',
                                    firstName: 'Heinz',
                                    username: 'meisterPetz',
                                    email: 'test2@test.test',
                                    password: '123456'
                                }),
                                user2 = new models.User({
                                    lastName: 'Pommes',
                                    firstName: 'Bude',
                                    username: 'meisterKlecks',
                                    email: 'test3@test.test',
                                    password: '123456'
                                });

                            tasks.push(user.save());
                            tasks.push(user1.save());
                            tasks.push(user2.save());

                            Promise.all(tasks).then(function () {
                                resolve();
                            }, function () {
                                reject();
                            }).finally(function () {
                                connection.close();
                            });
                        });
                    });
                });
            });
        });
    };
module.exports = demoContent;
