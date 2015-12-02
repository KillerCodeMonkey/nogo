var expect = require('expect.js'),
    proxyquire = require('proxyquire'),
    Promise = require('bluebird'),
    validationMiddleware = require('../../middleware/validation'),
    action1 = {
        params: {}
    },
    action2 = {
        params: {
            name: {
                type: String,
                regex: /^\d+$/,
                validate: function (param) {
                    if (param === '1234') {
                        return true;
                    }
                    return false;
                },
                query: true
            },
            name2: {
                type: String,
                notEmpty: true
            },
            test: {
                type: Boolean,
                notEmpty: true,
                optional: true
            }
        }
    };

describe('Validation middleware', function () {
    'use strict';

    it('200 - no custom request data --> push trough', function (done) {
        return validationMiddleware({
        }, {}, function (err) {
            if (err) {
                return done(err);
            }
            return done();
        });
    });
    it('200 - no custom action in request data --> push trough', function (done) {
        return validationMiddleware({
            customData: {}
        }, {}, function (err) {
            if (err) {
                return done(err);
            }
            return done();
        });
    });
    it('200 - no params in action', function (done) {
        var req = {
            customData: {
                action: action1
            },
            query: {
                'test': true
            }
        };
        return validationMiddleware(req, {}, function (err) {
            if (err) {
                return done(err);
            }
            expect(Object.keys(req.customData.params).length).to.be(0);
            return done();
        });
    });
    it('200 - params in action', function (done) {
        var req = {
            customData: {
                action: action2
            },
            query: {
                'name': '1234'
            },
            body: {
                'name2': 'rotz'
            }
        };
        return validationMiddleware(req, {}, function (err) {
            if (err) {
                return done(err);
            }
            expect(Object.keys(req.customData.params).length).to.be(2);
            return done();
        });
    });
    it('400 - missing required param', function (done) {
        var req = {
            customData: {
                action: action2
            },
            query: {
                'name': '1234'
            },
            body: {}
        };
        return validationMiddleware(req, {}, function (err) {
            if (!err) {
                return done(new Error('failed'));
            }
            expect(err.param).to.be('name2');
            expect(err.name).to.be('missing_parameter');
            expect(err.status).to.be(400);
            return done();
        });
    });
    it('400 - type error', function (done) {
        var req = {
            customData: {
                action: action2
            },
            query: {
                'name': '1234'
            },
            body: {
                'name2': 1234
            }
        };
        return validationMiddleware(req, {}, function (err) {
            if (!err) {
                return done(new Error('failed'));
            }
            expect(err.param).to.be('name2');
            expect(err.name).to.be('wrong_type');
            expect(err.status).to.be(400);
            return done();
        });
    });
    it('400 - invalid structure --> regex failed', function (done) {
        var req = {
            customData: {
                action: action2
            },
            query: {
                'name': '()/&%%'
            },
            body: {
                'name2': '1234'
            }
        };
        return validationMiddleware(req, {}, function (err) {
            if (!err) {
                return done(new Error('failed'));
            }
            expect(err.param).to.be('name');
            expect(err.name).to.be('invalid_structure');
            expect(err.status).to.be(400);
            return done();
        });
    });
    it('400 - custom validation function failed', function (done) {
        var req = {
            customData: {
                action: action2
            },
            query: {
                'name': '1122'
            },
            body: {
                'name2': '1234'
            }
        };
        return validationMiddleware(req, {}, function (err) {
            if (!err) {
                return done(new Error('failed'));
            }
            expect(err.param).to.be('name');
            expect(err.name).to.be('custom_validation');
            expect(err.status).to.be(400);
            return done();
        });
    });
    it('400 - is empty but notEmpty is set', function (done) {
        var req = {
            customData: {
                action: action2
            },
            query: {
                'name': '1234'
            },
            body: {
                'name2': '1234',
                'test': null
            }
        };
        return validationMiddleware(req, {}, function (err) {
            if (!err) {
                return done(new Error('failed'));
            }
            expect(err.param).to.be('test');
            expect(err.name).to.be('missing_parameter');
            expect(err.status).to.be(400);
            return done();
        });
    });
});
