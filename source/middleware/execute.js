const modelEndpointHandler = require('../util/modelEndpointHandler'),
    helper = require('../util/helper'),
    middleware = function (req, res, next) {
        if (!req.customData || !req.customData.action) {
          return next();
        }


        let filteredRequest = {},
            action = req.customData.action;

        if (req.customData.user) {
            filteredRequest.user = req.customData.user;
            filteredRequest.accessToken = req.customData.accessToken;
            filteredRequest.authentication = req.customData.authentication;
        }
        if (req.db) {
            filteredRequest.db = req.db;
        }
        if (req.customData.params) {
            filteredRequest.params = req.customData.params;
        }
        if (req.customData.object) {
            filteredRequest.object = req.customData.object;
        }
        if (action.files) {
            // unify uploaded files --> use files array everytime also if only one file
            filteredRequest.files = [];
            if (req.files) {
                filteredRequest.files = req.files;
            }
            if (req.file) {
                filteredRequest.files.push(req.file);
            }
        }
        if (req.customData.pager) {
            filteredRequest.pager = req.customData.pager;
        }

        modelEndpointHandler.load().then(function () {
            let models = modelEndpointHandler.initDb(filteredRequest, action.models);
            models.push(next);
            models.unshift(res);
            models.unshift(filteredRequest);
            try {
                action.exec.apply(undefined, models);
            } catch (e) {
                next(e);
            }
        }, next);  
    };

module.exports = middleware;
