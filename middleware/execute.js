define([
    'util/modelEndpointHandler',
    'util/helper'
], function (modelEndpointHandler, helper) {
    'use strict';

    return function (req, res, next) {
        if (req.customData && req.customData.action) {
            var filteredRequest = {},
                action = req.customData.action;

            if (req.customData.user) {
                filteredRequest.user = req.customData.user;
            }
            if (req.customData.accessToken) {
                filteredRequest.accessToken = req.customData.accessToken;
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
            if (action.file) {
                filteredRequest.originalRequest = req;
            }
            if (req.agenda) {
                filteredRequest.agenda = req.agenda;
            }
            if (action.pager) {
                filteredRequest.pager = helper.setPager(req.query);
            }

            return modelEndpointHandler.initDb(filteredRequest, res, action.models, action.exec);
        }

        next();
    };
});
