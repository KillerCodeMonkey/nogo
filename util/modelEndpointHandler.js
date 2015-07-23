define([
    'node-promise',
    'fs'
], function (promise, fs) {
    'use strict';

    var Promise = promise.Promise,
        endpoints = {},
        loaded = false,
        models = {};

    // require model and enpoint
    function requireFile(file, endpoints, models) {
        var filePromise = new Promise(),
            nameWithoutExtension = file.substr(0, file.lastIndexOf('.'));

        // log.info('#LOAD model: ' + nameWithoutExtension);

        require(['models/' + nameWithoutExtension], function (model) {
            models[nameWithoutExtension] = model;
            fs.exists('endpoints/' + file, function (exists) {
                if (exists) {
                    // log.info('#LOAD endpoint: ' + nameWithoutExtension);
                    require(['endpoints/' + nameWithoutExtension], function (endpoint) {
                        endpoints[nameWithoutExtension] = endpoint;
                        filePromise.resolve();
                    });
                } else {
                    filePromise.resolve();
                }
            });
        });

        return filePromise;
    }

    function clearModel(model) {
        var prom = new Promise();

        model.collection.dropAllIndexes(function () {
            // log.info(model.modelName + ': try dropAllIndexes');
            model.remove(function (err) {
                if (err) {
                    prom.reject(err);
                } else {
                    // log.info(model.modelName + ': try drop');
                    prom.resolve();
                }
            });
        });

        return prom;
    }

    function clearModels(models) {
        var tasks = [],
            key,
            model;

        for (key in models) {
            if (models.hasOwnProperty(key)) {
                model = models[key];
                tasks.push(clearModel(model));
            }
        }

        return tasks;
    }

    function load() {
        var loader = new Promise(),
            tasks = [];
        if (!loaded) {
            fs.readdir('models', function (err, files) {
                var i = 0;
                if (err) {
                    console.error('error during reading models');
                    loader.reject();
                }
                for (i; i < files.length; i = i + 1) {
                    tasks.push(requireFile(files[i], endpoints, models));
                }
                promise.allOrNone(tasks).then(function () {
                    loaded = true;
                    loader.resolve([models, endpoints]);
                }, loader.reject);
            });
        } else {
            loader.resolve([models, endpoints]);
        }

        return loader;
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
                callback.apply(undefined, initModels);
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

        clearModels: function (models) {
            var newPromise = new Promise();

            promise.all(clearModels(models)).then(newPromise.resolve, newPromise.reject);

            return newPromise;
        }
    };
});
