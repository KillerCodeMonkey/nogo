define([
], function () {
    'use strict';

    return function (req, res, next) {

        function checkPermissions() {
            if (!req.customData || !req.customData.action) {
                return true;
            }

            var correct = false,
                i = 0,
                action = req.customData.action,
                reqUser = req.customData.user;

            // check if action has permissions.
            if (action.permissions && action.permissions.length > 0) {
                // check if token auth puts user object on req.user has permissions
                if (reqUser && reqUser.permissions) {
                    // check if user has required permission by action
                    for (i; i < reqUser.permissions.length; i = i + 1) {
                        if (action.permissions.indexOf(reqUser.permissions[i]) > -1) {
                            correct = true;
                            break;
                        }
                    }
                }
            } else {
                correct = true;
            }
            return correct;
        }

        // return if permission check fails
        if (!checkPermissions()) {
            return res.status(403).send({
                error: 'permission_denied'
            });
        }
        next();
    };
});
