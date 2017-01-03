function filterParams(req, action) {
    let paramsWhitelist = action.params,
        whitelistParam,
        paramValue,
        type,
        filteredParams = {};
    // check all actions params
    for (whitelistParam in paramsWhitelist) {
        if (paramsWhitelist.hasOwnProperty(whitelistParam)) {
            type = '';
            // get param from body or query
            if (paramsWhitelist[whitelistParam].query === true) {
                paramValue = req.query[whitelistParam];
            } else {
                paramValue = req.body[whitelistParam];
            }
            // if defined or not optional -> validate
            if (paramValue !== undefined || !paramsWhitelist[whitelistParam].optional) {
                // validate missing params
                if ((paramValue === undefined || paramValue === null || paramValue === '' || !paramValue.toString().replace(/\s/g, '').length) && !paramsWhitelist[whitelistParam].optional) {    // necessary param missing
                    type = 'missing_parameter';
                } else if (paramValue && paramValue.constructor !== paramsWhitelist[whitelistParam].type) { // validate param type
                    type = 'wrong_type';
                } else if (paramsWhitelist[whitelistParam].hasOwnProperty('regex') && !paramsWhitelist[whitelistParam].regex.test(paramValue)) {
                    type = 'invalid_structure'; // validate param for custom regex
                } else if (paramsWhitelist[whitelistParam].hasOwnProperty('validate') && !paramsWhitelist[whitelistParam].validate(paramValue)) {
                    type = 'custom_validation'; // validate param for custom validate function
                } else if (paramsWhitelist[whitelistParam].hasOwnProperty('notEmpty') && (paramValue === null || paramValue === '' || !paramValue.toString().replace(/\s/g, '').length)) {
                    type = 'missing_parameter'; // validate param for notEmpty (should not be empty string, null or contains only spaces)
                }
                // if error type is set -> throw error
                if (type) {
                    throw {
                        error: type,
                        param: whitelistParam
                    };
                }
                // set validated param
                filteredParams[whitelistParam] = paramValue;
            }
        }
    }

    return filteredParams;
}
const RequestError = require('../util/error').RequestError,
    middleware = function (req, res, next) {

    if (req.customData && req.customData.action) {
        try {
            req.customData.params = filterParams(req, req.customData.action);
        } catch (e) {
            return next(new RequestError(e.error, 400, e.param));
        }
    }
    next();
};

module.exports = middleware;
