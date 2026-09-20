const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');

const createSessionConfig = () => {
  return session({
    secret: process.env.SESSION_SECRET || 'fallback_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      client: mongoose.connection.getClient(),
      collectionName: 'sessions',
      ttl: 24 * 60 * 60 // 1 day
    }),
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      httpOnly: true,
      sameSite: 'lax'
    }
  });
};

module.exports = createSessionConfig;


