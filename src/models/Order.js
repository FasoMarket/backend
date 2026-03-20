const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    },
    commissionAmount: { type: Number, default: 0 },
    netAmount: { type: Number, default: 0 }
  }],
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    city: { type: String, required: true },
    details: { type: String, required: true }
  },
  paymentMethod: {
    type: String,
    enum: ['mobile_money', 'cash', 'orange', 'moov'],
    default: 'mobile_money'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  // Billing fields
  commissionRate: { type: Number, default: 0 },
  commissionAmount: { type: Number, default: 0 },
  fixedFee: { type: Number, default: 0 },
  netAmount: { type: Number, default: 0 } // Amount after commission
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
