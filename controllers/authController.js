const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/User');

// GET Login Page
const getLogin = (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('auth/login', {
    title: 'Login - Lab Equipment Tracking System',
    errors: [],
    inputData: {}
  });
};

// POST Login
const postLogin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('auth/login', {
      title: 'Login - Lab Equipment Tracking System',
      errors: errors.array(),
      inputData: req.body
    });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/auth/login');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/auth/login');
    }

    // Save session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      assignedLab: user.assignedLab
    };

    req.flash('success', `Welcome back, ${user.name}!`);
    
    // Redirect based on role
    if (user.role === 'admin') {
      res.redirect('/admin/dashboard');
    } else if (user.role === 'lab_incharge') {
      res.redirect('/labincharge/dashboard');
    } else {
      res.redirect('/requester/browse');
    }
  } catch (err) {
    console.error('Login error:', err);
    req.flash('error', 'Server error during login.');
    res.redirect('/auth/login');
  }
};

// GET Register Page
const getRegister = (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('auth/register', {
    title: 'Register - Lab Equipment Tracking System',
    errors: [],
    inputData: {}
  });
};

// POST Register
const postRegister = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('auth/register', {
      title: 'Register - Lab Equipment Tracking System',
      errors: errors.array(),
      inputData: req.body
    });
  }

  const { name, email, password, role, assignedLab } = req.body;

  try {
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).render('auth/register', {
        title: 'Register - Lab Equipment Tracking System',
        errors: [{ msg: 'An account with this email address already exists' }],
        inputData: req.body
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'requester',
      assignedLab: role === 'lab_incharge' ? assignedLab : undefined
    });

    await newUser.save();
    req.flash('success', 'Registration successful! Please log in.');
    res.redirect('/auth/login');
  } catch (err) {
    console.error('Register error:', err);
    req.flash('error', 'Failed to register account.');
    res.redirect('/auth/register');
  }
};

// Logout
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/auth/login');
  });
};

module.exports = {
  getLogin,
  postLogin,
  getRegister,
  postRegister,
  logout
};
