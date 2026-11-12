const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const app = express();
const production = process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(origin => origin.trim()).filter(Boolean);
if (production && !allowedOrigins.length) {
  throw new Error('Production requires CORS_ORIGINS to contain the deployed frontend origin.');
}
app.disable('x-powered-by');
app.use(cors({
  origin(origin, callback) {
    if (!origin || (!production && !allowedOrigins.length) || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed.'));
  },
}));
app.use(express.json({ limit: '7mb' }));
app.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
app.use('/data/uploads', express.static(path.join(__dirname, 'uploads'), { dotfiles: 'deny', index: false }));
app.use('/data/users', require('./data/users'));
app.use('/data/properties', require('./data/properties'));
app.use('/data/bookings', require('./data/bookings'));
app.use('/data/admin', require('./data/admin'));
app.use((req, res) => res.status(404).json({ error: 'Not found.' }));
app.use((error, req, res, next) => {
  const status = error.type === 'entity.too.large' ? 413 : error instanceof SyntaxError && error.status === 400 ? 400 : 500;
  res.status(status).json({ error: status === 413 ? 'File too large.' : status === 400 ? 'Invalid request.' : 'Unable to complete the database operation.' });
});
module.exports = app;
