const IssueRequest = require('../models/IssueRequest');

// Check if user is logged in
const isLoggedIn = (req, res, next) => {
  if (req.session && req.session.user) {
    res.locals.currentUser = req.session.user;
    return next();
  }
  req.flash('error', 'Please log in to access this page.');
  res.redirect('/auth/login');
};

// Check user role permission
const hasRole = (...roles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      req.flash('error', 'Please log in to continue.');
      return res.redirect('/auth/login');
    }

    if (roles.includes(req.session.user.role)) {
      return next();
    }

    req.flash('error', 'Unauthorized access! You do not have permission to view that resource.');
    
    // Redirect user to their appropriate dashboard based on role
    const userRole = req.session.user.role;
    if (userRole === 'admin') {
      return res.redirect('/admin/dashboard');
    } else if (userRole === 'lab_incharge') {
      return res.redirect('/labincharge/dashboard');
    } else {
      return res.redirect('/requester/browse');
    }
  };
};

// Automatic overdue checker to keep request statuses updated
const updateOverdueRequests = async (req, res, next) => {
  try {
    const now = new Date();
    await IssueRequest.updateMany(
      {
        status: { $in: ['Approved', 'Issued'] },
        expectedReturnDate: { $lt: now }
      },
      {
        $set: { status: 'Overdue' }
      }
    );
  } catch (err) {
    console.error('Error updating overdue requests:', err);
  }
  if (next) next();
};

module.exports = {
  isLoggedIn,
  hasRole,
  updateOverdueRequests
};
