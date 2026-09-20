const Asset = require('../models/Asset');
const User = require('../models/User');
const IssueRequest = require('../models/IssueRequest');
const MaintenanceLog = require('../models/MaintenanceLog');
const { validationResult } = require('express-validator');

// GET Admin Dashboard
const getDashboard = async (req, res) => {
  try {
    const totalAssetsCount = await Asset.countDocuments();
    const assets = await Asset.find();
    
    let totalUnits = 0;
    let availableUnits = 0;
    assets.forEach(a => {
      totalUnits += a.totalQuantity;
      availableUnits += a.availableQuantity;
    });

    // Currently issued or overdue requests
    const activeIssuedRequests = await IssueRequest.find({
      status: { $in: ['Issued', 'Approved', 'Overdue'] }
    }).populate('asset requester approvedBy');

    let totalIssuedUnits = 0;
    activeIssuedRequests.forEach(r => {
      totalIssuedUnits += r.quantity;
    });

    // Overdue items
    const overdueRequests = await IssueRequest.find({ status: 'Overdue' })
      .populate('asset requester approvedBy')
      .sort({ expectedReturnDate: 1 });

    // Damaged or Lost assets
    const damagedLostAssets = await Asset.find({ condition: { $in: ['Damaged', 'Lost'] } });
    
    // Requests returned as Damaged or Lost
    const damagedLostReturns = await IssueRequest.find({
      conditionOnReturn: { $in: ['Damaged', 'Lost'] }
    }).populate('asset requester');

    res.render('admin/dashboard', {
      title: 'Admin Global Dashboard - Lab Tracking System',
      stats: {
        totalAssetsCount,
        totalUnits,
        totalIssuedUnits,
        availableUnits,
        overdueCount: overdueRequests.length,
        damagedLostCount: damagedLostAssets.length + damagedLostReturns.length
      },
      overdueRequests,
      damagedLostAssets,
      damagedLostReturns
    });
  } catch (err) {
    console.error('Admin Dashboard Error:', err);
    res.status(500).send(`
      <!DOCTYPE html><html><head><title>Dashboard Error</title>
      <style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#1a1a2e;color:#fff;}
      .box{text-align:center;padding:2rem}.box h2{color:#ef4444}.box pre{text-align:left;background:#2d2d4e;padding:1rem;border-radius:8px;overflow:auto;font-size:12px;}
      .box a{color:#6c63ff;text-decoration:none;font-weight:bold;}</style></head>
      <body><div class="box"><h2>Dashboard Error</h2><p>${err.message}</p><a href="/auth/login">← Go to Login</a></div></body></html>
    `);
  }
};

// GET Assets List
const getAssets = async (req, res) => {
  try {
    const assets = await Asset.find().sort({ createdAt: -1 });
    res.render('admin/assets-list', {
      title: 'Manage Assets - Admin',
      assets
    });
  } catch (err) {
    console.error('Error fetching assets:', err);
    req.flash('error', 'Failed to fetch equipment catalog.');
    res.redirect('/admin/dashboard');
  }
};

// GET New Asset Form
const getNewAsset = (req, res) => {
  res.render('admin/asset-form', {
    title: 'Add New Asset - Admin',
    isEdit: false,
    asset: {},
    errors: []
  });
};

// POST Create Asset
const postCreateAsset = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('admin/asset-form', {
      title: 'Add New Asset - Admin',
      isEdit: false,
      asset: req.body,
      errors: errors.array()
    });
  }

  const { assetTag, name, category, labLocation, totalQuantity, availableQuantity, condition, description } = req.body;

  try {
    const existingAsset = await Asset.findOne({ assetTag: assetTag.trim().toUpperCase() });
    if (existingAsset) {
      return res.status(400).render('admin/asset-form', {
        title: 'Add New Asset - Admin',
        isEdit: false,
        asset: req.body,
        errors: [{ msg: 'An asset with this Asset Tag already exists.' }]
      });
    }

    const newAsset = new Asset({
      assetTag: assetTag.trim().toUpperCase(),
      name,
      category,
      labLocation,
      totalQuantity: parseInt(totalQuantity, 10),
      availableQuantity: availableQuantity !== undefined ? parseInt(availableQuantity, 10) : parseInt(totalQuantity, 10),
      condition: condition || 'OK',
      description
    });

    await newAsset.save();
    req.flash('success', `Asset '${newAsset.name}' (${newAsset.assetTag}) created successfully!`);
    res.redirect('/admin/assets');
  } catch (err) {
    console.error('Create Asset Error:', err);
    req.flash('error', 'Failed to create asset.');
    res.redirect('/admin/assets/new');
  }
};

// GET Edit Asset Form
const getEditAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      req.flash('error', 'Asset not found.');
      return res.redirect('/admin/assets');
    }
    res.render('admin/asset-form', {
      title: `Edit Asset: ${asset.name} - Admin`,
      isEdit: true,
      asset,
      errors: []
    });
  } catch (err) {
    console.error('Edit Asset Form Error:', err);
    req.flash('error', 'Error opening edit form.');
    res.redirect('/admin/assets');
  }
};

