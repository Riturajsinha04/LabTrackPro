const Asset = require('../models/Asset');
const IssueRequest = require('../models/IssueRequest');

// Helper to get asset IDs in the lab incharge's assigned lab
const getLabAssetIds = async (assignedLab) => {
  const assets = await Asset.find({ labLocation: assignedLab }).select('_id');
  return assets.map(a => a._id);
};

// GET Lab In-charge Dashboard
const getDashboard = async (req, res) => {
  const assignedLab = req.session.user.assignedLab;
  try {
    const labAssetIds = await getLabAssetIds(assignedLab);
    const assets = await Asset.find({ labLocation: assignedLab });

    let totalUnits = 0;
    let availableUnits = 0;
    assets.forEach(a => {
      totalUnits += a.totalQuantity;
      availableUnits += a.availableQuantity;
    });

    const pendingRequestsCount = await IssueRequest.countDocuments({
      asset: { $in: labAssetIds },
      status: 'Pending'
    });

    const activeIssued = await IssueRequest.find({
      asset: { $in: labAssetIds },
      status: { $in: ['Issued', 'Approved', 'Overdue'] }
    });

    let totalIssuedUnits = 0;
    activeIssued.forEach(r => totalIssuedUnits += r.quantity);

    const overdueRequests = await IssueRequest.find({
      asset: { $in: labAssetIds },
      status: 'Overdue'
    }).populate('asset requester');

    const recentPendingRequests = await IssueRequest.find({
      asset: { $in: labAssetIds },
      status: 'Pending'
    }).populate('asset requester').sort({ requestDate: -1 }).limit(5);

    res.render('labincharge/dashboard', {
      title: `Lab Dashboard (${assignedLab}) - Lab Equipment System`,
      assignedLab,
      stats: {
        totalAssetsCount: assets.length,
        totalUnits,
        availableUnits,
        totalIssuedUnits,
        pendingRequestsCount,
        overdueCount: overdueRequests.length
      },
      overdueRequests,
      recentPendingRequests
    });
  } catch (err) {
    console.error('Lab Dashboard Error:', err);
    req.flash('error', 'Error loading lab dashboard.');
    res.redirect('/');
  }
};

// GET Pending Requests
const getPendingRequests = async (req, res) => {
  const assignedLab = req.session.user.assignedLab;
  try {
    const labAssetIds = await getLabAssetIds(assignedLab);
    const requests = await IssueRequest.find({
      asset: { $in: labAssetIds },
      status: 'Pending'
    })
    .populate('asset requester')
    .sort({ requestDate: 1 });

    res.render('labincharge/requests', {
      title: `Pending Requests (${assignedLab}) - Lab Equipment System`,
      assignedLab,
      requests
    });
  } catch (err) {
    console.error('Error fetching pending requests:', err);
    req.flash('error', 'Failed to retrieve issue requests.');
    res.redirect('/labincharge/dashboard');
  }
};

// POST Approve Request
const postApproveRequest = async (req, res) => {
  const requestId = req.params.id;
  const assignedLab = req.session.user.assignedLab;

  try {
    const request = await IssueRequest.findById(requestId).populate('asset');
    if (!request) {
      req.flash('error', 'Issue request not found.');
      return res.redirect('/labincharge/requests');
    }

    // Security check: ensure request asset belongs to assignedLab
    if (request.asset.labLocation !== assignedLab) {
      req.flash('error', 'Unauthorized: Request belongs to a different lab.');
      return res.redirect('/labincharge/requests');
    }

    if (request.status !== 'Pending') {
      req.flash('error', `Request is already in '${request.status}' status.`);
      return res.redirect('/labincharge/requests');
    }

    // Atomic update stock: availableQuantity >= requested quantity
    const updatedAsset = await Asset.findOneAndUpdate(
      {
        _id: request.asset._id,
        availableQuantity: { $gte: request.quantity }
      },
      {
        $inc: { availableQuantity: -request.quantity }
      },
      { new: true }
    );

    if (!updatedAsset) {
      req.flash('error', `Cannot approve! Insufficient available quantity for '${request.asset.name}'. (Requested: ${request.quantity}, Available: ${request.asset.availableQuantity})`);
      return res.redirect('/labincharge/requests');
    }

    // Update issue request status
    request.status = 'Issued';
    request.issueDate = new Date();
    request.approvedBy = req.session.user.id;
    await request.save();

    req.flash('success', `Request for '${request.asset.name}' (Qty: ${request.quantity}) approved & issued successfully!`);
    res.redirect('/labincharge/requests');
  } catch (err) {
    console.error('Approve Request Error:', err);
    req.flash('error', 'Failed to approve issue request.');
    res.redirect('/labincharge/requests');
  }
};

