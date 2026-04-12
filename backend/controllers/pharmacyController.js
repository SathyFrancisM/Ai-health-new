/**
 * Pharmacy Controller — Medicine search, ordering, and prescription management
 */

const pharmacyService = require('../services/pharmacyService');
const path = require('path');
const fs = require('fs');

/**
 * GET /api/pharmacy/medicines
 * Search medicines
 * Query: ?search=&category=&page=&limit=
 */
exports.getMedicines = (req, res) => {
  try {
    const { search, category, page, limit } = req.query;
    const result = pharmacyService.searchMedicines({ search, category, page, limit });
    res.json(result);
  } catch (err) {
    console.error('[Pharmacy Controller] getMedicines error:', err.message);
    res.status(500).json({ error: 'Failed to fetch medicines' });
  }
};

/**
 * GET /api/pharmacy/medicines/:id
 * Get medicine details
 */
exports.getMedicineById = (req, res) => {
  try {
    const medicine = pharmacyService.getMedicineById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }
    res.json(medicine);
  } catch (err) {
    console.error('[Pharmacy Controller] getMedicineById error:', err.message);
    res.status(500).json({ error: 'Failed to fetch medicine' });
  }
};

/**
 * POST /api/pharmacy/check-stock
 * Check stock availability
 * Body: { medicineId, quantity }
 */
exports.checkStock = (req, res) => {
  try {
    const { medicineId, quantity } = req.body;
    if (!medicineId) {
      return res.status(400).json({ error: 'medicineId is required' });
    }

    const result = pharmacyService.checkStock(medicineId, quantity || 1);
    if (result.error) {
      return res.status(404).json({ error: result.error });
    }

    res.json(result);
  } catch (err) {
    console.error('[Pharmacy Controller] checkStock error:', err.message);
    res.status(500).json({ error: 'Failed to check stock' });
  }
};

/**
 * POST /api/pharmacy/order
 * Place an order
 * Body: { userId, items: [{ medicineId, quantity }], shippingAddress, prescriptionUrl? }
 */
exports.placeOrder = (req, res) => {
  try {
    const { userId, items, shippingAddress, prescriptionUrl } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    const result = pharmacyService.placeOrder({
      userId, items, shippingAddress, prescriptionUrl
    });

    if (result.error) {
      const statusCode = result.requiresPrescription ? 422 : 400;
      return res.status(statusCode).json(result);
    }

    res.status(201).json(result);
  } catch (err) {
    console.error('[Pharmacy Controller] placeOrder error:', err.message);
    res.status(500).json({ error: 'Failed to place order' });
  }
};

/**
 * GET /api/pharmacy/orders
 * Get user order history
 * Query: ?userId=
 */
exports.getOrders = (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const orders = pharmacyService.getUserOrders(userId);
    res.json({ data: orders, total: orders.length });
  } catch (err) {
    console.error('[Pharmacy Controller] getOrders error:', err.message);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

/**
 * GET /api/pharmacy/orders/:id
 * Get order details
 */
exports.getOrderById = (req, res) => {
  try {
    const order = pharmacyService.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    console.error('[Pharmacy Controller] getOrderById error:', err.message);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

/**
 * PATCH /api/pharmacy/orders/:id/status
 * Update order status
 * Body: { status }
 */
exports.updateOrderStatus = (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    const result = pharmacyService.updateOrderStatus(req.params.id, status);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  } catch (err) {
    console.error('[Pharmacy Controller] updateOrderStatus error:', err.message);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

/**
 * POST /api/pharmacy/upload-prescription
 * Upload prescription image
 * Expects multipart/form-data with 'prescription' field
 */
exports.uploadPrescription = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please upload a prescription image.' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      prescriptionUrl: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      message: 'Prescription uploaded successfully'
    });
  } catch (err) {
    console.error('[Pharmacy Controller] uploadPrescription error:', err.message);
    res.status(500).json({ error: 'Failed to upload prescription' });
  }
};
