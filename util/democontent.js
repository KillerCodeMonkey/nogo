var connection,
    Promise = require('bluebird'),
    mongoose = require('mongoose'),
    databaseConfig = require('config/database'),
    meHandler = require('meHandler'),
    demoContent = function () {
        var tasks = [];

        // DB connection
        var adminConnection = mongoose.createConnection(databaseConfig.host, databaseConfig.dbname, databaseConfig.port);
        return new Promise(function (resolve, reject) {
            adminConnection.on('error', function (err) {
                reject(err);
            });

            adminConnection.on('open', function () {
                adminConnection.db.dropDatabase(function (err) {
                    adminConnection.close();
                    if (err) {
                        return reject(err);
                    }

                    connection = mongoose.createConnection(databaseConfig.host, databaseConfig.dbname, databaseConfig.port);

                    connection.on('error', function (connectionErr) {
                        connection.close();
                        reject(connectionErr);
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

                                tasks.push(user.save());
                                tasks.push(user1.save());
                                tasks.push(user2.save());

                                setTimeout(function () {
                                    connection.close();
                                    resolve();
                                }, 2000);
                            });
                        });
                    });
                });
            });
        });
    };
module.exports = demoContent();
