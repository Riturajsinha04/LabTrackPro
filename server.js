require('dotenv').config();
const express = require('express');
const path = require('path');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const cron = require('node-cron');

const connectDB = require('./config/db');
const createSessionConfig = require('./config/session');
const { updateOverdueRequests } = require('./middleware/auth');

// Initialize Express App
const app = express();

const startServer = async () => {
  // Connect Database
  await connectDB();

  // View Engine Setup (EJS)
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  // Body Parser & Form Middlewares
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(methodOverride('_method'));

  // Serve Static Files
  app.use(express.static(path.join(__dirname, 'public')));

  // Session Middleware
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

  // Scheduled Overdue Items Cron Check (Runs every hour)
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Checking and updating overdue asset issue requests...');
    await updateOverdueRequests();
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
    res.status(404).render('auth/login', {
      title: '404 - Page Not Found',
      errors: [{ msg: 'The page you requested could not be found.' }],
      inputData: {}
    });
  });

  // Global Error Handler
  app.use((err, req, res, next) => {
    console.error('[Server Error]', err.stack);
    res.status(500).render('auth/login', {
      title: '500 - Server Error',
      errors: [{ msg: 'An unexpected internal server error occurred.' }],
      inputData: {}
    });
  });

  // Start Server
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Lab Equipment System running on http://localhost:${PORT}`);
    console.log(`====================================================`);
  });
};

startServer();

