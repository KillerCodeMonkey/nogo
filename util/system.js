/*global define*/
/*jslint vars:true,nomen:true*/
define([
    'bluebird',
    'appConfig',
    'databaseConfig',
    'fs',
    'mongoose',
    'util/modelEndpointHandler'
], function (Promise, appConfig, databaseConfig, fs, mongoose, meHandler) {
    'use strict';

    var System = function () {

        this.deleteDBFilesRecursive = function (path, fileName) {
            var self = this;
            if (!path || !fileName) {
                return;
            }

            if (fs.existsSync(path)) {
                fs.readdirSync(path).forEach(function (file) {
                    var regexp = new RegExp('^' + fileName);
                    if (regexp.test(file)) {
                        var curPath = path + "/" + file;
                        if (fs.lstatSync(curPath).isDirectory()) { // recurse
                            self.deleteDBFilesRecursive(curPath);
                        } else { // delete file
                            fs.unlinkSync(curPath);
                        }
                    }
                });
            }
        };

        this.deleteStaticFilesRecursive = function (path) {
            var self = this;
            if (!path) {
                return;
            }

            if (fs.existsSync(path)) {
                fs.readdirSync(path).forEach(function (file) {
                    var curPath = path + "/" + file;
                    if (fs.lstatSync(curPath).isDirectory()) { // recurse
                        self.deleteStaticFilesRecursive(curPath);
                    } else { // delete file
                        fs.unlinkSync(curPath);
                    }
                });
                fs.rmdirSync(path);
            }
        };

        this.createSystem = function (username, password) {
            return new Promise(function (resolve, reject) {
                // DB connection
                var connection = mongoose.createConnection(databaseConfig.host, databaseConfig.dbname, databaseConfig.port);

                connection.on('open', function () {
                    connection.db.dropDatabase(function () {
                        connection.close();
                        var newConnection = mongoose.createConnection(databaseConfig.host, databaseConfig.dbname, databaseConfig.port);
                        newConnection.on('open', function () {
                            // clear db.
                            meHandler.load().then(function () {
                                meHandler.init(newConnection, function (models) {
                                    var User = models.User,
                                        admin = new User({
                                            email: username,
                                            password: password,
                                            language: 'de',
                                            permissions: [appConfig.permissions.admin]
                                        });

                                    admin
                                        .save()
                                        .then(function () {
                                            newConnection.close();
                                            resolve();
                                            console.info('Finish: #System user created');
                                        }, reject);
                                });
                            }, function (err) {
                                newConnection.close();
                                reject(err);
                            });
                        });

                        newConnection.on('error', function (err) {
                            newConnection.close();
                            reject(err);
                        });
                    });
                });

                connection.on('error', function (err) {
                    connection.close();
                    reject(err);
                });
            });
        };
    };

    return new System();
});