// POST Reject Request
const postRejectRequest = async (req, res) => {
  const requestId = req.params.id;
  const { rejectionRemark } = req.body;
  const assignedLab = req.session.user.assignedLab;

  try {
    const request = await IssueRequest.findById(requestId).populate('asset');
    if (!request) {
      req.flash('error', 'Issue request not found.');
      return res.redirect('/labincharge/requests');
    }

    if (request.asset.labLocation !== assignedLab) {
      req.flash('error', 'Unauthorized: Request belongs to a different lab.');
      return res.redirect('/labincharge/requests');
    }

    if (request.status !== 'Pending') {
      req.flash('error', `Request is already in '${request.status}' status.`);
      return res.redirect('/labincharge/requests');
    }

    request.status = 'Rejected';
    request.rejectionRemark = rejectionRemark ? rejectionRemark.trim() : 'Request rejected by Lab In-charge.';
    request.approvedBy = req.session.user.id;
    await request.save();

    req.flash('success', `Request for '${request.asset.name}' was rejected.`);
    res.redirect('/labincharge/requests');
  } catch (err) {
    console.error('Reject Request Error:', err);
    req.flash('error', 'Failed to reject request.');
    res.redirect('/labincharge/requests');
  }
};

// GET Issued / Active Items
const getIssuedItems = async (req, res) => {
  const assignedLab = req.session.user.assignedLab;
  try {
    const labAssetIds = await getLabAssetIds(assignedLab);
    const issuedItems = await IssueRequest.find({
      asset: { $in: labAssetIds },
      status: { $in: ['Issued', 'Approved', 'Overdue'] }
    })
    .populate('asset requester approvedBy')
    .sort({ issueDate: -1 });

    res.render('labincharge/issued-items', {
      title: `Issued Items (${assignedLab}) - Lab Equipment System`,
      assignedLab,
      issuedItems
    });
  } catch (err) {
    console.error('Error fetching issued items:', err);
    req.flash('error', 'Failed to retrieve active issued items.');
    res.redirect('/labincharge/dashboard');
  }
};

// GET Physical Return Form
const getReturnForm = async (req, res) => {
  const requestId = req.params.id;
  const assignedLab = req.session.user.assignedLab;

  try {
    const request = await IssueRequest.findById(requestId).populate('asset requester');
    if (!request) {
      req.flash('error', 'Issue request record not found.');
      return res.redirect('/labincharge/issued-items');
    }

    if (request.asset.labLocation !== assignedLab) {
      req.flash('error', 'Unauthorized: Request belongs to a different lab.');
      return res.redirect('/labincharge/issued-items');
    }

    if (!['Issued', 'Approved', 'Overdue'].includes(request.status)) {
      req.flash('error', `This item cannot be returned because its status is '${request.status}'.`);
      return res.redirect('/labincharge/issued-items');
    }

    res.render('labincharge/return-form', {
      title: `Record Return: ${request.asset.name} - Lab System`,
      request
    });
  } catch (err) {
    console.error('Get Return Form Error:', err);
    req.flash('error', 'Error loading return form.');
    res.redirect('/labincharge/issued-items');
  }
};

// POST Process Physical Return
const postProcessReturn = async (req, res) => {
  const requestId = req.params.id;
  const { conditionOnReturn } = req.body;
  const assignedLab = req.session.user.assignedLab;

  try {
    const request = await IssueRequest.findById(requestId).populate('asset');
    if (!request) {
      req.flash('error', 'Issue request not found.');
      return res.redirect('/labincharge/issued-items');
    }

    if (request.asset.labLocation !== assignedLab) {
      req.flash('error', 'Unauthorized: Asset is not in your assigned lab.');
      return res.redirect('/labincharge/issued-items');
    }

    if (!['Issued', 'Approved', 'Overdue'].includes(request.status)) {
      req.flash('error', 'Item is not currently issued out.');
      return res.redirect('/labincharge/issued-items');
    }

    const asset = request.asset;
    const returnedQty = request.quantity;

    if (conditionOnReturn === 'OK') {
      // Return units back to available stock
      await Asset.findByIdAndUpdate(asset._id, {
        $inc: { availableQuantity: returnedQty }
      });
    } else if (conditionOnReturn === 'Damaged' || conditionOnReturn === 'Lost') {
      // Do NOT restock available stock. Decrement totalQuantity since units are lost/damaged
      const newTotal = Math.max(0, asset.totalQuantity - returnedQty);
      const newAvailable = Math.min(asset.availableQuantity, newTotal);
      
      await Asset.findByIdAndUpdate(asset._id, {
        $set: {
          totalQuantity: newTotal,
          availableQuantity: newAvailable,
          condition: conditionOnReturn
        }
      });
    }

    request.status = 'Returned';
    request.actualReturnDate = new Date();
    request.conditionOnReturn = conditionOnReturn;
    await request.save();

    req.flash('success', `Return recorded for '${asset.name}' (Condition: ${conditionOnReturn}). Stock updated accordingly.`);
    res.redirect('/labincharge/issued-items');
  } catch (err) {
    console.error('Process Return Error:', err);
    req.flash('error', 'Failed to process item return.');
    res.redirect('/labincharge/issued-items');
  }
};

module.exports = {
  getDashboard,
  getPendingRequests,
  postApproveRequest,
  postRejectRequest,
  getIssuedItems,
  getReturnForm,
  postProcessReturn
};
