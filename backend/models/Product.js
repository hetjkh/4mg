const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  packetPrice: {
    type: Number,
    required: [true, 'Packet price is required'],
    min: [0, 'Price must be positive'],
  },
  packetsPerStrip: {
    type: Number,
    required: [true, 'Packets per strip is required'],
    min: [1, 'Must have at least 1 packet per strip'],
  },
  image: {
    type: String,
    required: [true, 'Product image is required'],
    trim: true,
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0,
    comment: 'Stock in strips (not packets)',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Product', productSchema);

