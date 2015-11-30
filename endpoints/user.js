var rest = {},
    fields = [
        'username',
        '_id'
    ],
    appConfig = require('config/app'),
    Promise = require('bluebird'),
    _ = require('underscore'),
    Mailer = require('util/mailer'),
    helper = require('util/helper');

function stripUser(user) {
    delete user.hashedPassword;
    delete user.salt;
}

function getUser(selector, User) {
    return User
        .findOne(selector)
        .exec()
        .then(function (user) {
            if (!user) {
                return false;
            }
            return true;
        });
}

function createPager(User, selector, pager, lean, getAllFields) {
    selector = selector || {};
    pager = pager || {};
    var populates = [],
        filter = pager.filter || {};

    selector.permissions = {
        $nin: [appConfig.permissions.admin] // remove admins
    };

    // if there is a pager
    if (pager) {
        // if there are filter
        if (filter.username) {
            selector.username = new RegExp(helper.regExpEscape(filter.username.toString()), 'i');
        }
        if (filter.email) {
            selector.email = new RegExp(helper.regExpEscape(filter.email.toString()), 'i');
        }
        if (!pager.orderBy || (typeof pager.orderBy === 'string' && !User.schema.path(pager.orderBy))) {
            pager.orderBy = 'normalizedUsername';
        }
        if (pager.orderDesc === undefined) {
            pager.orderDesc = false;
        }
    }

    return new Promise(function (resolve, reject) {
        helper.getPage(User, selector, populates, pager.limit, pager.skip, !getAllFields ? fields.join(' ') : undefined, pager.orderBy, pager.orderDesc, lean).then(function (results) {
            var rows = results[0],
                counter = results[1];

            pager.count = counter;
            if (pager.limit) {
                pager.pages = Math.floor(pager.count / pager.limit);
                if (pager.count % pager.limit) {
                    pager.pages = pager.pages + 1;
                }
            }

            resolve([rows, pager]);
        }, reject);
    });
}

/**
* @api {get} /user Get User list
* @apiName GetUsers
* @apiDescription Gets the list of all users exclude self
* @apiGroup User
* @apiVersion 1.0.0
* @apiPermission everyone
* @apiHeader {String} [Authorization] Set TOKENTYPE ACCESSTOKEN for possible authorization
* @apiHeaderExample {json} Authorization-Header-Example:
                 { "Authorization": "Bearer mF_9.B5f-4.1JqM" }
* @apiSuccess {Object[]} UserList list of user objects.
*
* @apiSuccessExample Success-Response:
*     HTTP/1.1 200 OK
*     [{
*       "username": "killercodemonkey",
*       "_id": "507f191e810c19729de860ea"
*     }]
*
* @apiError (Error 500) InternalServerError An error while processing mongoDB query occurs.
*
* @apiErrorExample Error-Response:
*     HTTP/1.1 500 Internal Server Error
*     {
*       "error": "MONGODB ERROR OBJECT"
*     }
*/
rest.get = {
    permissions: [],
    models: ['user'],
    pager: true,
    exec: function (req, res, User, next) {
        var selector = {},
            getAllFields = true;
        if (req.user) {
            selector._id = { // remove own user
                $ne: req.user._id
            };
        }

        if (req.user && req.user.permissions.indexOf(appConfig.permissions.admin) === -1) {
            getAllFields = false;
        }
        createPager(User, selector, req.pager, undefined, getAllFields).then(function (results) {
            res.send({
                entries: results[0],
                pager: results[1]
            });
        }, next);
    }
};

 /**
 * @api {get} /user/account Get Account
 * @apiName GetAccount
 * @apiDescription Gets the current logged in user
 * @apiGroup User
 * @apiVersion 1.0.0
 * @apiPermission authorized User
 * @apiHeader {String} Authorization Set TOKENTYPE ACCESSTOKEN for possible authorization
 * @apiHeaderExample {json} Authorization-Header-Example:
                  { "Authorization": "Bearer mF_9.B5f-4.1JqM" }
 * @apiSuccess {String} firstName firstname of the User.
 * @apiSuccess {String} lastName lastname of the User.
 * @apiSuccess {String} username username of the User.
 * @apiSuccess {String} normalizedUsername username in lowercase.
 * @apiSuccess {String} email email address of the User.
 * @apiSuccess {String} creationDate registration date of the User.
 * @apiSuccess {String[]} permissions the permissions/roles of the user.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "username": "killercodemonkey",
 *       "_id": "507f191e810c19729de860ea",
 *       "email": "bengtler@gmail.com",
 *       "permissions": [
 *          'user',
 *          'admin'
 *       ]
 *     }
 */
