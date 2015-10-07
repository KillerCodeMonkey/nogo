/* global define, process */
define([
    'agenda',
    'databaseConfig'
], function (Agenda, databaseConfig) {
    'use strict';

    var agenda = new Agenda({
        name: 'api cronjobs',
        db: {
            address: databaseConfig.host + ':' + databaseConfig.port + '/agenda?autoReconnect=true'
        }
    });

    if (process.argv.indexOf('-cron') !== -1) {
        agenda.start();
    }

    function graceful() {
        // correctly exit agenda, if process is shutting down.
        agenda.stop(function () {
            process.exit(0);
        });
    }

    process.on('SIGTERM', graceful);
    process.on('SIGINT', graceful);

    // return agenda object
    return agenda;
});
