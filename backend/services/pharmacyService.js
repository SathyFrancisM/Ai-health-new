/**
 * Pharmacy Service — Medicine search, stock management, and order processing
 * 
 * Handles medicine inventory, stock validation, order placement,
 * and prescription requirement checks. Uses MongoDB.
 */

const Medicine = require('../models/Medicine');
const Order = require('../models/Order');

// ============================================================
// MEDICINE OPERATIONS
// ============================================================

/**
 * Search medicines by name, generic name, or category
 */
async function searchMedicines({ search, category, page = 1, limit = 12 } = {}) {
  let query = {};

  // Filter by search term
  if (search) {
    const s = new RegExp(search, 'i');
    query.$or = [
      { name: s },
      { genericName: s },
      { description: s },
      { manufacturer: s }
    ];
  }

  // Filter by category
  if (category) {
    query.category = new RegExp(`^${category}$`, 'i');
  }

  // Paginate
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const startIndex = (pageNum - 1) * limitNum;

  const total = await Medicine.countDocuments(query);
  let paginatedResults = await Medicine.find(query)
    .skip(startIndex)
    .limit(limitNum)
    .lean();

  paginatedResults = paginatedResults.map(m => ({...m, id: m._id.toString()}));

  // Get unique categories for filter UI
  const categories = await Medicine.distinct('category');

  return {
    data: paginatedResults,
    categories: categories.sort(),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  };
}

/**
 * Get a single medicine by ID
 */
async function getMedicineById(medicineId) {
  const medicine = await Medicine.findById(medicineId).lean();
  if (medicine) {
    medicine.id = medicine._id.toString();
  }
  return medicine;
}

/**
 * Check stock availability for a medicine
 */
async function checkStock(medicineId, quantity = 1) {
  const medicine = await Medicine.findById(medicineId).lean();
  if (!medicine) {
    return { error: 'Medicine not found', available: false };
  }

  return {
    available: medicine.stock >= quantity,
    currentStock: medicine.stock,
    requested: quantity,
    medicine: {
      id: medicine._id.toString(),
      name: medicine.name,
      price: medicine.price,
      requiresPrescription: medicine.requiresPrescription
    }
  };
}

// ============================================================
// ORDER OPERATIONS
// ============================================================

/**
 * Place a new order
 */
async function placeOrder({ userId, items, shippingAddress, prescriptionUrl = null }) {
  if (!items || items.length === 0) {
    return { error: 'Order must contain at least one item' };
  }

  if (!shippingAddress) {
    return { error: 'Shipping address is required' };
  }

  const orderItems = [];
  let totalAmount = 0;
  let requiresPrescription = false;

  for (const item of items) {
    const medicine = await Medicine.findById(item.medicineId);
    if (!medicine) {
      return { error: `Medicine not found: ${item.medicineId}` };
    }

    const quantity = parseInt(item.quantity) || 1;

    if (medicine.stock < quantity) {
      return { 
        error: `Insufficient stock for ${medicine.name}. Available: ${medicine.stock}, Requested: ${quantity}` 
      };
    }

    if (medicine.requiresPrescription) {
      requiresPrescription = true;
    }

    orderItems.push({
      medicineId: medicine._id,
      name: medicine.name,
      genericName: medicine.genericName,
      quantity,
      price: medicine.price,
      subtotal: medicine.price * quantity,
      requiresPrescription: medicine.requiresPrescription
    });

    totalAmount += medicine.price * quantity;
  }

  if (requiresPrescription && !prescriptionUrl) {
    return { 
      error: 'Prescription is required for one or more items in your order. Please upload a valid prescription.',
      requiresPrescription: true,
      prescriptionItems: orderItems.filter(i => i.requiresPrescription).map(i => i.name)
    };
  }

  // Deduct stock
  for (const item of orderItems) {
    await Medicine.findByIdAndUpdate(item.medicineId, {
      $inc: { stock: -item.quantity }
    });
  }

  // Create order
  const order = new Order({
    userId,
    items: orderItems,
    totalAmount,
    prescriptionUrl,
    status: 'confirmed',
    shippingAddress,
    paymentStatus: 'paid',  // Auto-mark as paid for now
    trackingId: `TRK${Math.floor(100000 + Math.random() * 900000)}`,
    estimatedDelivery: getEstimatedDelivery(),
  });

  await order.save();

  return { success: true, order: { ...order.toObject(), id: order._id.toString() } };
}

/**
 * Get order by ID
 */
async function getOrderById(orderId) {
  const order = await Order.findById(orderId).lean();
  if (order) {
    order.id = order._id.toString();
  }
  return order;
}

/**
 * Get all orders for a user
 */
async function getUserOrders(userId) {
  const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();
  return orders.map(o => ({ ...o, id: o._id.toString() }));
}

/**
 * Update order status
 */
async function updateOrderStatus(orderId, status) {
  const order = await Order.findById(orderId);
  if (!order) {
    return { error: 'Order not found' };
  }

  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` };
  }

  // If cancelling, restore stock
  if (status === 'cancelled' && order.status !== 'cancelled') {
    for (const item of order.items) {
      await Medicine.findByIdAndUpdate(item.medicineId, {
        $inc: { stock: item.quantity }
      });
    }
    order.paymentStatus = 'refunded';
  }

  order.status = status;
  order.updatedAt = new Date();
  await order.save();

  return { success: true, order: { ...order.toObject(), id: order._id.toString() } };
}

/**
 * Calculate estimated delivery date (3-5 business days from now)
 */
function getEstimatedDelivery() {
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 3 + Math.floor(Math.random() * 3));
  return deliveryDate.toISOString().split('T')[0];
}

module.exports = {
  searchMedicines,
  getMedicineById,
  checkStock,
  placeOrder,
  getOrderById,
  getUserOrders,
  updateOrderStatus
};