rest.account = {
    permissions: [appConfig.permissions.user],
    models: [],
    exec: function (req, res) {
        res.send(req.user.toObject(true));
    }
};

 /**
 * @api {get} /user/:id Get User
 * @apiName GetUser
 * @apiDescription Gets a user (no admins!)
 * @apiGroup User
 * @apiVersion 1.0.0
 * @apiPermission everyone
 * @apiParam {String} id objectid of the user
 * @apiHeader {String} [Authorization] Set TOKENTYPE ACCESSTOKEN for possible authorization
 * @apiHeaderExample {json} Authorization-Header-Example:
                  { "Authorization": "Bearer mF_9.B5f-4.1JqM" }
 * @apiSuccess {String} username username of the User.
 * @apiSuccess {String} email email address of the User.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "username": "killercodemonkey",
 *       "_id": "507f191e810c19729de860ea",
 *       "email": "bengtler@gmail.com"
 *     }
 *
 * @apiError (Error 403) Forbidden Trying to get admin user.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 403 Forbidden
 *     {
 *       "error": "permission_denied"
 *     }
 */
rest.getOne = {
    object: true,
    permissions: [],
    models: [],
    exec: function (req, res, next) {
        if (req.object.permissions.indexOf(appConfig.permissions.admin) !== -1) {
            return next({
                status: 403,
                error: 'permission_denied'
            });
        }
        var user = req.object.toObject(true);

        return res.send({
            username: user.username,
            email: user.email,
            _id: user._id
        });
    }
};

 /**
 * @api {delete} /user/:id Remove user
 * @apiName RemoveUser
 * @apiDescription removes a user as admin
 * @apiGroup User
 * @apiVersion 1.0.0
 * @apiPermission admin
 * @apiParam {String} id objectid of the user
 * @apiHeader {String} Authorization Set TOKENTYPE ACCESSTOKEN for possible authorization
 * @apiHeaderExample {json} Authorization-Header-Example:
                  { "Authorization": "Bearer mF_9.B5f-4.1JqM" }
 *
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
 */
rest.remove = {
    object: true,
    permissions: [appConfig.permissions.admin],
    models: ['authentication'],
    exec: function (req, res, Authentication, next) {
        // delete authentications of user if admin deletes him
        Authentication
            .remove({
                user: req.object._id
            })
            .exec()
            .then(function () {
                // delete user
                return req.object
                    .remove();
            })
            .then(function () {
                res.send();
            })
            .catch(next);
    }
};

 /**
 * @api {get} /user/check Check User
 * @apiName CheckUser
 * @apiDescription checks if a user with email or username exists
 * @apiGroup User
 * @apiVersion 1.0.0
 * @apiPermission everyone
 * @apiParam {String} email email address to check
 * @apiParamExample {string} [email]
               ?email=bengtler@gmail.com
 * @apiParam {String} username user name to check
 * @apiParamExample {string} [username]
               ?username=killercodemonkey
 * @apiHeader {String} [Authorization] Set TOKENTYPE ACCESSTOKEN for possible authorization
 * @apiHeaderExample {json} Authorization-Header-Example:
                  { "Authorization": "Bearer mF_9.B5f-4.1JqM" }
 *
 * @apiSuccess {Boolean} exists if username or email exists
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "exists": true
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
 * @apiError (Error 400) MissingParameter a required parameter is missing
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "missing_parameter"
 *     }
 * @apiError (Error 400) InvalidStructure parameter value is invalid.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "invalid_structure",
 *       "param": "email"
 *     }
 * @apiError (Error 400) WrongDatatype paramete has wrong type
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "wrong_type",
 *       "param": "email"
 *     }
 */
rest.check = {
    permissions: [],
    params: {
        email: {
            type: String,
            optional: true,
            regex: /^[a-zA-Z0-9\.\-\_]+@[a-zA-Z0-9\.\-\_]+\.[a-zA-Z]{2,}$/,
            query: true
        },
        username: {
            type: String,
            optional: true,
            query: true
        }
    },
    models: ['user'],
    exec: function (req, res, User, next) {
        var selector = {};
        if (!req.params.email && !req.params.username) {
            return next({
                status: 400,
                error: 'missing_parameter',
                param: 'email'
            });
        }
        if (req.params.email) {
            selector.email = req.params.email;
        } else {
            selector.username = req.params.username;
        }

        getUser(selector, User).then(function (exists) {
            return res.send({
                exists: exists
            });
        }, next);
    }
};

 /**
 * @api {put} /user/sendPassword Send new password
 * @apiName SendPassword
 * @apiDescription sends password for email
 * @apiGroup User
 * @apiVersion 1.0.0
 * @apiPermission unauthorized
 * @apiParam {String} email email address to send new pw
 * @apiParamExample {json} request body
               { "email": "bengtler@gmail.com" }
 * @apiSuccess {Object} user the user object.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "username": "killercodemonkey",
 *       "_id": "507f191e810c19729de860ea",
 *       "email": "bengtler@gmail.com"
 *     }
 *
 * @apiError (Error 5xx) InternalServerError An error while processing mongoDB query occurs.
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
 * @apiError (Error 400) AlreadyLoggedIn valid authorization header is set
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "user_already_loggedin"
 *     }
 * @apiError (Error 404) NotFound User not found
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "user_not_found"
 *     }
 */
