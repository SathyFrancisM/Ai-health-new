const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  medicineId: { type: mongoose.Schema.Types.Mixed, required: true },
  name: { type: String, required: true },
  genericName: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  requiresPrescription: { type: Boolean, default: false }
}, { _id: true });

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.Mixed, required: true },
  items: [OrderItemSchema],
  totalAmount: { type: Number, required: true },
  prescriptionUrl: { type: String, default: null },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'], 
    default: 'pending' 
  },
  shippingAddress: { type: String },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'refunded'], 
    default: 'pending' 
  },
  trackingId: { type: String },
  estimatedDelivery: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', OrderSchema);