// PUT Update Asset
const putUpdateAsset = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('admin/asset-form', {
      title: 'Edit Asset - Admin',
      isEdit: true,
      asset: { _id: req.params.id, ...req.body },
      errors: errors.array()
    });
  }

  const { assetTag, name, category, labLocation, totalQuantity, availableQuantity, condition, description } = req.body;

  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      req.flash('error', 'Asset not found.');
      return res.redirect('/admin/assets');
    }

    // Check duplicate tag if tag changed
    if (asset.assetTag !== assetTag.trim().toUpperCase()) {
      const existingTag = await Asset.findOne({ assetTag: assetTag.trim().toUpperCase() });
      if (existingTag) {
        return res.status(400).render('admin/asset-form', {
          title: 'Edit Asset - Admin',
          isEdit: true,
          asset: { _id: req.params.id, ...req.body },
          errors: [{ msg: 'Another asset already uses this Asset Tag.' }]
        });
      }
    }

    asset.assetTag = assetTag.trim().toUpperCase();
    asset.name = name;
    asset.category = category;
    asset.labLocation = labLocation;
    asset.totalQuantity = parseInt(totalQuantity, 10);
    asset.availableQuantity = parseInt(availableQuantity, 10);
    asset.condition = condition;
    asset.description = description;

    await asset.save();
    req.flash('success', `Asset '${asset.name}' updated successfully.`);
    res.redirect('/admin/assets');
  } catch (err) {
    console.error('Update Asset Error:', err);
    req.flash('error', 'Failed to update asset.');
    res.redirect('/admin/assets');
  }
};

// DELETE Asset
const deleteAsset = async (req, res) => {
  try {
    const assetId = req.params.id;

    // Check if asset has active requests (Pending, Approved, Issued, Overdue)
    const activeRequestsCount = await IssueRequest.countDocuments({
      asset: assetId,
      status: { $in: ['Pending', 'Approved', 'Issued', 'Overdue'] }
    });

    if (activeRequestsCount > 0) {
      req.flash('error', `Cannot delete asset! There are ${activeRequestsCount} active (Pending/Issued/Overdue) request(s) associated with it.`);
      return res.redirect('/admin/assets');
    }

    const asset = await Asset.findByIdAndDelete(assetId);
    if (asset) {
      req.flash('success', `Asset '${asset.name}' deleted successfully.`);
    } else {
      req.flash('error', 'Asset not found.');
    }
    res.redirect('/admin/assets');
  } catch (err) {
    console.error('Delete Asset Error:', err);
    req.flash('error', 'Failed to delete asset.');
    res.redirect('/admin/assets');
  }
};

// GET User Management
const getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ role: 1, name: 1 });
    res.render('admin/users-list', {
      title: 'User Management - Admin',
      users
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    req.flash('error', 'Failed to retrieve user list.');
    res.redirect('/admin/dashboard');
  }
};

// POST Update User Role & Assigned Lab
const postUpdateUserRole = async (req, res) => {
  const { role, assignedLab } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/admin/users');
    }

    if (role === 'lab_incharge' && (!assignedLab || assignedLab.trim() === '')) {
      req.flash('error', 'Assigned lab location is required for Lab In-charge role.');
      return res.redirect('/admin/users');
    }

    user.role = role;
    user.assignedLab = role === 'lab_incharge' ? assignedLab.trim() : undefined;
    await user.save();

    req.flash('success', `User '${user.name}' role updated to ${role}${user.assignedLab ? ' (' + user.assignedLab + ')' : ''}.`);
    res.redirect('/admin/users');
  } catch (err) {
    console.error('Update User Role Error:', err);
    req.flash('error', 'Failed to update user role.');
    res.redirect('/admin/users');
  }
};

// GET Asset Maintenance Logs & History (Stretch Goal)
const getMaintenanceLogs = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      req.flash('error', 'Asset not found.');
      return res.redirect('/admin/assets');
    }

    const logs = await MaintenanceLog.find({ asset: asset._id })
      .populate('loggedBy')
      .sort({ serviceDate: -1 });

    res.render('admin/maintenance', {
      title: `Maintenance Logs: ${asset.name} - Admin`,
      asset,
      logs,
      errors: []
    });
  } catch (err) {
    console.error('Maintenance Logs Error:', err);
    req.flash('error', 'Failed to load maintenance logs.');
    res.redirect('/admin/assets');
  }
};

// POST Add Maintenance Log (Stretch Goal)
const postAddMaintenanceLog = async (req, res) => {
  const { serviceDate, cost, notes, nextServiceDue } = req.body;
  const assetId = req.params.id;

  try {
    const asset = await Asset.findById(assetId);
    if (!asset) {
      req.flash('error', 'Asset not found.');
      return res.redirect('/admin/assets');
    }

    const newLog = new MaintenanceLog({
      asset: assetId,
      serviceDate: serviceDate || new Date(),
      cost: cost ? parseFloat(cost) : 0,
      notes,
      nextServiceDue: nextServiceDue || null,
      loggedBy: req.session.user.id
    });

    await newLog.save();
    req.flash('success', 'Maintenance record added successfully!');
    res.redirect(`/admin/assets/${assetId}/maintenance`);
  } catch (err) {
    console.error('Add Maintenance Error:', err);
    req.flash('error', 'Failed to add maintenance log.');
    res.redirect(`/admin/assets/${assetId}/maintenance`);
  }
};

module.exports = {
  getDashboard,
  getAssets,
  getNewAsset,
  postCreateAsset,
  getEditAsset,
  putUpdateAsset,
  deleteAsset,
  getUsers,
  postUpdateUserRole,
  getMaintenanceLogs,
  postAddMaintenanceLog
};