rest.sendPassword = {
    permissions: [],
    params: {
        email: {
            type: String,
            regex: /^[a-zA-Z0-9\.\-\_]+@[a-zA-Z0-9\.\-\_]+\.[a-zA-Z]{2,}$/
        }
    },
    models: ['user'],
    exec: function (req, res, User, next) {
        if (req.user) {
            return next({
                status: 400,
                error: 'user_already_loggedin'
            });
        }
        User
            .findOne({
                email: req.params.email
            })
            .exec()
            .then(function (user) {
                if (!user) {
                    return next({
                        status: 404,
                        error: 'user_not_found'
                    });
                }
                var password = helper.generateRandomString();

                user.password = password;
                user.isTempPassword = true;

                return user.save();
            })
            .then(function (user) {
                var object = user.toObject();
                if (process.env.NODE_ENV !== 'production') {
                    object.password = user.password;
                }
                stripUser(object);

                var Mail = new Mailer();
                Mail.send(user.email, 'passwordRecovery', null, {
                    password: user.password,
                    user: user.username
                }, function (mailErr) {
                    if (mailErr) {
                        console.log('mailsending error: passwordRecovery ', mailErr);
                    }
                    return res.send(object);
                });
            })
            .catch(next);
    }
};

 /**
 * @api {post} /user Register User
 * @apiName Register
 * @apiDescription Register a new User
 * @apiGroup User
 * @apiVersion 1.0.0
 * @apiPermission unauthorized
 * @apiParam {String} email email address to send new pw
 * @apiParam {String} password account password
 * @apiParam {String} [firstName] first name of user
 * @apiParam {String} [lastName] last name of user
 * @apiParamExample {json} request body
               { "email": "bengtler@gmail.com",
                 "password": "123456",
                 "firstName": "Bengt",
                 "lastName": "Weiße" }
 * @apiSuccess {Object} user the user object.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "firstName": "Bengt",
 *       "lastName": "Weiße",
 *       "_id": "507f191e810c19729de860ea",
 *       "email": "bengtler@gmail.com"
 *     }
 *
 * @apiError (Error 5xx) InternalServerError An error while processing mongoDB query occurs.
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
 * @apiError (Error 400) AlreadyLoggedIn valid authorization header is set
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "user_already_loggedin"
 *     }
 * @apiError (Error 400) UserExists a user with the given email already exists
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "email_exists"
 *     }
 */
