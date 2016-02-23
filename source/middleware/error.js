module.exports = function (err, req, res, next) {
    if (err.status) {
        return res.status(err.status).send({
            error: err.name,
            param: err.param,
            message: err.message
        });
    }
    return res.status(500).send({
        error: err
    });
};
