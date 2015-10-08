define([
    'bluebird',
    'fs'
], function (Promise, fs) {
    'use strict';

    var endpoints = {},
        loaded = false,
        models = {};

    // require model and enpoint
    function requireFile(file) {
        var nameWithoutExtension = file.substr(0, file.lastIndexOf('.'));

        return new Promise(function (resolve) {
            require(['models/' + nameWithoutExtension], function (model) {
                models[nameWithoutExtension] = model;
                fs.exists('endpoints/' + file, function (exists) {
                    if (exists) {
                        // log.info('#LOAD endpoint: ' + nameWithoutExtension);
                        require(['endpoints/' + nameWithoutExtension], function (endpoint) {
                            endpoints[nameWithoutExtension] = endpoint;
                            resolve();
                        });
                    } else {
                        resolve();
                    }
                });
            });
        });
    }

    function clearModel(model) {
        return new Promise(function (resolve, reject) {
            model.collection.dropAllIndexes(function () {
                model
                    .remove()
                    .then(resolve, reject);
            });
        });
    }

    function clearModels(modelsToClear) {
        var tasks = [],
            key,
            model;

        for (key in modelsToClear) {
            if (models.hasOwnProperty(key)) {
                model = models[key];
                tasks.push(clearModel(model));
            }
        }

        return tasks;
    }

    function load() {
        var tasks = [];

        return new Promise(function (resolve, reject) {
            if (!loaded) {
                fs.readdir('models', function (err, files) {
                    var i = 0;
                    if (err) {
                        console.error('error during reading models');
                        return reject();
                    }
                    for (i; i < files.length; i = i + 1) {
                        tasks.push(requireFile(files[i], endpoints, models));
                    }
                    Promise.all(tasks).then(function () {
                        loaded = true;
                        return resolve([models, endpoints]);
                    }, reject);
                });
            } else {
                resolve([models, endpoints]);
            }
        });
    }

    // load all models (in src/models) and the associated endpoint
    return {
        load: load,

        initDb: function (req, res, requiredModels, callback) {
            load().then(function () {
                var i = 0,
                    db = req.db,
                    initModels = [];

                if (db && requiredModels) {
                    for (i; i <= requiredModels.length; i = i + 1) {
                        if (models[requiredModels[i]] && models[requiredModels[i]].schema) {
                            if (db.modelNames().indexOf(models[requiredModels[i]].model.modelName) !== -1) {
                                initModels.push(db.models[models[requiredModels[i]].model.modelName]);
                            } else {
                                initModels.push(db.model(models[requiredModels[i]].model.modelName, models[requiredModels[i]].schema));
                            }
                        }
                    }
                }
                initModels.unshift(res);
                initModels.unshift(req);
                try {
                    callback.apply(undefined, initModels);
                } catch (e) {
                    console.log(e);
                }
            }, function () {
                return res.status(500).send({
                    error: 'model_endpoint_loading_failed'
                });
            });
        },

        // init models for db without request (static loader)
        init: function (db, callback) {

            load().then(function () {
                var i,
                    initModels = {};

                if (db) {
                    for (i in models) {
                        if (models.hasOwnProperty(i) && models[i].schema) {
                            if (db.modelNames().indexOf(models[i].model.modelName) !== -1) {
                                initModels[models[i].model.modelName] = db.models[models[i].model.modelName];
                            } else {
                                initModels[models[i].model.modelName] = db.model(models[i].model.modelName, models[i].schema);
                            }
                        }
                    }
                }

                callback(initModels);
            }, function () {
                callback();
            });
        },

        clearModels: function (modelsToClear) {
            return Promise.all(clearModels(modelsToClear));
        }
    };
});
