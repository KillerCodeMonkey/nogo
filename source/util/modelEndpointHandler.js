const Promise = require('bluebird'),
    fs = require('fs-extra');

let endpoints = {},
    loaded = false,
    models = {};

// require model and enpoint
function requireFile(file) {
    let nameWithoutExtension = file.substr(0, file.lastIndexOf('.'));

    return new Promise(function (resolve) {
        let model = require('../models/' + nameWithoutExtension);
        models[nameWithoutExtension] = model;
        fs.stat(process.cwd() + '/endpoints/' + file, function (error) {
            if (error) {
                return resolve();
            }
            let endpoint = require('../endpoints/' + nameWithoutExtension);
            endpoints[nameWithoutExtension] = endpoint;
            resolve();
        });
    });
}

function load() {
    let tasks = [];

    return new Promise(function (resolve, reject) {
        if (!loaded) {
            fs.readdir('models', function (err, files) {
                let i = 0;
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
module.exports = {
    load: load,

    initDb: function (req, requiredModels) {
        let i = 0,
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

        return initModels;
    },

    // init models for db without request (static loader)
    init: function (db, callback) {

        load().then(function () {
            let i,
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
    }
};