rest.register = {
    params: {
        'email': {
            type: String,
            regex: /^[a-zA-Z0-9\.\-\_]+@[a-zA-Z0-9\.\-\_]+\.[a-zA-Z]{2,}$/
        },
        'firstName': {
            type: String,
            optional: true
        },
        'lastName': {
            type: String,
            optional: true
        },
        'password': {
            type: String,
            regex: /^\S{6,}$/
        }
    },
    models: ['user'],
    exec: function (req, res, User, next) {
        var params = req.params,
            user;

        if (req.user) {
            return next({
                status: 400,
                error: 'already_logged_in'
            });
        }

        User
            .findOne({
                email: params.email
            })
            .exec()
            .then(function (existingUser) {
                if (existingUser) {
                    return next({
                        status: 400,
                        error: 'email_exists'
                    });
                }

                user = new User({
                    email: params.email,
                    firstName: params.firstName,
                    lastName: params.lastName,
                    password: params.password
                });

                // save user
                return user.save();
            })
            .then(function (newUser) {
                var object = newUser.toObject(true),
                    Mail = new Mailer();

                if (process.env.NODE_ENV !== 'production') {
                    object.password = params.password;
                }
                stripUser(object);

                Mail.send(newUser.email, 'welcome', null, {}, function (mailErr) {
                    if (mailErr) {
                        console.log('mailsending error: welcome ', mailErr);
                    }
                    return res.send(object);
                });
            })
            .catch(next);
    }
};

 /**
 * @api {put} /user/account Update User
 * @apiName UpdateAccount
 * @apiDescription Update current loggedin user
 * @apiGroup User
 * @apiVersion 1.0.0
 * @apiPermission User
 * @apiParam {String} [email] email address to send new pw
 * @apiParam {String} [password] account password to set new email, password
 * @apiParam {String} [newPassword] new account password
 * @apiParam {String} [firstName] first name of user
 * @apiParam {String} [lastName] last name of user
 * @apiParam {String} [username] set unique username
 * @apiParamExample {json} request body
               { "email": "bengtler@gmail.com",
                 "username": "killercodemonkey",
                 "password": "123456",
                 "newPassword": "123457"
                 "firstName": "Bengt",
                 "lastName": "Weiße" }
 * @apiHeader {String} Authorization Set TOKENTYPE ACCESSTOKEN for possible authorization
 * @apiHeaderExample {json} Authorization-Header-Example:
                  { "Authorization": "Bearer mF_9.B5f-4.1JqM" }
 * @apiSuccess {Object} user the user object.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "firstName": "Bengt",
 *       "lastName": "Weiße",
 *       "username": "killercodemonkey",
 *       "_id": "507f191e810c19729de860ea",
 *       "email": "bengtler@gmail.com"
 *     }
 *
 * @apiError (Error 5xx) InternalServerError An error while processing mongoDB query occurs.
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
 * @apiError (Error 400) EmailExists a user with the given email already exists
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 Not Found
 *     {
 *       "error": "email_exists"
 *     }
 * @apiError (Error 400) UsernameExists a user with the given email already exists
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 Not Found
 *     {
 *       "error": "username_exists"
 *     }
 */
rest.update = {
    params: {
        'email': {
            type: String,
            regex: /^[a-zA-Z0-9\.\-\_]+@[a-zA-Z0-9\.\-\_]+\.[a-zA-Z]{2,}$/,
            optional: true
        },
        'firstName': {
            type: String,
            optional: true
        },
        'lastName': {
            type: String,
            optional: true
        },
        'password': {
            type: String,
            regex: /^\S{6,}$/,
            optional: true
        },
        'newPassword': {
            type: String,
            regex: /^\S{6,}$/,
            optional: true
        },
        'username': {
            type: String,
            regex: /^\S{4,20}$/,
            optional: true
        }
    },
    permissions: [appConfig.permissions.user],
    models: ['user'],
    exec: function (req, res, User, next) {
        var params = req.params,
            user = req.user,
            tasks = [];

        // check if old password was sent if new email or/and new password
        if ((params.email || params.newPassword) && !params.password) {
            return next({
                status: 400,
                error: 'missing_parameter',
                param: 'password'
            });
        }
        if (params.email === user.email) {
            delete params.email;
        }
        if (params.username === user.username) {
            delete params.username;
        }

        // if old password is wrong -> return
        if (params.email || params.newPassword) {
            if (!params.password || !user.checkPassword(params.password)) {
                return next({
                    status: 400,
                    error: 'invalid_password'
                });
            }
        }

        // change email -> check if someone exists with email
        if (params.email) {
            tasks.push(getUser({
                email: params.email
            }, User));
        }
        Promise
            .all(tasks)
            .then(function (results) {
                if (tasks.length && results && results.length && results[0]) {
                    return next({
                        status: 400,
                        error: 'email_exists'
                    });
                }
                tasks.length = 0;

                // change username -> check if username exists
                if (params.username) {
                    tasks.push(getUser({
                        username: params.username
                    }, User));
                }
                return Promise.all(tasks);
            })
            .then(function (userResult) {
                if (tasks.length && userResult && userResult.length && userResult[0]) {
                    return next({
                        status: 400,
                        error: 'username_exists'
                    });
                }

                // set password to new one
                if (params.newPassword) {
                    params.password = params.newPassword;
                }

                // set new values
                _.extend(user, params);

                // if new password -> reset temp pw flag
                if (params.newPassword) {
                    user.isTempPassword = false;
                }

                // save user
                return user.save();
            })
            .then(function (saved) {
                return res.send(saved.toObject(true));
            })
            .catch(next);
    }
};

module.exports = {
    v1: {
        post: {
            '': rest.register
        },
        get: {
            'account': rest.account,
            'check': rest.check,
            'object': rest.getOne,
            '': rest.get
        },
        put: {
            'sendPassword': rest.sendPassword,
            'account': rest.update
        },
        'delete': {
            'object': rest.remove
        }
    }
};
