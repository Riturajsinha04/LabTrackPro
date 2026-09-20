const Asset = require('../models/Asset');
const IssueRequest = require('../models/IssueRequest');
const { validationResult } = require('express-validator');

// GET Browse Assets Catalog
const getBrowseAssets = async (req, res) => {
  try {
    const { category, labLocation, search, availableOnly } = req.query;

    const filter = {};
    if (category && category.trim() !== '') {
      filter.category = category.trim();
    }
    if (labLocation && labLocation.trim() !== '') {
      filter.labLocation = labLocation.trim();
    }
    if (availableOnly === 'true') {
      filter.availableQuantity = { $gt: 0 };
    }
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { assetTag: searchRegex },
        { description: searchRegex }
      ];
    }

    const assets = await Asset.find(filter).sort({ name: 1 });
    const categories = await Asset.distinct('category');
    const labLocations = await Asset.distinct('labLocation');

    res.render('requester/browse-assets', {
      title: 'Browse Equipment & Assets - Requester Portal',
      assets,
      categories,
      labLocations,
      queryFilters: {
        category: category || '',
        labLocation: labLocation || '',
        search: search || '',
        availableOnly: availableOnly === 'true'
      }
    });
  } catch (err) {
    console.error('Error browsing assets:', err);
    req.flash('error', 'Failed to load asset catalog.');
    res.redirect('/');
  }
};

// GET Issue Request Form
const getRequestForm = async (req, res) => {
  const assetId = req.params.assetId;
  try {
    const asset = await Asset.findById(assetId);
    if (!asset) {
      req.flash('error', 'Asset not found.');
      return res.redirect('/requester/browse');
    }

    if (asset.availableQuantity <= 0) {
      req.flash('error', `Sorry, '${asset.name}' is currently out of stock.`);
      return res.redirect('/requester/browse');
    }

    res.render('requester/request-form', {
      title: `Request Equipment: ${asset.name} - Requester`,
      asset,
      errors: [],
      inputData: {}
    });
  } catch (err) {
    console.error('Get Request Form Error:', err);
    req.flash('error', 'Error opening request form.');
    res.redirect('/requester/browse');
  }
};

// POST Submit Issue Request
const postSubmitRequest = async (req, res) => {
  const assetId = req.params.assetId;
  const errors = validationResult(req);

  try {
    const asset = await Asset.findById(assetId);
    if (!asset) {
      req.flash('error', 'Asset not found.');
      return res.redirect('/requester/browse');
    }

    if (!errors.isEmpty()) {
      return res.status(400).render('requester/request-form', {
        title: `Request Equipment: ${asset.name} - Requester`,
        asset,
        errors: errors.array(),
        inputData: req.body
      });
    }

    const requestedQty = parseInt(req.body.quantity, 10);

    // Business Logic Rule: Cannot request more units than currently available
    if (requestedQty > asset.availableQuantity) {
      return res.status(400).render('requester/request-form', {
        title: `Request Equipment: ${asset.name} - Requester`,
        asset,
        errors: [{ msg: `Requested quantity (${requestedQty}) exceeds current available stock (${asset.availableQuantity}).` }],
        inputData: req.body
      });
    }

    const newRequest = new IssueRequest({
      requester: req.session.user.id,
      asset: asset._id,
      quantity: requestedQty,
      purpose: req.body.purpose.trim(),
      expectedReturnDate: new Date(req.body.expectedReturnDate),
      status: 'Pending'
    });

    await newRequest.save();

    req.flash('success', `Issue request for '${asset.name}' submitted successfully! Awaiting Lab In-charge approval.`);
    res.redirect('/requester/my-requests');
  } catch (err) {
    console.error('Submit Request Error:', err);
    req.flash('error', 'Failed to submit issue request.');
    res.redirect('/requester/browse');
  }
};

// GET Requester Request History
const getMyRequests = async (req, res) => {
  try {
    const requests = await IssueRequest.find({ requester: req.session.user.id })
      .populate('asset approvedBy')
      .sort({ requestDate: -1 });

    res.render('requester/my-requests', {
      title: 'My Issue Requests - Requester Portal',
      requests
    });
  } catch (err) {
    console.error('Error fetching user requests:', err);
    req.flash('error', 'Failed to retrieve your request history.');
    res.redirect('/requester/browse');
  }
};

module.exports = {
  getBrowseAssets,
  getRequestForm,
  postSubmitRequest,
  getMyRequests
};
