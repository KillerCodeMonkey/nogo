module.exports = {
    port: '8888',
    host: 'http://localhost',
    secret: (process.env.SECRET_KEY || 'z}#{T=s40-;{Z?qnK.)7üflZ{O?}I=b-}ö;%:__H'),
    tokenExpiresInSeconds: 120 * 60,
    permissions: {
        'admin': 'admin',
        'user': 'user' // enduser = user
    },
    defaultLanguage: 'de'
};
