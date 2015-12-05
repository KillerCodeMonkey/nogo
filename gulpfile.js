var gulp = require('gulp'),
    exec = require('child_process').exec,
    dbconfig = require('./config/database'),
    fs = require('fs-extra'),
    democontent = require('./util/democontent'),
    DBPATH = dbconfig.dbpath,

    commands = {
        killDB: 'killall mongod || true',
        startDB: 'mongod -v --port=' + dbconfig.port + ' --storageEngine wiredTiger --dbpath=' + path.normalize(DBPATH) + ' --logpath=' + path.normalize(DBPATH + '/server1.log') + '--logappend --journal --smallfiles&',
        setDBPermissions: 'chown -cR mongodb ' + path.normalize(DBPATH) + ' && ' + 'chgrp -cR mongodb ' + path.normalize(DBPATH),
        repairDB: 'mongod --repair --dbpath ' + path.normalize(DBPATH)
    };

// crearte db-folder if not already there
fs.mkdirsSync(path.resolve(process.cwd(), DBPATH);

gulp.task('repairDB', function (cb) {
    exec([commands.killDB, commands.setDBPermissions, commands.repairDB, commands.startDB].join('&&'), function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
});

gulp.task('killDB', function (cb) {
    exec(commands.killDB, function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
});

gulp.task('startDB', function (cb) {
    exec(commands.killDB, function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
});

gulp.task('repairDB', function (cb) {
    exec([commands].join('&&'), function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
});

gulp.task('democontent', function (cb) {
    // do not allow to remove static public and dropping database data on production system
    if (process.env.NODE_ENV === 'production') {
        throw 'Not allowed on live system ;)';
    }
    // remove public files
    fs.remove(path.resolve([process.cwd(), '/static/public']), function () {
        // drop old db collections --> create fresh demodata
        democontent().then(cb, cb);
    });
});
