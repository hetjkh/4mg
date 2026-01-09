const express = require('express');
const jwt = require('jsonwebtoken');
const DealerRequest = require('../models/DealerRequest');
const Product = require('../models/Product');
const User = require('../models/User');

const router = express.Router();

// Middleware to verify token and get user
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production');
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

// Middleware to verify admin
const verifyAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Admin privileges required.' 
    });
  }
  next();
};

// Middleware to verify dealer
const verifyDealer = (req, res, next) => {
  if (req.user.role !== 'dealer' && req.user.role !== 'dellear') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Dealer privileges required.' 
    });
  }
  next();
};

// Middleware to verify stalkist
const verifyStalkist = (req, res, next) => {
  if (req.user.role !== 'stalkist') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Stalkist privileges required.' 
    });
  }
  next();
};

// Create Dealer Request (Dealer only)
router.post('/', verifyToken, verifyDealer, async (req, res) => {
  try {
    const { productId, strips } = req.body;

    if (!productId || !strips) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide productId and strips' 
      });
    }

    if (typeof strips !== 'number' || strips < 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Strips must be a positive number' 
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Check if enough stock available
    if (product.stock < strips) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient stock. Available: ${product.stock} strips, Requested: ${strips} strips` 
      });
    }

    // Create request
    const request = new DealerRequest({
      dealer: req.user._id,
      product: productId,
      strips,
      status: 'pending',
    });

    await request.save();
    await request.populate('product', 'title packetPrice packetsPerStrip image');
    await request.populate('dealer', 'name email');

    res.status(201).json({
      success: true,
      message: 'Request created successfully',
      data: { request },
    });
  } catch (error) {
    console.error('Create dealer request error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error during request creation',
      error: error.message 
    });
  }
});

// Get All Requests (Admin - all requests, Dealer - own requests)
router.get('/', verifyToken, async (req, res) => {
  try {
    let query = {};
    
    // Dealers can only see their own requests
    if (req.user.role === 'dealer' || req.user.role === 'dellear') {
      query.dealer = req.user._id;
    }

    const requests = await DealerRequest.find(query)
      .populate('product', 'title packetPrice packetsPerStrip image stock')
      .populate('dealer', 'name email')
      .populate('processedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { requests },
    });
  } catch (error) {
    console.error('Get dealer requests error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching requests',
      error: error.message 
    });
  }
});

// Get Single Request
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const request = await DealerRequest.findById(req.params.id)
      .populate('product', 'title packetPrice packetsPerStrip image stock')
      .populate('dealer', 'name email')
      .populate('processedBy', 'name email');

    if (!request) {
      return res.status(404).json({ 
        success: false, 
        message: 'Request not found' 
      });
    }

    // Dealers can only see their own requests
    if ((req.user.role === 'dealer' || req.user.role === 'dellear') && 
        request.dealer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    res.json({
      success: true,
      data: { request },
    });
  } catch (error) {
    console.error('Get dealer request error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching request',
      error: error.message 
    });
  }
});

// Approve Request (Admin only)
router.put('/:id/approve', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const request = await DealerRequest.findById(req.params.id)
      .populate('product');

    if (!request) {
      return res.status(404).json({ 
        success: false, 
        message: 'Request not found' 
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: `Request is already ${request.status}` 
      });
    }

    // Check stock availability
    if (request.product.stock < request.strips) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient stock to approve this request' 
      });
    }

    // Update stock
    request.product.stock -= request.strips;
    await request.product.save();

    // Update request
    request.status = 'approved';
    request.processedBy = req.user._id;
    request.processedAt = new Date();
    request.notes = req.body.notes || '';
    await request.save();

    await request.populate('product', 'title packetPrice packetsPerStrip image');
    await request.populate('dealer', 'name email');
    await request.populate('processedBy', 'name email');

    res.json({
      success: true,
      message: 'Request approved successfully',
      data: { request },
    });
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error during request approval',
      error: error.message 
    });
  }
});

// Cancel Request (Admin only)
router.put('/:id/cancel', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const request = await DealerRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ 
        success: false, 
        message: 'Request not found' 
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: `Request is already ${request.status}` 
      });
    }

    // Update request
    request.status = 'cancelled';
    request.processedBy = req.user._id;
    request.processedAt = new Date();
    request.notes = req.body.notes || '';
    await request.save();

    await request.populate('product', 'title packetPrice packetsPerStrip image');
    await request.populate('dealer', 'name email');
    await request.populate('processedBy', 'name email');

    res.json({
      success: true,
      message: 'Request cancelled successfully',
      data: { request },
    });
  } catch (error) {
    console.error('Cancel request error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error during request cancellation',
      error: error.message 
    });
  }
});

// Get Dealer Statistics (Stalkist only - for dealers they created)
router.get('/dealer/:dealerId/stats', verifyToken, verifyStalkist, async (req, res) => {
  try {
    const { dealerId } = req.params;

    // Verify that this dealer was created by the stalkist
    const dealer = await User.findOne({
      _id: dealerId,
      createdBy: req.user._id,
      role: { $in: ['dealer', 'dellear'] }
    });

    if (!dealer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Dealer not found or access denied' 
      });
    }

    // Get all requests for this dealer
    const requests = await DealerRequest.find({ dealer: dealerId })
      .populate('product', 'title packetPrice packetsPerStrip');

    // Calculate statistics
    const totalRequests = requests.length;
    const pendingRequests = requests.filter(r => r.status === 'pending').length;
    const approvedRequests = requests.filter(r => r.status === 'approved').length;
    const cancelledRequests = requests.filter(r => r.status === 'cancelled').length;

    // Calculate total strips requested
    const totalStripsRequested = requests.reduce((sum, r) => sum + r.strips, 0);
    const totalStripsApproved = requests
      .filter(r => r.status === 'approved')
      .reduce((sum, r) => sum + r.strips, 0);
    const totalStripsPending = requests
      .filter(r => r.status === 'pending')
      .reduce((sum, r) => sum + r.strips, 0);

    // Calculate total value
    const totalValueRequested = requests.reduce((sum, r) => {
      return sum + (r.strips * r.product.packetsPerStrip * r.product.packetPrice);
    }, 0);
    const totalValueApproved = requests
      .filter(r => r.status === 'approved')
      .reduce((sum, r) => {
        return sum + (r.strips * r.product.packetsPerStrip * r.product.packetPrice);
      }, 0);

    res.json({
      success: true,
      data: {
        dealer: {
          id: dealer._id,
          name: dealer.name,
          email: dealer.email,
          role: dealer.role,
        },
        stats: {
          totalRequests,
          pendingRequests,
          approvedRequests,
          cancelledRequests,
          totalStripsRequested,
          totalStripsApproved,
          totalStripsPending,
          totalValueRequested: totalValueRequested.toFixed(2),
          totalValueApproved: totalValueApproved.toFixed(2),
        },
        requests: requests.map(r => ({
          id: r._id,
          product: {
            id: r.product._id,
            title: r.product.title,
            packetPrice: r.product.packetPrice,
            packetsPerStrip: r.product.packetsPerStrip,
          },
          strips: r.strips,
          status: r.status,
          requestedAt: r.requestedAt,
          processedAt: r.processedAt,
          totalValue: (r.strips * r.product.packetsPerStrip * r.product.packetPrice).toFixed(2),
        })),
      },
    });
  } catch (error) {
    console.error('Get dealer stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching dealer statistics',
      error: error.message 
    });
  }
});

module.exports = router;

