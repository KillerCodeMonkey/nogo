function buildMailer() {
    const nodemailer = require('nodemailer'),
        smtpTransport = require('nodemailer-smtp-transport'),
        smtpConfig = require('../config/smtp'),
        Promise = require('bluebird'),
        path = require('path'),
        emailTemplates = require('email-templates'),
        fs = require('fs-extra'),
        appConfig = require('../config/app'),
        templateDir = path.resolve(process.cwd(), 'templates');
    let config = {},
        transport;

    function getTranslations(templateDir, templateName, params, language) {
        return new Promise(function (resolve, reject) {
            fs.stat(templateDir + '/' + templateName + '/translations.js', function (err) {
                if (err) {
                    return reject();
                }
                let fileContent = require(templateDir + '/' + templateName + '/translations');
                if (fileContent[language]) {
                    params.dict = fileContent[language];
                    return resolve();
                }
                reject();
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
        let tasks = [];

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

        tasks.push(getTranslations(this.templateDir, templateName, params, language));

        Promise.all(tasks).then(() => {
            emailTemplates(this.templateDir, (err, template) => {
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
                template(templateName, params, (err, html, text) => {
                    if (err) {
                        return cb(err);
                    }
                    this.transport.sendMail({
                        from: this.config.sender,
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
}
module.exports = buildMailer();
