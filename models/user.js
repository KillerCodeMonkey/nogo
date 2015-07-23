/* global define */
define([
    'mongoose',
    'crypto',
    'appConfig'
], function (mongoose, crypto, appConfig) {
    'use strict';

    var Schema = mongoose.Schema,
        UserModel,
        // User
        User = new Schema({
            firstName: String,
            lastName: String,
            username: {
                type: String,
                unqiue: true
            },
            normalizedUsername: String,
            email: {
                type: String,
                required: true
            },
            hashedPassword: {
                type: String,
                required: true
            },
            salt: {
                type: String,
                required: true
            },
            creationDate: {
                type: Date,
                'default': Date.now
            },
            permissions: {
                type: [String],
                'default': [appConfig.permissions.user]
            },
            isTempPassword: {
                type: Boolean,
                'default': false
            },
            data: {}
        });

    User.methods.encryptPassword = function (password) {
        return crypto.pbkdf2Sync(password, this.salt, 10000, 512).toString('hex');
    };

    User.virtual('userId')
        .get(function () {
            return this.id;
        });

    User.virtual('password')
        .set(function (password) {
            this.salt = crypto.randomBytes(128).toString('base64');
            this.hashedPassword = this.encryptPassword(password);
        });


    User.methods.checkPassword = function (password) {
        return this.encryptPassword(password) === this.hashedPassword;
    };

    User.pre('save', function (next) {
        // save normalized username
        if (this.username) {
            this.normalizedUsername = this.username.toLowerCase();
        }
        next();
    });

    UserModel = mongoose.model('User', User);

    return {
        model: UserModel,
        schema: User
    };
});
