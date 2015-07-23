/*global process, exports, module*/
// require require.js and store it in require variable
// every call to require will first trigger require.js
// and then nodes require if dependency isn't found
var require = require('requirejs');

// require config with some shorthands to heavily used
// require modules.
require.config({
    baseUrl: process.cwd(),
    paths: {
        appConfig: 'config/app',
        databaseConfig: 'config/database'
    }
});

module.exports = require;