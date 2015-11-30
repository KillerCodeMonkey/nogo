var modelEndpointHandler = require('util/modelEndpointHandler'),
    RequestError = require('util/error').RequestError,
    middleware = function (req, res, next) {
        var version = req.params.version,
            className = req.params.classname,
            actionName = req.params.action,
            objectId = req.params.objectid,
            endpoint,
            method = req.method.toLowerCase();

        function loadObject(cb) {
            if (!objectId) {
                return cb(null);
            }
            var models = modelEndpointHandler.initDb(req, [className]);
            models[0].findById(objectId, function (err, object) {
                if (err) {
                    return cb({
                        error: err
                    });
                }
                if (!object) {
                    return cb({
                        error: 'object_not_found'
                    });
                }
                cb(null, object);
            });
        }

        function getAction(actionList, cb) {
            // if there is special action.
            if (actionName) {
                // check if action exists.
                if (!actionList[actionName]) {
                    return cb({
                        error: 'action_not_found'
                    });
                }
                if (actionList[actionName].object && !objectId) {
                    return cb({
                        error: 'missing_object'
                    });
                }
                if (!actionList[actionName].object && objectId) {
                    return cb({
                        error: 'not_object_action'
                    });
                }
                return cb(null, actionList[actionName]);
            }
            // object request
            if (objectId) {
                if (!actionList.object) {
                    return cb({
                        error: 'action_not_found'
                    });
                }
                return cb(null, actionList.object);
            }
            // class request
            if (!actionList['']) {
                return cb({
                    error: 'action_not_found'
                });
            }
            return cb(null, actionList['']);
        }

        // load models and endpoints
        modelEndpointHandler
            .load()
            .then(function (results) {
                var models = results[0],
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
                var actionList = endpoint[version][method];

                getAction(actionList, function (actionErr, action) {
                    if (actionErr) {
                        return next(new RequestError(actionErr, 404));
                    }
                    if (!req.customData) {
                        req.customData = {};
                    }

                    req.customData.action = action;
                    loadObject(function (err, object) {
                        if (err) {
                            return next(new RequestError(err, 404));
                        }
                        req.customData.object = object;
                        next();
                    });
                });
            })
            .catch(function (err) {
                console.log(err);
                next(err);
            });
    };

module.exports = middleware;
