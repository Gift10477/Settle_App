const mysql = require('mysql2');
require('dotenv').config();

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
