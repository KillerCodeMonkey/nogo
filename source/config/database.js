module.exports = {
    dbname: 'nogo',
    host: (process.env.DB_PORT_27017_TCP_ADDR || '127.0.0.1'),
    port: (process.env.DB_PORT_27017_TCP_PORT || '27017'),
    maxConnections: 20,
    dbpath: 'static/db/'
};
