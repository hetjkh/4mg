const express = require('express');
const jwt = require('jsonwebtoken');
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

// Create Product (Admin only)
router.post('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { title, description, price, image, stock } = req.body;

    // Validation
    if (!title || price === undefined || !image || stock === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide title, price, image, and stock' 
      });
    }

    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Price must be a positive number' 
      });
    }

    if (typeof stock !== 'number' || stock < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Stock must be a positive number' 
      });
    }

    // Create product
    const product = new Product({
      title: title.trim(),
      description: description?.trim() || '',
      price,
      image: image.trim(),
      stock,
      createdBy: req.user._id,
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        product: {
          id: product._id,
          title: product.title,
          description: product.description,
          price: product.price,
          image: product.image,
          stock: product.stock,
          createdAt: product.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error during product creation',
      error: error.message 
    });
  }
});

// Get All Products
router.get('/', verifyToken, async (req, res) => {
  try {
    const products = await Product.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        products: products.map(product => ({
          id: product._id,
          title: product.title,
          description: product.description,
          price: product.price,
          image: product.image,
          stock: product.stock,
          createdBy: product.createdBy,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        })),
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching products',
      error: error.message 
    });
  }
});

// Get Single Product
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    res.json({
      success: true,
      data: {
        product: {
          id: product._id,
          title: product.title,
          description: product.description,
          price: product.price,
          image: product.image,
          stock: product.stock,
          createdBy: product.createdBy,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching product',
      error: error.message 
    });
  }
});

// Update Product (Admin only)
router.put('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { title, description, price, image, stock } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Update fields
    if (title !== undefined) product.title = title.trim();
    if (description !== undefined) product.description = description?.trim() || '';
    if (price !== undefined) {
      if (typeof price !== 'number' || price < 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Price must be a positive number' 
        });
      }
      product.price = price;
    }
    if (image !== undefined) product.image = image.trim();
    if (stock !== undefined) {
      if (typeof stock !== 'number' || stock < 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Stock must be a positive number' 
        });
      }
      product.stock = stock;
    }

    await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: {
        product: {
          id: product._id,
          title: product.title,
          description: product.description,
          price: product.price,
          image: product.image,
          stock: product.stock,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error during product update',
      error: error.message 
    });
  }
});

// Delete Product (Admin only)
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during product deletion',
      error: error.message 
    });
  }
});

module.exports = router;

