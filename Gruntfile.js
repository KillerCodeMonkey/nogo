/*global module, grunt, require:true*/
/*jslint vars:true*/
/* istanbul ignore next */
require('app-module-path').addPath(__dirname);
/* istanbul ignore next */
module.exports = function (grunt) {
    'use strict';

    var dbconfig = require('config/database');

    var DBPATH = dbconfig.dbpath;
    grunt.file.mkdir(DBPATH);

    var db = grunt.option('target');

    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-apidoc');

    grunt.initConfig({

        apidoc: {
            myapp: {
                src: 'endpoints/',
                dest: 'apiDoc/'
            },
            options: {
                debug: true,
                includeFilters: [ '.*\\.js$' ],
                excludeFilters: [ 'node_modules/', 'docs/', 'tests/', 'util/', 'templates/', 'cron.js', 'index.js', 'models/', 'apiDoc/', 'middleware/', 'config/' ]
            }
        },

        exec: {
            killDB: {
                command: 'killall mongod || true'
            },
            startDB: {
                command: 'mongod -v --port=' + dbconfig.port + ' --storageEngine wiredTiger --dbpath=' + DBPATH + ' --logpath=' + DBPATH + '/server1.log --logappend --journal --smallfiles&',
                stdout: true,
                stderr: true
            },
            repair: {
                command: [
                    'grunt exec:killDB',
                    'grunt exec:setCorrectPermissions',
                    'grunt exec:repairDB',
                    'grunt exec:startDB'
                ].join('&&')
            },

            install: {
                command: [
                    'grunt exec:killDB',
                    'grunt clean:mongo',
                    'grunt exec:killDB',
                    'grunt exec:startDB'
                ].join('&&')
            },

            setCorrectPermissions: {
                command: [
                    'chown -cR mongodb ' + DBPATH,
                    'chgrp -cR mongodb ' + DBPATH
                ].join('&&')
            },

            repairDB: {
                command: 'mongod --repair --dbpath ' + DBPATH
            },

            startNode: {
                command: 'node index'
            },

            startPM2: {
                command: [
                    'pm2 start index.js --name api'
                ].join('&&')
            },

            startPM2Clustering: {
                command: [
                    'pm2 start index.js --name api -i max'
                ].join('&&')
            },

            startPM2Cron: {
                command: [
                    'pm2 start index.js --name api -- -cron'
                ].join('&&')
            },

            startPM2ClusteringCron: {
                command: [
                    'pm2 start index.js --name api -i max -- -cron'
                ].join('&&')
            },

            reloadPM2: {
                command: [
                    'pm2 reload index.js'
                ].join('&&')
            },

            stopPM2: {
                command: [
                    'pm2 stop index.js'
                ].join('&&')
            },

            restartPM2: {
                command: [
                    'pm2 restart index.js'
                ].join('&&')
            },

            monitorAPIPM2: {
                command: 'pm2 monit api'
            },

            monitorAllPM2: {
                command: 'pm2 monit'
            }
        },
        clean: {
            db: ['static/' + db],
            staticPublic: ['static/public'],
            mongo: [DBPATH],
            all: ['static/*']
        }
    });

    var reinstall = function () {
        var done = this.async();
        var init = require('util/democontent');

        init().then(done, grunt.log.error);
    };

    grunt.registerTask('createcontent', reinstall);
    grunt.registerTask('reinstall', ['clean:staticPublic', 'createcontent']);
    grunt.registerTask('start', ['exec:startNode']);
    grunt.registerTask('startPM2', ['exec:startPM2']);
    grunt.registerTask('startClustering', ['exec:startPM2Clustering']);
    grunt.registerTask('reload', ['exec:reloadPM2']);
    grunt.registerTask('stop', ['exec:stopPM2']);
    grunt.registerTask('restart', ['exec:restartPM2']);
    grunt.registerTask('monit', ['exec:monitorAPIPM2']);
    grunt.registerTask('monitAll', ['exec:monitorAllPM2']);
    grunt.registerTask('default', 'exec:startPM2Cron');
};
