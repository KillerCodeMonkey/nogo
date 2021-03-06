const jwt = require('jsonwebtoken'),
    appConfig = require('../config/app'),
    RequestError = require('../util/error').RequestError,
    modelEndpointHandler = require('../util/modelEndpointHandler'),
    middleware = function (req, res, next) {
        let token,
            parts,
            scheme,
            authentication,
            User,
            Authentication,
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

        // verify token
        return jwt.verify(token, appConfig.secret, function (err, decoded) {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return next(new RequestError(null, 401));
                }
                return next(new RequestError('invalid_authorization', 403, null, err));
            }

            return modelEndpointHandler.load()
                .then(function () {
                    let models = modelEndpointHandler.initDb(req, ['authentication', 'user']);
                    Authentication = models[0];
                    User = models[1];

                    return Authentication
                        .findOne({
                            accessToken: token
                        })
                        .exec();
                })
                .then(function (currentAuthentication) {
                    if (!currentAuthentication) {
                        throw new RequestError('authentication_not_found', 404);
                    }
                    authentication = currentAuthentication;

                    return User
                        .findById(decoded.id)
                        .exec();
                })
                .then(function (user) {
                    if (!user) {
                        throw new RequestError('user_for_authentication_not_found', 404);
                    }
                    // everything works -> put decoded user on req.
                    if (!req.customData) {
                        req.customData = {};
                    }
                    req.customData.user = user;
                    req.customData.authentication = authentication;
                    req.customData.accessToken = token;
                    return next();
                })
                .catch(next);
        });
    };

module.exports = middleware;
