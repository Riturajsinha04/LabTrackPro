const handleDashboardRedirect = (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/auth/login');
  }

  const role = req.session.user.role;
  if (role === 'admin') {
    return res.redirect('/admin/dashboard');
  } else if (role === 'lab_incharge') {
    return res.redirect('/labincharge/dashboard');
  } else {
    return res.redirect('/requester/browse');
  }
};

module.exports = {
  handleDashboardRedirect
};
