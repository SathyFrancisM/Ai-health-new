/**
 * Pharmacy Service — Medicine search, stock management, and order processing
 * 
 * Handles medicine inventory, stock validation, order placement,
 * and prescription requirement checks. Uses in-memory mock data
 * in demo mode.
 */

const { getSeedMedicines } = require('../data/seed_data');

// ============================================================
// IN-MEMORY STORE (Demo Mode)
// ============================================================
let medicines = null;
let orders = [];
let orderCounter = 0;

function initMedicineData() {
  if (!medicines) {
    medicines = getSeedMedicines();
    console.log(`[Pharmacy Service] Initialized with ${medicines.length} medicines`);
  }
}

// Initialize on load
initMedicineData();

// ============================================================
// MEDICINE OPERATIONS
// ============================================================

/**
 * Search medicines by name, generic name, or category
 * @param {Object} params - { search, category, page, limit }
 * @returns {Object} Paginated medicine results
 */
function searchMedicines({ search, category, page = 1, limit = 12 } = {}) {
  initMedicineData();
  let results = [...medicines];

  // Filter by search term
  if (search) {
    const s = search.toLowerCase();
    results = results.filter(m =>
      m.name.toLowerCase().includes(s) ||
      (m.genericName && m.genericName.toLowerCase().includes(s)) ||
      (m.description && m.description.toLowerCase().includes(s)) ||
      (m.manufacturer && m.manufacturer.toLowerCase().includes(s))
    );
  }

  // Filter by category
  if (category) {
    const c = category.toLowerCase();
    results = results.filter(m => m.category.toLowerCase() === c);
  }

  // Paginate
  const total = results.length;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const startIndex = (pageNum - 1) * limitNum;
  const paginatedResults = results.slice(startIndex, startIndex + limitNum);

  // Get unique categories for filter UI
  const categories = [...new Set(medicines.map(m => m.category))].sort();

  return {
    data: paginatedResults,
    categories,
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
function getMedicineById(medicineId) {
  initMedicineData();
  return medicines.find(m => m.id === medicineId) || null;
}

/**
 * Check stock availability for a medicine
 * @param {string} medicineId 
 * @param {number} quantity 
 * @returns {Object} { available, currentStock, requested }
 */
function checkStock(medicineId, quantity = 1) {
  initMedicineData();
  const medicine = medicines.find(m => m.id === medicineId);
  if (!medicine) {
    return { error: 'Medicine not found', available: false };
  }

  return {
    available: medicine.stock >= quantity,
    currentStock: medicine.stock,
    requested: quantity,
    medicine: {
      id: medicine.id,
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
 * @param {Object} params - { userId, items, shippingAddress, prescriptionUrl }
 * items: [{ medicineId, quantity }]
 * @returns {Object} Order result
 */
function placeOrder({ userId, items, shippingAddress, prescriptionUrl = null }) {
  initMedicineData();

  if (!items || items.length === 0) {
    return { error: 'Order must contain at least one item' };
  }

  if (!shippingAddress) {
    return { error: 'Shipping address is required' };
  }

  // Validate all items
  const orderItems = [];
  let totalAmount = 0;
  let requiresPrescription = false;

  for (const item of items) {
    const medicine = medicines.find(m => m.id === item.medicineId);
    if (!medicine) {
      return { error: `Medicine not found: ${item.medicineId}` };
    }

    const quantity = parseInt(item.quantity) || 1;

    // Check stock
    if (medicine.stock < quantity) {
      return { 
        error: `Insufficient stock for ${medicine.name}. Available: ${medicine.stock}, Requested: ${quantity}` 
      };
    }

    if (medicine.requiresPrescription) {
      requiresPrescription = true;
    }

    orderItems.push({
      medicineId: medicine.id,
      name: medicine.name,
      genericName: medicine.genericName,
      quantity,
      price: medicine.price,
      subtotal: medicine.price * quantity,
      requiresPrescription: medicine.requiresPrescription
    });

    totalAmount += medicine.price * quantity;
  }

  // Check prescription requirement
  if (requiresPrescription && !prescriptionUrl) {
    return { 
      error: 'Prescription is required for one or more items in your order. Please upload a valid prescription.',
      requiresPrescription: true,
      prescriptionItems: orderItems.filter(i => i.requiresPrescription).map(i => i.name)
    };
  }

  // Deduct stock
  for (const item of orderItems) {
    const medicine = medicines.find(m => m.id === item.medicineId);
    if (medicine) {
      medicine.stock -= item.quantity;
    }
  }

  // Create order
  orderCounter++;
  const order = {
    id: `order_${orderCounter}_${Date.now()}`,
    userId,
    items: orderItems,
    totalAmount,
    prescriptionUrl,
    status: 'confirmed',
    shippingAddress,
    paymentStatus: 'paid',  // Auto-mark as paid for demo
    trackingId: `TRK${Math.floor(100000 + Math.random() * 900000)}`,
    estimatedDelivery: getEstimatedDelivery(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  orders.push(order);

  return { success: true, order };
}

/**
 * Get order by ID
 */
function getOrderById(orderId) {
  return orders.find(o => o.id === orderId) || null;
}

/**
 * Get all orders for a user
 */
function getUserOrders(userId) {
  return orders
    .filter(o => o.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Update order status
 */
function updateOrderStatus(orderId, status) {
  const order = orders.find(o => o.id === orderId);
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
      const medicine = medicines.find(m => m.id === item.medicineId);
      if (medicine) {
        medicine.stock += item.quantity;
      }
    }
    order.paymentStatus = 'refunded';
  }

  order.status = status;
  order.updatedAt = new Date().toISOString();

  return { success: true, order };
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
