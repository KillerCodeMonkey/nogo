define([
    'util/modelEndpointHandler'
], function (modelEndpointHandler) {
    'use strict';

    return function (req, res, next) {
        var version = req.params.version,
            className = req.params.classname,
            actionName = req.params.action,
            objectId = req.params.objectid,
            endpoint,
            method = req.method.toLowerCase(),
            actionList;

        function loadObject(cb) {
            if (!objectId) {
                return cb(null);
            }
            modelEndpointHandler.initDb(req, res, [className], function (req, res, model) {
                model.findById(objectId, function (err, object) {
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
        modelEndpointHandler.load().then(function (results) {
            var models = results[0],
                endpoints = results[1];

            if (!version) {
                return res.status(404).send({
                    error: 'no_version'
                });
            }
            if (!className) {
                return res.status(404).send({
                    error: 'no_classname'
                });
            }
            if (!models[className]) {
                return res.status(404).send({
                    error: 'unknown_model',
                    param: className
                });
            }
            if (!endpoints[className]) {
                return res.status(404).send({
                    error: 'unknown_endpoint',
                    param: className
                });
            }
            // load model and endpoint by class
            endpoint = endpoints[className];

            if (!endpoint[version]) {
                return res.status(404).send({
                    error: 'no_endpoints_for_version',
                    param: version
                });
            }
            if (!endpoint[version][method]) {
                return res.status(404).send({
                    error: 'no_endpoints_for_method',
                    param: method
                });
            }

            //  load all actions
            actionList = endpoint[version][method];

            getAction(actionList, function (err, action) {
                if (err) {
                    return res.status(404).send(err);
                }
                if (!req.customData) {
                    req.customData = {};
                }

                req.customData.action = action;
                loadObject(function (err, object) {
                    if (err) {
                        return res.status(404).send(err);
                    }
                    req.customData.object = object;
                    next();
                });
            });
        }, function () {
            res.status(500).send({
                error: 'model_endpoint_loading_failed'
            });
        });
    };
});
