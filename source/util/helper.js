var path = require('path'),
    Promise = require('bluebird'),
    _ = require('underscore');

function regExpEscape(val) {
    return val.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
}

module.exports = {
    queryFormatter: {
        bool: function (val) {
            if (val === 'true' || val === 1 || val === '1') {
                return true;
            }
            return false;
        },
        isDate: function (val) {
            val = parseInt(val, 10);
            return !isNaN(Date.parse(new Date(val)));
        },
        string: function (val, regex) {
            if (regex) {
                return new RegExp('^' + regExpEscape(val.toString()), 'i');
            }
            return val.toString();
        },
        array: function (val, empty, selector, key) {
            if (empty) {
                var temp = {},
                    temp2 = {};
                if (!selector.$or) {
                    selector.$or = [];
                }
                temp[key] = {
                    $in: val instanceof Array ? val : [val]
                };

                selector.$or.push(temp);
                temp2[key] = {
                    $size: 0
                };
                selector.$or.push(temp2);
                return selector.$or;
            }
            return {
                $in: val instanceof Array ? val : [val]
            };
        },
        greater: function (val, equal) {
            if (equal) {
                return {
                    $gte: val
                };
            }
            return {
                $gt: val
            };
        },
        less: function (val, equal) {
            if (equal) {
                return {
                    $lte: val
                };
            }
            return {
                $lt: val
            };
        },
        greaterAndLess: function (val, equal) {
            if (equal) {
                return {
                    $gte: val,
                    $lt: val
                };
            }
            return {
                $gt: val,
                $lt: val
            };
        },
        lessAndGreater: function (val, equal) {
            if (equal) {
                return {
                    $gt: val,
                    $lte: val
                };
            }
            return {
                $gt: val,
                $lt: val
            };
        },
        exists: function (selector, key) {
            var temp = {},
                temp2 = {};

            if (!selector.$or) {
                selector.$or = [];
            }
            temp[key] = {
                $ne: null
            };

            selector.$or.push(temp);
            temp2[key] = {
                $size: 0
            };
            selector.$or.push(temp2);
            return selector.$or;
        }
    },
    generateRandomString: function (length) {
        length = length ? -length : -8;
        return Math.random().toString(36).slice(length);
    },
    regExpEscape: regExpEscape,
    getPage: function (Model, selector, populates, limiting, skipping, selecting, sorting, sortDesc, slices, projections) {
        var options = [],
            finalPopulates = [],
            project = {};

        // Build up query for Pager
        selector = selector || {};
        options.push({
            $match: selector
        });

        if (populates && populates.length) {
            _.each(populates, function (populating) {
                finalPopulates.push(populating);
            });
        }
        if (slices && slices.length) {
            _.each(slices, function (slice) {
                if (slice.path && slice.value) {
                    project[slice.path] = {
                        $slice: ['$' + slice.path, slice.value]
                    };
                }
            });
        }
        if (selecting) {
            var fields = selecting.split(' ');

            _.each(fields, function (field) {
                project[field] = 1;
            });
        }
        if (projections) {
            _.each(projections, function (projection) {
                options.push({
                    $project: projection
                });
            });
        }
        if (sorting) {
            var sort = {
                $sort: {}
            };
            if (typeof sorting === 'object') {
                sort.$sort = sorting;
            } else {
                sort.$sort[sorting] = sortDesc ? -1 : 1;
            }

            options.push(sort);
        }

        if (selecting) {
            options.push({
                $project: project
            });
        }

        if (limiting) {
            options.push({
                $limit: limiting + (skipping || 0)
            });
        }

        if (skipping) {
            options.push({
                $skip: skipping
            });
        }
        return new Promise(function (resolve, reject) {
            Model
                .aggregate(options)
                .exec(function (error, result) {
                    if (error) {
                        return reject(error);
                    }
                    Model
                        .populate(result, finalPopulates, function (err, documents) {
                            if (err) {
                                return reject(err);
                            }
                            Model.count(selector).exec(function (err, counter) {
                                if (err) {
                                    return reject(err);
                                }
                                resolve([documents, counter]);
                            });
                        });
                });
        });
    }
};
