/*global define*/
/*jslint vars:true,nomen:true*/
define([
    'node-promise',
    'appConfig',
    'databaseConfig',
    'fs',
    'mongoose',
    'util/modelEndpointHandler'
], function (promise, appConfig, databaseConfig, fs, mongoose, meHandler) {
    'use strict';

    var Promise = promise.Promise;

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
            var createtask = new Promise();

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

                                admin.save(function (err) {
                                    if (err) {
                                        return createtask.reject(err);
                                    }
                                    newConnection.close();
                                    createtask.resolve();
                                    console.info('Finish: #System user created');
                                });
                            });
                        }, function (err) {
                            newConnection.close();
                            createtask.reject(err);
                        });
                    });

                    newConnection.on('error', function (err) {
                        newConnection.close();
                        createtask.reject(err);
                    });
                });
            });

            connection.on('error', function (err) {
                connection.close();
                createtask.reject(err);
            });

            return createtask;
        };
    };

    return new System();
});
