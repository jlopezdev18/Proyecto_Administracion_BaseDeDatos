const sql = require('mssql');
require('dotenv').config();

const config = {
    server : process.env.DB_SERVER,
    authentication: {
        type: 'default',
        options: {
            userName: process.env.DB_USER,
            password: process.env.DB_PASSWORD
            
        }
    },
    options: {
        trustServerCertificate: true,
        trustedConnection: true,
        enableArithAbort: true,
        encrypt: false,
        database : 'master',
        port:1433
    },
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then((pool) => {
        console.log('Connected to SQL Server');
        return pool;
    })
    .catch((err) => {
        console.error('Database connection failed!', err);
        process.exit(1);
    });


module.exports = {
    sql,
    poolPromise,
}
