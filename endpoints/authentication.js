var rest = {},
    RequestError = require('../util/error').RequestError,
    jwt = require('jsonwebtoken'),
    crypto = require('crypto'),
    appConfig = require('../config/app'),
    dbConfig = require('../config/database'),
    Promise = require('bluebird');

function removeAuthenticationByUUID(uuid, Authentication) {
    return Authentication
        .find({
            uuid: uuid
        })
        .distinct('_id')
        .exec()
        .then(function (authenticationIDs) {
            if (authenticationIDs && authenticationIDs.length) {
                return Authentication
                    .remove({
                        _id: {
                            $in: authenticationIDs
                        }
                    })
                    .exec();
            }
            return;
        });
}

// store new authentication for user
function generateAuthentication(user, Authentication, token, platform, uuid) {
    var secret = crypto.randomBytes(128).toString('base64'),
        userData = {
            id: user.user || user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            creationDate: user.creationDate,
            permissions: user.permissions,
            secret: secret,
            expiresIn: appConfig.tokenExpiresInSeconds,
            tokenType: 'Bearer'
        },
        accessToken,
        refreshToken,
        auth;

    accessToken = jwt.sign(userData, appConfig.secret, { expiresIn: appConfig.tokenExpiresInSeconds });
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

    return auth
        .save()
        .then(function () {
            return userData;
        });
}

 /**
 * @api {post} /authentication/login Login
 * @apiName Login
 * @apiDescription user login
 * @apiGroup Authentication
 * @apiVersion 1.0.0
 * @apiPermission unauthorized
 * @apiParam {String} [email] email address to send new pw
 * @apiParam {String} [password] account password to set new email, password
 * @apiParam {String} [platform] logged in from ios|android|web
 * @apiParamExample {json} request body
               { "login": "bengtler@gmail.com",
                 "password": "123456",
                 "platform": "web" }
 * @apiSuccess {Object} authentication the authentication with tokens and user.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "refreshToken": "refreshtoken",
 *       "accessToken": "token",
 *       "_id": "507f191e810c19729de860ea",
 *       "user": { ... } // user object
 *     }
 *
 * @apiError (Error 500) InternalServerError An error while processing mongoDB query occurs.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "error": "MONGODB ERROR OBJECT"
 *     }
 *
 * @apiError (Error 400) MissingParameter a parameter is missing
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "missing_parameter"
 *     }
 * @apiError (Error 400) InvalidStructure structure of a parameter is invalid
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "invalid_structure",
 *       "param": "email"
 *     }
 * @apiError (Error 400) WrongDatatype type of parameter is invalid
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "wrong_type",
 *       "param": "email"
 *     }
 *
 * @apiError (Error 400) InvalidPassword old password is wrong
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "invalid_password"
 *     }
 * @apiError (Error 400) InvalidLogin username/email and password combination is wrong
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "invalid_login_password_combination"
 *     }
 * @apiError (Error 400) AlreadyLoggedIn authorization header is set with valid user
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "already_logged_in"
 *     }
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
    exec: function (req, res, User, Authentication, next) {
        var tasks = [],
            loginUser;

        if (req.user) {
            throw new RequestError('already_logged_in', 400);
        }

        User
            .findOne({
                $or: [{
                    email: req.params.login
                }, {
                    username: req.params.login
                }]
            })
            .exec()
            .then(function (user) {
                if (!user) {
                    throw new RequestError('user_not_exists', 400);
                }
                if (!user.checkPassword(req.params.password)) {
                    throw new RequestError('invalid_login_password_combination', 400);
                }

                loginUser = user;

                // remove other authentications of uuid
                if (req.params.uuid) {
                    tasks.push(removeAuthenticationByUUID(req.params.uuid, Authentication));
                }
                return Promise.all(tasks.map(function (promise) {
                    return promise.reflect();
                }));
            })
            .then(function () {
                return generateAuthentication(loginUser, Authentication, req.params.token, req.params.platform, req.params.uuid);
            })
            .then(function (userData) {
                // generate new password after login.
                userData.user = loginUser.toObject(true);
                delete userData.user.salt;
                delete userData.user.hashedPassword;
                return res.send(userData);
            })
            .catch(next);
    }
};

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
    exec: function (req, res, Authentication, next) {
        var params = req.params;

        Authentication
            .remove({
                platform: dbConfig.dbname
            })
            .exec()
            .then(function () {
                return Authentication
                    .findOne({
                        platform: params.platform,
                        uuid: params.uuid,
                        user: req.user._id
                    })
                    .exec();
            })
            .then(function (authentication) {
                if (!authentication) {
                    return res.status(404).send();
                }
                authentication.token = params.token;
                return authentication
                    .save();
            })
            .then(function () {
                res.send({});
            })
            .catch(next);
    }
};

/**
* @api {post} /authentication/refresh Refresh
* @apiName RefreshLogin
* @apiDescription generated new access- and refreshtoken pair
* @apiGroup Authentication
* @apiVersion 1.0.0
* @apiPermission unauthorized
* @apiParam {String} accessToken current access token
* @apiParam {String} refreshToken the refresh token
* @apiParamExample {json} request body
              { "accessToken": "adsfasdfdasfdasf",
                "refreshToken": "asdfdasfdasf" }
* @apiSuccess {Object} authentication the authentication with tokens and user.
* @apiHeaderExample {json} Authorization-Header-Example:
                 { "Authorization": "Bearer mF_9.B5f-4.1JqM" }
* @apiSuccessExample Success-Response:
*     HTTP/1.1 200 OK
*     {
*       "refreshToken": "refreshtoken",
*       "accessToken": "token",
*       "_id": "507f191e810c19729de860ea",
*       "user": { ... } // user object
*     }
*
* @apiError (Error 500) InternalServerError An error while processing mongoDB query occurs.
*
* @apiErrorExample Error-Response:
*     HTTP/1.1 500 Internal Server Error
*     {
*       "error": "MONGODB ERROR OBJECT"
*     }
* @apiError (Error 400) InvalidRefresh refreshtoken is incorrect
* @apiErrorExample Error-Response:
*     HTTP/1.1 400 Bad Request
*     {
*       "error": "invalid_refresh_token"
*     }
* @apiError (Error 400) InvalidUser there is no user for authorization
* @apiErrorExample Error-Response:
*     HTTP/1.1 400 Bad Request
*     {
*       "error": "user_not_found"
*     }
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
    exec: function (req, res, Authentication, User, next) {
        var params = req.params,
            loginUser,
            oldAuth;

        Authentication
            .findOne({
                accessToken: params.accessToken
            })
            .exec()
            .then(function (authentication) {
                if (!authentication) {
                    throw new RequestError('authentication_not_found', 404);
                }
                if (authentication.refreshToken !== params.refreshToken) {
                    throw new RequestError('invalid_refresh_token', 400);
                }

                oldAuth = authentication;
                return User
                    .findById(authentication.user)
                    .exec();
            })
            .then(function (user) {
                if (!user) {
                    throw new RequestError('user_for_authentication_not_found', 404);
                }

                loginUser = user;
                return oldAuth
                    .remove();
            })
            .then(function () {
                return generateAuthentication(loginUser, Authentication, oldAuth.token, oldAuth.platform, oldAuth.uuid);
            })
            .then(function (userData) {
                res.send(userData);
            })
            .catch(next);
    }
};

 /**
 * @api {get} /authentication/logout Logout
 * @apiName Logout
 * @apiDescription removes current authentication --> logout
 * @apiGroup Authentication
 * @apiVersion 1.0.0
 * @apiPermission User, Admin
 * @apiHeaderExample {json} Authorization-Header-Example:
                  { "Authorization": "Bearer mF_9.B5f-4.1JqM" }
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *
 * @apiError (Error 500) InternalServerError An error while processing mongoDB query occurs.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "error": "MONGODB ERROR OBJECT"
 *     }
 * @apiError (Error 403) UserNotFound there is no user for the accesstoken
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 403 Not Found
 */
rest.logout = {
    permissions: [appConfig.permissions.user, appConfig.permissions.admin],
    models: ['authentication'],
    exec: function (req, res, Authentication, next) {
        Authentication
            .findOne({
                accessToken: req.accessToken
            })
            .exec()
            .then(function (authentication) {
                if (!authentication) {
                    throw new RequestError(null, 403);
                }
                return authentication
                    .remove();
            })
            .then(function () {
                res.send();
            })
            .catch(next);
    }
};

module.exports = {
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
