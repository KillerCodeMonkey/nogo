/* global define */
/** @file authentication.js Endpoints for authentication request
 *  @module Authentication
 * */
define([
    'jsonwebtoken',
    'crypto',
    'appConfig',
    'databaseConfig',
    'node-promise'
], /** @lends Authentication */ function (jwt, crypto, appConfig, dbConfig, promise) {
    'use strict';

    var Promise = promise.Promise,
        rest = {};

    function removeAuthenticationByUUID(uuid, Authentication) {
        var q = new Promise();

        Authentication.find({
            uuid: uuid
        }).distinct('_id').exec(function (err, authenticationIDs) {
            if (err) {
                return q.reject(err);
            }
            if (authenticationIDs && authenticationIDs.length) {
                Authentication.remove({
                    _id: {
                        $in: authenticationIDs
                    }
                }, function (err) {
                    if (err) {
                        return q.reject(err);
                    }
                    q.resolve();
                });
            } else {
                q.resolve();
            }
        });

        return q;
    }

    // store new authentication for user
    function generateAuthentication(user, Authentication, token, platform, uuid) {
        var $q = new Promise(),
            secret = crypto.randomBytes(128).toString('base64'),
            userData = {
                id: user.user || user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                creationDate: user.creationDate,
                permissions: user.permissions,
                secret: secret,
                expiresInMinutes: appConfig.tokenExpiresInMinutes,
                tokenType: 'Bearer'
            },
            accessToken,
            refreshToken,
            auth;

        accessToken = jwt.sign(userData, appConfig.secret, { expiresInMinutes: appConfig.tokenExpiresInMinutes });
        userData.accessToken = accessToken;

        refreshToken = jwt.sign(userData, appConfig.secret);
        userData.refreshToken = refreshToken;

        auth = new Authentication({
            user: userData.id,
            secret: secret,
            accessToken: accessToken,
            refreshToken: refreshToken
        });

        if (token) {
            auth.token = token;
        }
        if (platform) {
            auth.platform = platform;
        }
        if (uuid) {
            auth.uuid = uuid;
        }

        auth.save(function (err) {
            if (err) {
                $q.reject(err);
            } else {
                $q.resolve(userData);
            }
        });

        return $q;
    }

    /**
     * @function login
     * @description Login for user
     * @property /api/[version]/authentication/login url
     * @property {POST} Method - request method
     * @param {string} password - User password
     * @param {string} login - email|username address
     * @param {string} token - apn token or google registrationId (optional)
     * @param {string} uuid - device uuid (optional)
     * @param {string} platform - ios | android
     * @return {object} authorized user object - user + tokens
     * @throws 400 'missing_parameter_login' - if email|username is missing
     * @throws 400 'missing_parameter_password' - if password is missing
     * @throws 400 'missing_parameter_platform' - if platform is missing
     * @throws 400 'already_logged_in' - if you send valid authorization header you are already logged in
     * @throws 400 'user_not_exists' - user does not exist in database
     * @throws 400 'invalid_login_password_combination' - email/password combination is invalid
     * @throws 400 'wrong_param_type_for_PARAMETER' - PARAMETER=login|password|platform|token|uuid is no string
     */
    rest.login = {
        permissions: [],
        params: {
            'login': {
                type: String
            },
            'password': {
                type: String
            },
            'platform': {
                type: String,
                reqex: /^(ios|android|web)$/
            },
            'token': {
                type: String,
                optional: true
            },
            'uuid': {
                type: String,
                optional: true
            }
        },
        models: ['user', 'authentication'],
        exec: function (req, res, User, Authentication) {
            var tasks = [];

            if (req.user) {
                return res.status(400).send({
                    error: 'already_logged_in'
                });
            }

            User.findOne({
                $or: [{
                    email: req.params.login
                }, {
                    username: req.params.login
                }]
            }, function (err, user) {
                if (err) {
                    return res.status(500).send({
                        error: err
                    });
                }
                if (!user) {
                    return res.status(400).send({
                        error: 'user_not_exists'
                    });
                }
                if (!user.checkPassword(req.params.password)) {
                    return res.status(400).send({
                        error: 'invalid_login_password_combination'
                    });
                }
                // remove other authentications of uuid
                if (req.params.uuid) {
                    tasks.push(removeAuthenticationByUUID(req.params.uuid, Authentication));
                }
                promise.allOrNone(tasks).then(function () {
                    generateAuthentication(user, Authentication, req.params.token, req.params.platform, req.params.uuid).then(function (userData) {
                        // generate new password after login.
                        userData.user = user.toObject();
                        delete userData.user.salt;
                        delete userData.user.hashedPassword;
                        res.send(userData);
                    }, function (err) {
                        res.status(500).send({
                            error: err
                        });
                    });
                }, function (err) {
                    res.status(500).send({
                        error: err
                    });
                });
            });
        }
    };

    /**
     * @function token
     * @description updates token for a authentication
     * @property /api/[version]/[database]/authentication/token url
     * @property {PUT} Method - request method
     * @property Authorization - set request header Authorization: TOKENTYPE ACCESSTOKEN
     * @property Permissions - User
     * @param {string} uuid - device uuid
     * @param {string} platform - platform
     * @param {string} token - new token
     * @throws 400 'missing_parameter_token' - if token is missing
     * @throws 400 'missing_parameter_platform' - if platform is missing
     * @throws 400 'missing_parameter_uuid' - if uuid is missing
     * @throws 400 'wrong_param_type_for_PARAMETER' - PARAMETER=token|platform|uuid is no string
    */
    rest.token = {
        params: {
            'token': {
                type: String
            },
            'platform': {
                type: String,
                reqex: /^(ios|android)$/
            },
            'uuid': {
                type: String
            }
        },
        permissions: [appConfig.permissions.user],
        models: ['authentication'],
        exec: function (req, res, Authentication) {
            var params = req.params;
            Authentication.remove({
                platform: dbConfig.dbname
            }, function () {
                Authentication.findOne({
                    platform: params.platform,
                    uuid: params.uuid,
                    user: req.user._id
                }, function (err, authentication) {
                    if (err) {
                        return res.status(500).send({
                            error: err
                        });
                    }
                    if (!authentication) {
                        return res.status(404).send();
                    }
                    authentication.token = params.token;
                    authentication.save(function (err) {
                        if (err) {
                            return res.status(500).send({
                                error: err
                            });
                        }
                        res.send({});
                    });
                });
            });
        }
    };

    /**
     * @function refresh
     * @description Refreshs access/refresh token for a user
     * @property /api/[version]/authentication/refresh url
     * @property {POST} Method - request method
     * @param {string} accessToken - access token you've got from login request
     * @param {string} refreshToken - refresh token you've got from login request
     * @return {object} authorized user object - user + tokens
     * @throws 400 'missing_parameter_accessToken' - if access token is missing
     * @throws 400 'missing_parameter_refreshToken' - if refresh token is missing
     * @throws 400 'invalid_refresh_token' - refresh token belongs not to the access token
     * @throws 403 - the access token not exists -> not loggedin
     * @throws 400 'user_not_found' - found no user to access token in database
     * @throws 400 'wrong_param_type_for_PARAMETER' - PARAMETER=accessToken|refreshToken is no string
    */
    rest.refresh = {
        params: {
            'accessToken': {
                type: String
            },
            'refreshToken': {
                type: String
            }
        },
        permissions: [],
        models: ['authentication', 'user'],
        exec: function (req, res, Authentication, User) {
            var params = req.params;

            Authentication.findOne({
                accessToken: params.accessToken
            }, function (err, authentication) {
                if (err) {
                    return res.status(500).send({
                        error: err
                    });
                }
                if (!authentication) {
                    return res.status(403).send();
                }
                if (authentication.refreshToken !== params.refreshToken) {
                    return res.status(400).send({
                        error: 'invalid_refresh_token'
                    });
                }
                User.findById(authentication.user, function (usererr, user) {
                    if (usererr) {
                        return res.status(500).send({
                            error: err
                        });
                    }
                    if (!user) {
                        return res.status(400).send({
                            error: 'user_not_found'
                        });
                    }
                    var token = authentication.token,
                        platform = authentication.platform,
                        uuid = authentication.uuid;
                    authentication.remove(function (err) {
                        if (err) {
                            return res.status(500).send({
                                error: err
                            });
                        }
                        generateAuthentication(user, Authentication, token, platform, uuid).then(function (userData) {
                            res.send(userData);
                        }, function (err) {
                            res.status(500).send({
                                error: err
                            });
                        });
                    });
                });
            });
        }
    };

    /**
     * @function logout
     * @description Logout
     * @property /api/[version]/authentication/logout - url
     * @property {GET} Method - request method
     * @property Authorization - set request header Authorization: TOKENTYPE ACCESSTOKEN
     * @throws 403 - not logged in -> permission denied
     */
    rest.logout = {
        permissions: [appConfig.permissions.user, appConfig.permissions.admin],
        models: ['authentication'],
        exec: function (req, res, Authentication) {
            Authentication.findOne({
                accessToken: req.accessToken
            }, function (err, authentication) {
                if (err) {
                    return res.status(500).send({
                        error: err
                    });
                }
                if (!authentication) {
                    return res.status(403).send();
                }
                authentication.remove(function (err) {
                    if (err) {
                        return res.status(500).send({
                            error: err
                        });
                    }
                    res.send();
                });
            });
        }
    };

    return {
        v1: {
            post: {
                // /authentication
                'login': rest.login,
                // refresh access token / authentication
                'refresh': rest.refresh
            },
            put: {
                // updates push token
                'token': rest.token
            },
            // logout request
            get: {
                'logout': rest.logout
            }
        }
    };
});
