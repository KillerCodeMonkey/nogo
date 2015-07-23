define([
    'jsonwebtoken',
    'appConfig',
    'util/modelEndpointHandler'
], function (jwt, appConfig, modelEndpointHandler) {
    'use strict';

    return function (req, res, next) {
        var token,
            parts,
            scheme,
            credentials;

        // extract bearer token if it is set in headers authorization
        if (!req.headers || !req.headers.authorization) {
            return next();
        }
        parts = req.headers.authorization.split(' ');
        if (parts.length !== 2) {
            return next();
        }
        scheme = parts[0];
        credentials = parts[1];

        if (/^Bearer$/i.test(scheme)) {
            token = credentials;
        }

        // if verify fails with -> invalid token
        try {
            // verify token
            jwt.verify(token, appConfig.secret, function (err, decoded) {
                if (err) {
                    if (err.name === 'TokenExpiredError') {
                        return res.status(401).send({});
                    }
                    return next();
                }

                modelEndpointHandler.initDb(req, res, ['authentication', 'user'], function (req, res, Authentication, User) {
                    Authentication.findOne({
                        accessToken: token
                    }, function (error, authentication) {
                        if (error) {
                            return res.status(500).send({
                                error: error
                            });
                        }
                        if (!authentication) {
                            return res.status(403).send({
                                error: 'invalid_authorization'
                            });
                        }
                        User.findById(decoded.id, function (err, user) {
                            if (err) {
                                return res.status(500).send({
                                    error: err
                                });
                            }
                            if (!user) {
                                return res.status(404).send({
                                    error: 'user_not_found'
                                });
                            }
                            // everything works -> put decoded user on req.
                            if (!req.customData) {
                                req.customData = {};
                            }
                            req.customData.user = user;
                            req.customData.accessToken = token;
                            return next();
                        });
                    });
                });
            });
        } catch (e) {
            res.status(403).send({
                error: 'invalid_authorization'
            });
        }
    };
});
