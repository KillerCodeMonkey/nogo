define(function () {
    'use strict';

    return {
        port: '8888',
        host: 'http://localhost',
        secret: 'z}#{T=s40-;{Z?qnK.)7üflZ{O?}I=b-}ö;%:__H',
        tokenExpiresInSeconds: 120 * 60,
        isDev: true,
        permissions: {
            'admin': 'admin',
            'user': 'user' // enduser = user
        },
        defaultLanguage: 'de'
    };
});
