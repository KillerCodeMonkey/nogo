const _ = require('underscore'),
    middleware = function (req, res, next) {
        let action = req.customData.action,
            query = req.query,
            pager = {},
            validFilter = {};

        // if no action --> go on with next
        if (!action || !action.pager) {
            return next();
        }

        // build up pager object
        pager.page = query.page ? parseInt(query.page, 10) : undefined; // requested pager
        pager.limit = query.limit ? parseInt(query.limit, 10) : undefined; // number of entries per page
        pager.skip = pager.limit && pager.page ? pager.limit * (pager.page - 1) : undefined; // calculate skip value
        pager.filter = query.filter ? query.filter instanceof Array ? query.filter : [query.filter] : []; // set filter
        pager.value = query.value ? query.value instanceof Array ? query.value : [query.value] : []; // filter value
        pager.orderBy = query.orderBy || undefined; // orderBy
        pager.orderDesc = query.orderDesc && query.orderBy ? query.orderDesc === 'true' || query.orderDesc === '1' ? true : false : undefined; // sortOrder

        _.each(pager.filter, function (filter, index) {
            if (pager.value[index]) {
                if (!validFilter[filter]) {
                    validFilter[filter] = pager.value[index];
                } else {
                    if (!(validFilter[filter] instanceof Array)) {
                        validFilter[filter] = [validFilter[filter]];

                    }
                    if (validFilter[filter].indexOf(pager.value[index]) === -1) {
                        validFilter[filter].push(pager.value[index]);
                    }
                }
            }
        });
        pager.filter = validFilter;
        delete pager.value;

        req.customData.pager = pager;

        next();
    };

module.exports = middleware;
