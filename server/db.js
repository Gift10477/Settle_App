const mysql = require('mysql2');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
if (isProduction && (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME)) {
  throw new Error('Production requires DB_HOST, DB_USER, DB_PASSWORD and DB_NAME to be configured.');
}
if (process.env.DB_NAME && process.env.DB_NAME !== 'settlein_se_db') {
  throw new Error('This project requires DB_NAME=settlein_se_db to protect the original database.');
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'settlein_se_db',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool.promise();
