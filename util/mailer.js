define([
    'nodemailer',
    'nodemailer-smtp-transport',
    'config/smtp',
    'bluebird',
    'path',
    'module',
    'email-templates',
    'fs',
    'appConfig'
], function (nodemailer, smtpTransport, smtpConfig, Promise, path, module, emailTemplates, fs, appConfig) {
    'use strict';

    var templateDir = path.resolve(path.dirname(module.uri), '..', 'templates'),
        config = {},
        transport;

    function getTranslations(templateDir, templateName, params, language) {
        return new Promise(function (resolve, reject) {
            fs.exists(templateDir + '/' + templateName + '/translations.js', function (exists) {
                if (exists) {
                    require(['templates/' + templateName + '/translations'], function (fileContent) {
                        if (fileContent[language]) {
                            params.dict = fileContent[language];
                            return resolve();
                        }
                        reject();
                    });
                } else {
                    reject();
                }
            });
        });
    }

    if (smtpConfig) {
        config.service = smtpConfig.service;
        config.auth = smtpConfig.auth;
        config.host = smtpConfig.host;
        config.port = smtpConfig.port;
        config.secure = smtpConfig.secure === true ? true : false;
    }

    transport = nodemailer.createTransport(smtpTransport(config));

    function Mail() {
        this.config = config;
        this.config.sender = smtpConfig.sender;
        this.transport = transport;
        this.templateDir = templateDir;
    }

    Mail.prototype.config = function (config) {
        this.config = config;
    };

    Mail.prototype.transport = function (options) {
        this.transport = nodemailer.createTransport(options);
    };

    Mail.prototype.templateDir = function (dirPath) {
        this.templateDir = dirPath;
    };

    Mail.prototype.send = function (to, templateName, language, params, cb) {
        var self = this,
            tasks = [];

        if (!to) {
            return cb('missing_to');
        }
        if (!templateName) {
            return cb('missing_templateName');
        }
        if (!language || !appConfig.languages[language]) {
            language = appConfig.defaultLanguage;
        }
        params = params || {};

        tasks.push(getTranslations(self.templateDir, templateName, params, language));

        Promise.all(tasks).then(function () {
            emailTemplates(self.templateDir, function (err, template) {
                if (err) {
                    return cb(err);
                }

                if (!params.dict) {
                    return cb('missing_translations');
                }
                if (!params.dict.title) {
                    return cb('missing_title');
                }

                // Send a single email
                template(templateName, params, function (err, html, text) {
                    if (err) {
                        return cb(err);
                    }
                    self.transport.sendMail({
                        from: self.config.sender,
                        to: to,
                        subject: params.dict.title,
                        html: html,
                        // generateTextFromHTML: true,
                        text: text
                    }, function (err, responseStatus) {
                        if (err) {
                            return cb(err, responseStatus);
                        }
                        cb(null, responseStatus);
                    });
                });
            });
        }, function () {
            cb('missing_translations');
        });
    };

    return Mail;
});
