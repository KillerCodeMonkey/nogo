var multer = require('multer'),
    fs = require('fs-extra'),
    path = require('path'),
    RequestError = require('../util/error').RequestError,
    middleware = function (req, res, next) {
        var uploads = [],
            actionFiles,
            createStorage = function (actionFiles) {
                return multer.diskStorage({
                    destination: function (req, file, cb) {
                        var dest = actionFiles.destination;
                        // object request --> object filename exclusion --> create id folder
                        if (req.customData.object && actionFiles.noObject) {
                            dest = path.resolve(dest, req.customData.object._id.toString());
                        }
                        // create destination director if not exists
                        fs.mkdirs(dest, function (err) {
                            if (err) {
                                return cb(err);
                            }
                            cb(null, dest);
                        });
                    },
                    filename: function (req, file, cb) {
                        var ext = actionFiles.noExt ? '' : '.' + file.originalname.split('.').pop(),
                            fileName;

                        // global name
                        if (actionFiles.name) {
                            // use defined action filename
                            return cb(null, actionFiles.name + ext);
                        }
                        // types per field
                        if (actionFiles.fields && Object.keys(actionFiles.fields).length) {
                            // undefined fields are not allowed and blocked by multer --> actionFiles.fields[file.fieldname] exists!
                            fileName = actionFiles.fields[file.fieldname].name;
                            if (fileName) {
                                // use defined field filename
                                return cb(null, fileName + ext);
                            }
                        }
                        // if there is request.object --> use object id
                        if (req.customData.object && !actionFiles.noObject) {
                            return cb(null, req.customData.object._id.toString() + ext);
                        }

                        // no action filename, no object id --> use generated filename (7random numbers and chard + timestamp)
                        return cb(null, '' + Math.random().toString(36).slice(-7) + Date.now() + ext);
                    }
                });
            },
            upload = function (actionFiles) {
                var multerConfig = {
                        storage: createStorage(actionFiles),
                        fileFilter: function (req, file, cb) {
                            var i = 0,
                            fieldTypes;
                            // if there are any restricted types for upload --> check if mimetype matches type
                            if (actionFiles.types && Array.isArray(actionFiles.types) && actionFiles.types.length) {
                                for (i; i < actionFiles.types.length; i = i + 1) {
                                    if (file.mimetype.indexOf(actionFiles.types[i]) !== -1) {
                                        return cb(null, true);
                                    }
                                }
                                return cb(null, false);
                            }
                            // types per field
                            if (actionFiles.fields && Object.keys(actionFiles.fields).length) {
                                // undefined fields are not allowed and blocked by multer --> actionFiles.fields[file.fieldname] exists!
                                fieldTypes = actionFiles.fields[file.fieldname].types;
                                i = 0;
                                if (fieldTypes && Array.isArray(fieldTypes) && fieldTypes.length) {
                                    for (i; i < fieldTypes.length; i = i + 1) {
                                        if (file.mimetype.indexOf(fieldTypes[i]) !== -1) {
                                            return cb(null, true);
                                        }
                                    }
                                    return cb(null, false);
                                }
                            }
                            return cb(null, true);
                        },
                        limits: actionFiles.limit || {
                            fields: 20, // max non-file fields
                            fileSize: 314572800, // 300MB limit
                            files: 20, // max 20 files at once,
                            parts: 40 // max files and fields
                        }
                    },
                    key,
                    fields = [],
                    uploadAction;

                if (actionFiles.field) {
                    // multi file upload for fields
                    if (actionFiles.maxCount && actionFiles.maxCount > 1) {
                        uploadAction = multer(multerConfig).array(actionFiles.field, actionFiles.maxCount);
                    } else {
                        // single file upload for field
                        uploadAction = multer(multerConfig).single(actionFiles.field);
                    }
                } else {
                    for (key in actionFiles.fields) {
                        if (actionFiles.fields.hasOwnProperty(key) && actionFiles.fields[key]) {
                            fields.push({
                                name: key,
                                maxCount: actionFiles.fields[key].maxCount || 1
                            });
                        }
                    }
                    uploadAction = multer(multerConfig).fields(fields);
                }

                return uploadAction(req, res, function (err) {
                    if (err) {
                        return next(new RequestError('upload_failed', 400, null, err));
                    }
                    return next();
                });
            };

        // if no action there or action has no files defined
        if (!req.customData || !req.customData.action || !req.customData.action.files || typeof req.customData.action.files !== 'object') {
            // go on processing
            return next();
        }

        // build up multer uploads for action.files settings
        actionFiles = req.customData.action.files;

        if (!actionFiles || (!actionFiles.field && (!actionFiles.fields || !Object.keys(actionFiles.fields).length)) || !actionFiles.destination) {
            return next();
        }

        // upload
        return upload(actionFiles);
    };

module.exports = middleware;
