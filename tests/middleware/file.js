var expect = require('expect.js'),
    stream = require('stream'),
    fs = require('fs-extra'),
    path = require('path'),
    FormData = require('form-data'),
    filesMiddleware = require('../../middleware/file'),
    DEST = path.resolve([process.cwd(), 'tests', 'tmp']),
    IMG = path.resolve([process.cwd(), 'util', 'flyacts.png']);

function formRequest (req, multi, both, cb) {
    var form = new FormData();
    if (!multi || both) {
        form.append('single', fs.createReadStream(IMG));
    }
    if (multi || both) {
        form.append('multi', fs.createReadStream(IMG));
        form.append('multi', fs.createReadStream(IMG));
        form.append('multi', fs.createReadStream(IMG));
    }

    form.getLength(function (err, length) {
        if (err) {
            return cb(err);
        }
        req.complete = false;
        form.once('end', function () {
            req.complete = true;
        });

        form.pipe(req);
        req.headers = {
            'content-type': 'multipart/form-data; boundary=' + form.getBoundary(),
            'content-length': length
        };

        cb(null, req);
    });
}

describe('File middleware', function () {
    'use strict';

    afterEach(function (done) {
        fs.remove(DEST, function () {
            done();
        });
    });

    it('200 - no custom request data --> push trough', function (done) {
        var req = {};
        return filesMiddleware(req, {}, function (err) {
            if (err) {
                return done(err);
            }
            return done();
        });
    });
    it('200 - no custom action in request data --> push trough', function (done) {
        var req = {
            customData: {}
        };
        return filesMiddleware(req, {}, function (err) {
            if (err) {
                return done(err);
            }
            return done();
        });
    });
    it('200 - no action files in request data --> push trough', function (done) {
        var req = {
            customData: {
                action: {}
            }
        };
        return filesMiddleware(req, {}, function (err) {
            if (err) {
                return done(err);
            }
            return done();
        });
    });
    it('200 - action files no array --> push trough', function (done) {
        var req = {
            customData: {
                action: {
                    files: true
                }
            }
        };
        return filesMiddleware(req, {}, function (err) {
            if (err) {
                return done(err);
            }
            return done();
        });
    });
    it('200 - action files no array length --> push trough', function (done) {
        var req = {
            customData: {
                action: {
                    files: []
                }
            }
        };
        return filesMiddleware(req, {}, function (err) {
            if (err) {
                return done(err);
            }
            return done();
        });
    });
    it('200 - action files but no valid file configuration --> push trough', function (done) {
        var req = {
            customData: {
                action: {
                    files: [{
                        field: true
                    }]
                }
            }
        };
        return filesMiddleware(req, {}, function (err) {
            if (err) {
                return done(err);
            }
            return done();
        });
    });
    it('200 - action file but nothing in upload --> push trough', function (done) {
        var req = new stream.PassThrough(),
            form = new FormData();
        req.customData = {
            action: {
                files: {
                    field: 'single',
                    destination: DEST
                }
            }
        };

        form.getLength(function (err, length) {
            if (err) {
                return done(err);
            }
            req.headers = {
                'content-type': 'multipart/form-data; boundary=' + form.getBoundary(),
                'content-length': length
            };
            req.complete = false;
            form.once('end', function () {
                req.complete = true;
            });

            form.pipe(req);
            return filesMiddleware(req, {}, function (err) {
                if (err) {
                    return done(err);
                }
                return done();
            });
        });
    });
    it('200 - action files but nothing in upload --> push trough', function (done) {
        var req = new stream.PassThrough(),
            form = new FormData();
        req.customData = {
            action: {
                files: {
                    field: 'single',
                    destination: DEST,
                    maxCount: 5
                }
            }
        };

        form.getLength(function (err, length) {
            if (err) {
                return done(err);
            }
            req.headers = {
                'content-type': 'multipart/form-data; boundary=' + form.getBoundary(),
                'content-length': length
            };
            req.complete = false;
            form.once('end', function () {
                req.complete = true;
            });

            form.pipe(req);
            return filesMiddleware(req, {}, function (err) {
                if (err) {
                    return done(err);
                }
                return done();
            });
        });
    });
    it('200 - real upload --> generate filename', function (done) {
        var req = new stream.PassThrough();
        req.customData = {
            action: {
                files: {
                    field: 'single',
                    destination: DEST
                }
            }
        };
        formRequest(req, false, false, function (submitError, transformedReq) {
            if (submitError) {
                return done(submitError);
            }
            filesMiddleware(transformedReq, {}, function (err) {
                if (err) {
                    return done(err);
                }
                expect(transformedReq.file).to.be.an('object');
                expect(transformedReq.file.destination).to.be(DEST);
                fs.stat(path.resolve([DEST, transformedReq.file.filename]), function (err) {
                    if (err) {
                        return done(err);
                    }
                    return done();
                });
            });
        });
    });
    it('200 - real upload --> type restricted, no ext --> set filename', function (done) {
        var req = new stream.PassThrough();
        req.customData = {
            action: {
                files: {
                    field: 'single',
                    destination: DEST,
                    name: 'hallo',
                    noExt: true,
                    types: ['image/png']
                }
            }
        };
        return formRequest(req, false, false, function (submitError, transformedReq) {
            if (submitError) {
                return done(submitError);
            }
            return filesMiddleware(transformedReq, {}, function (err) {
                if (err) {
                    return done(err);
                }
                expect(transformedReq.file).to.be.an('object');
                expect(transformedReq.file.filename).to.be('hallo');
                expect(transformedReq.file.destination).to.be(DEST);
                fs.stat(path.resolve([DEST, transformedReq.file.filename]), function (err) {
                    if (err) {
                        return done(err);
                    }
                    return done();
                });
            });
        });
    });
    it('200 - real upload failed wrong type', function (done) {
        var req = new stream.PassThrough();
        req.customData = {
            action: {
                files: {
                    field: 'single',
                    destination: DEST,
                    name: 'hallo',
                    noExt: true,
                    types: ['images/png']
                }
            }
        };
        formRequest(req, false, false, function (submitError, transformedReq) {
            if (submitError) {
                return done(submitError);
            }
            filesMiddleware(transformedReq, {}, function (err) {
                if (err) {
                    return done(err);
                }
                expect(transformedReq.file).to.be(undefined);
                done();
            });
        });
    });
    it('200 - upload file not matching', function (done) {
        var req = new stream.PassThrough();
        req.customData = {
            action: {
                files: {
                    field: 'asd',
                    destination: DEST
                }
            }
        };
        formRequest(req, false, false, function (submitError, transformedReq) {
            if (submitError) {
                return done(submitError);
            }
            filesMiddleware(transformedReq, {}, function (err) {
                if (!err) {
                    return done(new Error('failed'));
                }
                expect(err.status).to.be(400);
                expect(err.name).to.be('upload_failed');
                done();
            });
        });
    });
    it('200 - upload with object id instead of action name', function (done) {
        var req = new stream.PassThrough();
        req.customData = {
            action: {
                files: {
                    field: 'single',
                    destination: DEST
                }
            },
            object: {
                _id: '1234'
            }
        };
        formRequest(req, false, false, function (submitError, transformedReq) {
            if (submitError) {
                return done(submitError);
            }
            filesMiddleware(transformedReq, {}, function (err) {
                if (err) {
                    return done(err);
                }
                expect(transformedReq.file).to.be.an('object');
                expect(transformedReq.file.filename).to.be('1234.png');
                expect(transformedReq.file.destination).to.be(DEST);
                fs.stat(path.resolve([DEST, transformedReq.file.filename]), function (err) {
                    if (err) {
                        return done(err);
                    }
                    return done();
                });
            });
        });
    });
    it('200 - upload multiple', function (done) {
        var req = new stream.PassThrough();
        req.customData = {
            action: {
                files: {
                    field: 'multi',
                    destination: DEST,
                    noObject: true,
                    maxCount: 3
                }
            },
            object: {
                _id: '1234'
            }
        };
        formRequest(req, true, false, function (submitError, transformedReq) {
            if (submitError) {
                return done(submitError);
            }
            filesMiddleware(transformedReq, {}, function (err) {
                if (err) {
                    return done(err);
                }
                expect(transformedReq.file).to.be(undefined);
                expect(transformedReq.files).to.be.an('array');
                expect(transformedReq.files.length).to.be(3);
                done();
            });
        });
    });
    it('200 - differend fields', function (done) {
        var req = new stream.PassThrough();
        req.customData = {
            action: {
                files: {
                    fields: {
                        'multi': {
                            maxCount: 3
                        },
                        'single': {}
                    },
                    destination: DEST,
                    noObject: true
                }
            },
            object: {
                _id: '1234'
            }
        };
        formRequest(req, true, true, function (submitError, transformedReq) {
            if (submitError) {
                return done(submitError);
            }
            filesMiddleware(transformedReq, {}, function (err) {
                if (err) {
                    return done(err);
                }
                expect(transformedReq.file).to.be(undefined);
                expect(transformedReq.files).to.be.an('object');
                expect(transformedReq.files.single.length).to.be(1);
                expect(transformedReq.files.multi.length).to.be(3);
                done();
            });
        });
    });
    it('200 - differend fields wit types', function (done) {
        var req = new stream.PassThrough();
        req.customData = {
            action: {
                files: {
                    fields: {
                        'multi': {
                            maxCount: 3,
                            types: ['image/png']
                        },
                        'single': {
                            types: ['image/png']
                        }
                    },
                    destination: DEST,
                    noObject: true
                }
            },
            object: {
                _id: '1234'
            }
        };
        formRequest(req, true, true, function (submitError, transformedReq) {
            if (submitError) {
                return done(submitError);
            }
            filesMiddleware(transformedReq, {}, function (err) {
                if (err) {
                    return done(err);
                }
                expect(transformedReq.file).to.be(undefined);
                expect(transformedReq.files).to.be.an('object');
                expect(transformedReq.files.single.length).to.be(1);
                expect(transformedReq.files.multi.length).to.be(3);
                done();
            });
        });
    });
    it('200 - differend fields with non matching types', function (done) {
        var req = new stream.PassThrough();
        req.customData = {
            action: {
                files: {
                    fields: {
                        'multi': {
                            maxCount: 3,
                            name: 'test',
                            types: ['image/png']
                        },
                        'single': {
                            types: ['images/png']
                        },
                        'blubb': null
                    },
                    destination: DEST,
                    noObject: true
                }
            },
            object: {
                _id: '1234'
            }
        };
        formRequest(req, true, true, function (submitError, transformedReq) {
            if (submitError) {
                return done(submitError);
            }
            filesMiddleware(transformedReq, {}, function (err) {
                if (err) {
                    return done(err);
                }
                expect(transformedReq.file).to.be(undefined);
                expect(transformedReq.files).to.be.an('object');
                expect(transformedReq.files.single).not.to.be(1);
                expect(transformedReq.files.multi.length).to.be(3);
                expect(transformedReq.files.multi[0].filename).to.be('test.png');
                done();
            });
        });
    });
    it('200 - no fields and field', function (done) {
        var req = new stream.PassThrough();
        req.customData = {
            action: {
                files: {
                    destination: DEST
                }
            },
            object: {
                _id: '1234'
            }
        };
        formRequest(req, false, false, function (submitError, transformedReq) {
            if (submitError) {
                return done(submitError);
            }
            filesMiddleware(transformedReq, {}, function (err) {
                if (err) {
                    return done(err);
                }
                expect(transformedReq.file).to.be(undefined);
                expect(transformedReq.files).to.be(undefined);
                done();
            });
        });
    });
});
