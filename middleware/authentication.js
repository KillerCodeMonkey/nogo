var jwt = require('jsonwebtoken'),
    appConfig = require('config/app'),
    RequestError = require('util/error').RequestError,
    modelEndpointHandler = require('util/modelEndpointHandler'),
    middleware = function (req, res, next) {
        var token,
            parts,
            scheme,
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

        // if verify fails with -> invalid token
        try {
            // verify token
            jwt.verify(token, appConfig.secret, function (err, decoded) {
                if (err) {
                    if (err.name === 'TokenExpiredError') {
                        return next(new RequestError(null, 401));
                    }
                    return next(new RequestError(err));
                }

                return modelEndpointHandler.load()
                    .then(function () {
                        var models = modelEndpointHandler.initDb(req, ['authentication', 'user']);
                        Authentication = models[0];
                        User = models[1];

                        return Authentication
                            .findOne({
                                accessToken: token
                            })
                            .exec();
                    })
                    .then(function (authentication) {
                        if (!authentication) {
                            throw new RequestError('invalid_authorization', 403);
                        }
                        return User
                            .findById(decoded.id)
                            .exec();
                    })
                    .then(function (user) {
                        if (!user) {
                            throw new RequestError('user_not_found', 404);
                        }
                        // everything works -> put decoded user on req.
                        if (!req.customData) {
                            req.customData = {};
                        }
                        req.customData.user = user;
                        req.customData.accessToken = token;
                        return next();
                    })
                    .catch(next);
            });
        } catch (e) {
            next({
                status: 403,
                name: 'invalid_authorization'
            });
        }
    };

module.exports = middleware;
