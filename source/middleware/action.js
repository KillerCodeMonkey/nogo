const modelEndpointHandler = require('../util/modelEndpointHandler'),
    RequestError = require('../util/error').RequestError,
    middleware = function (req, res, next) {
        let version = req.params.version,
            className = req.params.classname,
            actionName = req.params.action,
            objectId = req.params.objectid,
            endpoint,
            method = req.method.toLowerCase();

        function loadObject(cb) {
            if (!objectId) {
                return cb(null);
            }
            modelEndpointHandler.load().then(function () {
                let models = modelEndpointHandler.initDb(req, [className]);
                models[0].findById(objectId, function (err, object) {
                    if (err) {
                        return cb(err);
                    }
                    if (!object) {
                        return cb('object_not_found');
                    }
                    cb(null, object);
                });
            }, cb);
        }

        function getAction(actionList, cb) {
            // if there is special action.
            if (actionName) {
                // check if action exists.
                if (!actionList[actionName]) {
                    return cb('action_not_found');
                }
                if (actionList[actionName].object && !objectId) {
                    return cb('missing_object');
                }
                if (!actionList[actionName].object && objectId) {
                    return cb('not_object_action');
                }
                return cb(null, actionList[actionName]);
            }
            // object request
            if (objectId) {
                if (!actionList.object) {
                    return cb('action_not_found');
                }
                return cb(null, actionList.object);
            }
            // class request
            if (!actionList['']) {
                return cb('action_not_found');
            }
            return cb(null, actionList['']);
        }

        // load models and endpoints
        modelEndpointHandler
            .load()
            .then(function (results) {
                let models = results[0],
                    endpoints = results[1];

                if (!version) {
                    throw new RequestError('no_version', 404);
                }
                if (!className) {
                    throw new RequestError('no_classname', 404);
                }
                if (!models[className]) {
                    throw new RequestError('unknown_model', 404, className);
                }
                if (!endpoints[className]) {
                    throw new RequestError('unknown_endpoint', 404, className);
                }
                // load model and endpoint by class
                endpoint = endpoints[className];

                if (!endpoint[version]) {
                    throw new RequestError('no_endpoints_for_version', 404, version);
                }
                if (!endpoint[version][method]) {
                    throw new RequestError('no_endpoints_for_method', 404, method);
                }

                //  load all actions
                let actionList = endpoint[version][method];

                return getAction(actionList, function (actionErr, action) {
                    if (actionErr) {
                        return next(new RequestError(actionErr, 404));
                    }
                    if (!req.customData) {
                        req.customData = {};
                    }

                    req.customData.action = action;
                    return loadObject(function (err, object) {
                        if (err) {
                            return next(new RequestError(err, 404));
                        }
                        req.customData.object = object;
                        return next();
                    });
                });
            })
            .catch(next);
    };

module.exports = middleware;
