/*global define, setTimeout*/
/*jslint node:true, vars:true,nomen:true*/
define([
    'node-promise',
    'mongoose',
    'appConfig',
    'databaseConfig',
    'fs',
    'mkdirp',
    'util/modelEndpointHandler'
], function (promise, mongoose, appConfig, databaseConfig, fs, mkdirp, meHandler) {
    'use strict';
    var Promise = promise.Promise,
        connection;

    function save(doc) {
        var q = new Promise();

        doc.save(function (err, saved) {
            if (err) {
                return q.reject(err);
            }

            q.resolve(saved);
        });

        return q;
    }

    return function () {
        var reinstallTask = new Promise(),
            tasks = [];

        // DB connection
        var adminConnection = mongoose.createConnection(databaseConfig.host, databaseConfig.dbname, databaseConfig.port);

        adminConnection.on('error', function (err) {
            reinstallTask.reject(err);
        });

        adminConnection.on('open', function () {
            adminConnection.db.dropDatabase(function (err) {
                adminConnection.close();
                if (err) {
                    return reinstallTask.reject(err);
                }

                connection = mongoose.createConnection(databaseConfig.host, databaseConfig.dbname, databaseConfig.port);

                connection.on('error', function (connectionErr) {
                    connection.close();
                    reinstallTask.reject(connectionErr);
                });

                connection.on('open', function () {
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

                            tasks.push(save(user));
                            tasks.push(save(user1));
                            tasks.push(save(user2));

                            setTimeout(function () {
                              connection.close();
                              reinstallTask.resolve();
                            }, 2000);
                        });
                    });
                });
            });
        });

        return reinstallTask;
    };
});
