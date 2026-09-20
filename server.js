require('dotenv').config();
const express = require('express');
const path = require('path');
const methodOverride = require('method-override');
const flash = require('connect-flash');

const connectDB = require('./config/db');
const createSessionConfig = require('./config/session');

// Initialize Express App
const app = express();

// Trust proxy (required for secure cookies behind Vercel's reverse proxy)
app.set('trust proxy', 1);

// View Engine Setup (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body Parser & Form Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Serve Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Session Middleware (created once, reused across requests)
app.use(createSessionConfig());

// Flash Messages Middleware
app.use(flash());

// Global Variables in Views Middleware
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.messages = {
    success: req.flash('success'),
    error: req.flash('error'),
    info: req.flash('info')
  };
  next();
});

// Import Routes
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const labInchargeRoutes = require('./routes/labInchargeRoutes');
const requesterRoutes = require('./routes/requesterRoutes');

// Mount Routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/labincharge', labInchargeRoutes);
app.use('/requester', requesterRoutes);
app.use('/', dashboardRoutes);

// 404 Page Not Found Handler
app.use((req, res) => {
  res.status(404).send(`
    <!DOCTYPE html><html><head><title>404 - Not Found</title>
    <style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#1a1a2e;color:#fff;}
    .box{text-align:center}.box h1{font-size:4rem;margin:0;color:#6c63ff}.box a{color:#6c63ff;text-decoration:none;font-weight:bold;}</style></head>
    <body><div class="box"><h1>404</h1><p>Page not found</p><a href="/auth/login">← Go to Login</a></div></body></html>
  `);
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack);
  res.status(500).send(`
    <!DOCTYPE html><html><head><title>500 - Server Error</title>
    <style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#1a1a2e;color:#fff;}
    .box{text-align:center}.box h1{font-size:4rem;margin:0;color:#ef4444}.box a{color:#6c63ff;text-decoration:none;font-weight:bold;}</style></head>
    <body><div class="box"><h1>500</h1><p>Something went wrong</p><a href="/auth/login">← Go to Login</a></div></body></html>
  `);
});

// For Vercel: wrap with DB connection per request
const serverlessHandler = async (req, res) => {
  await connectDB();
  return app(req, res);
};

// For local development
if (process.env.NODE_ENV !== 'production') {
  const startServer = async () => {
    await connectDB();

    // Cron jobs only run locally (Vercel is stateless)
    try {
      const cron = require('node-cron');
      const { updateOverdueRequests } = require('./middleware/auth');
      cron.schedule('0 * * * *', async () => {
        console.log('[Cron] Checking and updating overdue asset issue requests...');
        await updateOverdueRequests();
      });
    } catch (e) {
      console.warn('[Cron] Could not start cron:', e.message);
    }

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 Lab Equipment System running on http://localhost:${PORT}`);
      console.log(`====================================================`);
    });
  };

  startServer().catch(console.error);
}

// Export for Vercel
module.exports = serverlessHandler;
