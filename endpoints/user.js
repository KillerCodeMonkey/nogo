/* global define, process, console */
/** @file user.js Endpoints for user request
 *  @module User
 * */
define([
    'appConfig',
    'node-promise',
    'underscore',
    'util/mailer',
    'util/helper'
], /** @lends User */ function (appConfig, promise, _, Mailer, helper) {
    'use strict';
    var rest = {},
        fields = [
            'username',
            '_id'
        ],
        Promise = promise.Promise;

    function stripUser(user) {
        delete user.hashedPassword;
        delete user.salt;
    }

    function getUser(selector, User) {
        var q = new Promise();

        User.findOne(selector, function (err, user) {
            if (err) {
                return q.reject(err);
            }
            if (!user) {
                return q.resolve(false);
            }
            return q.resolve(true);
        });

        return q;
    }

    function createPager(User, selector, pager, lean, getAllFields) {
        selector = selector || {};
        pager = pager || {};
        var q = new Promise(),
            populates = [],
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

            q.resolve([rows, pager]);
        }, q.reject);

        return q;
    }

    /**
     * @function get
     * @description Get users
     * @property /api/[version]/user url
     * @property {GET} Method - request method
     * @property Authorization - set request header Authorization: TOKENTYPE ACCESSTOKEN
     * @return {array.object} user list - user object
     */
    rest.get = {
        permissions: [],
        models: ['user'],
        pager: true,
        exec: function (req, res, User) {
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
            }, function (err) {
                res.status(500).send({
                    error: err
                });
            });
        }
    };

    /**
     * @function account
     * @description Gets current logged in user
     * @property /api/[version]/user/account url
     * @property {GET} Method - request method
     * @property Authorization - set request header Authorization: TOKENTYPE ACCESSTOKEN
     * @property Permissions - User
     * @return {object} user - user object
     */
    rest.account = {
        permissions: [appConfig.permissions.user],
        models: [],
        exec: function (req, res) {
            res.send(req.user.toObject());
        }
    };

    /**
     * @function getOne
     * @description Get user
     * @property /api/[version]/user/id/[userid] url
     * @property {GET} Method - request method
     * @property Authorization - set request header Authorization: TOKENTYPE ACCESSTOKEN
     * @return {object} user - user object
     */
    rest.getOne = {
        object: true,
        permissions: [],
        models: [],
        exec: function (req, res) {
            if (req.object.permissions.indexOf(appConfig.permissions.admin) !== -1) {
                return res.status(403).send({
                    error: 'permission_denied'
                });
            }
            var user = req.object.toObject();

            return res.send({
                username: user.username,
                email: user.email,
                _id: user._id
            });
        }
    };

    /**
     * @function remove
     * @description removes user
     * @property /api/[version]/user/id/[userid] url
     * @property {DELETE} Method - request method
     * @property Authorization - set request header Authorization: TOKENTYPE ACCESSTOKEN
     * @property Permissions - Admin
     */
    rest.remove = {
        object: true,
        permissions: [appConfig.permissions.admin],
        models: ['authentication'],
        exec: function (req, res, Authentication) {
            // delete authentications of user if admin deletes him
            Authentication.remove({
                user: req.object._id
            }, function (err) {
                if (err) {
                    return res.status(500).send({
                        error: err
                    });
                }
                // delete user
                req.object.remove(function (removeErr) {
                    if (removeErr) {
                        return res.status(500).send({
                            error: removeErr
                        });
                    }

                    res.send();
                });
            });
        }
    };

    /**
     * @function check
     * @description Check if email and/or username already exists
     * @property /api/[version]/user/check?username=[username] url
     * @property /api/[version]/user/check?email=[email] url
     * @property {GET} Method - request method
     * @param {string} email - the email address  (on is required)
     * @param {string} username - the username (on is required)
     * @return {object} exists - true or false
     * @throws 400 'missing_parameter' - PARAMETER=email if email and username is empty
     * @throws 400 'invalid_structure' - PARAMETER=email if email address doesn't match the regex
     * @throws 400 'wrong_type' - PARAMETER=email|username is no string
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
        exec: function (req, res, User) {
            var selector = {};
            if (!req.params.email && !req.params.username) {
                return res.status(400).send({
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
            }, function (err) {
                return res.status(500).send({
                    error: err
                });
            });
        }
    };

    /**
     * @function sendPassword
     * @description send password for email
     * @property /api/[version]/user/sendPassword url
     * @property {PUT} Method - request method
     * @param {string} email - the email address
     * @return {object} exists - true or false
     * @throws 400 'missing_parameter' - Parameter=email if email is empty
     * @throws 400 'invalid_structure' - Parameter=email if email is not valid
     * @throws 400 'user_already_loggedin' - sent with  auth header
     * @throws 400 'wrong_type' - PARAMETER=email is no string
     * @throws 404 'user_not_found' - if user not exists
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
        exec: function (req, res, User) {
            if (req.user) {
                return res.status(400).send({
                    error: 'user_already_loggedin'
                });
            }
            User.findOne({
                email: req.params.email
            }, function (err, user) {
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
                var password = helper.generateRandomString(),
                    object = {};

                user.password = password;
                user.isTempPassword = true;

                user.save(function (saveErr) {
                    if (saveErr) {
                        return res.status(500).send({
                            error: saveErr
                        });
                    }
                    if (process.env.NODE_ENV !== 'production') {
                        object.password = password;
                    }
                    stripUser(object);

                    var Mail = new Mailer();
                    Mail.send(user.email, 'passwordRecovery', null, {
                        password: password,
                        user: user.username
                    }, function (mailErr) {
                        if (mailErr) {
                            console.log('mailsending error: passwordRecovery ', mailErr);
                        }
                        return res.send(object);
                    });
                });
            });
        }
    };

    /**
     * @function register
     * @description Register new user
     * @property /api/[version]/user url
     * @property {POST} Method - request method
     * @param {string} firstName - the firstname (optional)
     * @param {string} lastName - the lastname (optional)
     * @param {string} email - the email address
     * @param {string} password - the password
     * @return {string} password - new password
     * @throws 400 'already_logged_in' - if user is already logged in
     * @throws 400 'missing_parameter' - PARAMETER=email|password|language if email,password is empty
     * @throws 400 'invalid_structure' - PARAMETER=email|password if email,password address doesn't match the regex
     * @throws 400 'custom_validation' - param language if language not known or valid
     * @throws 400 'wrong_type' - PARAMETER=email|firstName|lastName|password|language is no string
     * @throws 400 'email_exists' - if user already exists
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
        exec: function (req, res, User) {
            var params = req.params,
                user;

            if (req.user) {
                return res.status(400).send({
                    error: 'already_logged_in'
                });
            }

            User.findOne({
                email: params.email
            }, function (err, existingUser) {
                if (err) {
                    return res.status(500).send({
                        error: err
                    });
                }
                if (existingUser) {
                    return res.status(400).send({
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
                user.save(function (saveErr, newUser) {
                    if (saveErr) {
                        return res.status(500).send({
                            error: saveErr
                        });
                    }

                    var object = newUser.toObject(),
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
                });
            });
        }
    };

    /**
     * @function account
     * @description update user
     * @property /api/[version]/user/account url
     * @property {PUT} Method - request method
     * @property Authorization - set request header Authorization: TOKENTYPE ACCESSTOKEN
     * @property Permissions - User
     * @param {string} firstName - the firstname (optional)
     * @param {string} lastName - the lastname (optional)
     * @param {string} email - the email address (optional)
     * @param {string} password - the password (optional)
     * @param {string} newPassword - the new password (optional)
     * @param {string} username - username (optional)
     * @return {object} user - object
     * @throws 404 'user_not_found' - if user is not found
     * @throws 400 'missing_parameter' - PARAMETER=password if password is missing to set new email or pwd
     * @throws 400 'invalid_structure' - PARAMETER=email|password|newPassowrd if email address, password doesn't match the regex
     * @throws 400 'invalid_password' - old password is wrong
     * @throws 400 'wrong_type' - PARAMETER=email|firstName|lastName|password|language is no string
     * @throws 400 'email_exists' - if user already exists
     * @throws 400 'username_exists' - if username already exists
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
        exec: function (req, res, User) {
            var params = req.params,
                user = req.user,
                tasks = [];

            // check if old password was sent if new email or/and new password
            if ((params.email || params.newPassword) && !params.password) {
                return res.status(400).send({
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
                    return res.status(400).send({
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
            promise.allOrNone(tasks).then(function (results) {
                if (tasks.length && results && results.length && results[0]) {
                    return res.status(400).send({
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
                promise.allOrNone(tasks).then(function (userResult) {
                    if (tasks.length && userResult && userResult.length && userResult[0]) {
                        return res.status(400).send({
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
                    user.save(function (err, saved) {
                        if (err) {
                            return res.status(500).send({
                                error: err
                            });
                        }
                        return res.send(saved.toObject());
                    });
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
        }
    };

    return {
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
});
