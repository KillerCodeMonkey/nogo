/*global module, grunt, require:true*/
/*jslint vars:true*/
/* istanbul ignore next */
require('app-module-path').addPath(__dirname);
/* istanbul ignore next */
module.exports = function (grunt) {
    'use strict';

    var dbconfig = require('config/database'),
        System = require('util/system');

    var DBPATH = dbconfig.dbpath;
    grunt.file.mkdir(DBPATH);

    var db = grunt.option('target');

    var reporter = grunt.option('reporter');

    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-apidoc');

    grunt.initConfig({
        mochaTest: {
            test: {
                options: {
                    timeout: 10000,
                    reporter: reporter || 'spec'
                },
                src: ['tests/*/*.js']
            }
        },

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
            coverage: {
                command: 'node_modules/.bin/istanbul cover --report lcovonly grunt tests --hook-run-in-context'
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
            },

            doc: {
                command: [
                    'rm -rf docs',
                    'jsdoc appServer.js endpoints/*.js -d docs'
                ].join('&&')
            }
        },

        jsdoc: {
            dist: {
                src: ['endpoints/*.js'],
                options: {
                    destination: 'doc'
                }
            }
        },

        clean: {
            db: ['static/' + db],
            staticPublic: ['static/public'],
            mongo: [DBPATH],
            all: ['static/*']
        }
    });

    /*jslint regexp:true*/
    var buildParams = function (flags) {
        var params = {};

        flags.forEach(function (flag) {
            var truematch = /--([^\s=]+)$/.exec(flag);

            if (truematch) {
                params[truematch[1]] = true;
                return;
            }

            var nomatch = /--no-([^\s=]+)$/.exec(flag);

            if (nomatch) {
                params[nomatch[1]] = false;
                return;
            }

            var match = /--([^\s=]+)=([^\s=]+)/.exec(flag);
            if (match) {
                params[match[1]] = match[2];
            }
        });

        return params;
    };
    /*jslint regexp:false*/

    var reinstall = function () {
        var flags = grunt.option.flags();
        var params = buildParams(flags);

        var done = this.async();
        var init = require('util/democontent');

        init(params).then(function () {
            done();
        }, grunt.log.error);
    };

    var createSystem = function () {
        var flags = grunt.option.flags();
        var params = buildParams(flags);

        params.username = params.username || 'test';
        params.password = params.password || '1234';

        var done = this.async();
        System.createSystem(params.username, params.password).then(function () {
            done();
        }, grunt.log.error);
    };

    grunt.registerTask('initSystem', createSystem);
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
    grunt.registerTask('tests', ['mochaTest']);
    grunt.registerTask('default', 'exec:startPM2Cron');
};
