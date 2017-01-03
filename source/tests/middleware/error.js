const request = require('supertest'),
    expect = require('expect.js'),
    errorMiddleware = require('../../middleware/error'),
    resMock = {
        currentStatus: null,
        status: function (status) {
            this.currentStatus = status;
            return {
                send: function (content) {
                    return content;
                }
            };
        }
    };

describe('Error Middleware', function () {
    'use strict';

    it('defined status', function (done) {
        const result = errorMiddleware({
            status: 404,
            name: 'lenz',
            message: 'hui',
            param: 'name'
        }, {}, resMock);

        expect(result).to.be.an('object');
        expect(result.error).to.be('lenz');
        expect(result.param).to.be('name');
        expect(result.message).to.be('hui');
        expect(resMock.currentStatus).to.be(404);
        done();
    });
    it('not defined status', function (done) {
        const result = errorMiddleware({
            name: 'lenz',
            message: 'hui',
            param: 'name'
        }, {}, resMock);

        expect(result).to.be.an('object');
        expect(result.error).to.be.an('object');
        expect(result.error.name).to.be('lenz');
        expect(result.error.message).to.be('hui');
        expect(result.error.param).to.be('name');
        expect(resMock.currentStatus).to.be(500);
        done();
    });
});
