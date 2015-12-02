function startAppServer() {
    var path = require('path'),
        express = require('express'),
        bodyParser = require('body-parser'),
        methodOverride = require('method-override'),
        errorHandler = require('errorhandler'),
        busboy = require('connect-busboy'),
        mongoose = require('mongoose'),
        appConfig = require('./config/app'),
        databaseConfig = require('./config/database'),
        action = require('./middleware/action'),
        validation = require('./middleware/validation'),
        permission = require('./middleware/permission'),
        execute = require('./middleware/execute'),
        error = require('./middleware/error'),
        authentication = require('./middleware/authentication'),
        cors = require('cors'),
        app = express(),
        server,
        // DB connection
        connection = mongoose.createConnection(databaseConfig.host, databaseConfig.dbname, databaseConfig.port);
    // use unified promises through the app.
    mongoose.Promise = require('bluebird');

    connection.on('open', function () {
        console.info('DB connected');
    });

    connection.on('error', function () {
        console.log(arguments);
        console.error('DB exit!');
    });

    // close db connection if process is killed
    process.on('SIGTERM', function () {
        if (connection) {
            connection.close();
        }
    });
    process.on('SIGINT', function () {
        if (connection) {
            connection.close();
        }
    });

    // Config
    app.use(cors());
    app.use(bodyParser.json({
        limit: 1024 * 1024 * 10 // extend content length limit for possible base64 uploads
    })); // support for json requests
    app.use(bodyParser.urlencoded({
        extended: true,
        limit: 1024 * 1024 * 10 // extend content length limit for possible base64 uploads
    })); // support for ordinary form-data requests
    app.use(busboy());
    app.use(methodOverride()); // HTTP PUT and DELETE support
    app.use(express.static(path.join(process.cwd(), 'static', 'public'), {
        maxage: 2592000000 // set max-cache to 30d
    })); // static file server
    app.use(errorHandler({ dumpExceptions: true, showStack: true })); // error stacks
    app.use(function (req, res, next) {
        req.db = connection; // set db on req
        next();
    });
    app.use(authentication); // use authentication middleware
    // Launch server
    server = app.listen(appConfig.port, function () {
        console.info('Listening on port %d', server.address().port);
    });

    /**
     * @function api
     * @description Checks if api is online
     * @property /api - url
     * @property {GET} Method - request method
     * @property Authorization - set request header Authorization: TOKENTYPE ACCESSTOKEN
     * @return {string} api_online - returned as request.text
     */
    app.get('/api', function (req, res) {
        res.send('api_online');
    });
    /**
     * @function api/config
     * @description returns system config
     * @property /api/config - url
     * @property {GET} Method - request method
     * @return {object} systemconfig - system config with default values for e.g. interests, roles, message types
     */
    app.get('/api/config', function (req, res) {
        // deep clone appConfig object
        var resAppConfig = JSON.parse(JSON.stringify(appConfig));

        delete resAppConfig.secret;
        delete resAppConfig.permissions;
        res.send(resAppConfig);
    });

    // set middlewares
    // app.param(['version', 'classname', 'action', 'objectid'], action);
    // set generic provided api class urls
    app.route('/api/:version/:classname/:action?').all(action, validation, permission, execute);
    // set generic provided api object urls
    app.route('/api/:version/:classname/id/:objectid/:action?').all(action, validation, permission, execute);
    // add generic error middleware
    app.use(error);
    return server;
}

module.exports = startAppServer();
