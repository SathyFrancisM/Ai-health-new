const express = require('express');
const router = express.Router();
const pharmacyController = require('../controllers/pharmacyController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ============================================================
// MULTER CONFIGURATION for prescription uploads
// ============================================================
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `prescription-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files (JPEG, PNG, WebP) and PDFs are allowed'));
  }
});

// ============================================================
// ROUTES
// ============================================================

// @route   GET /api/pharmacy/medicines
// @desc    Search medicines with filters
// @access  Public
router.get('/medicines', pharmacyController.getMedicines);

// @route   GET /api/pharmacy/medicines/:id
// @desc    Get medicine details
// @access  Public
router.get('/medicines/:id', pharmacyController.getMedicineById);

// @route   POST /api/pharmacy/check-stock
// @desc    Check stock availability
// @access  Public
router.post('/check-stock', pharmacyController.checkStock);

// @route   POST /api/pharmacy/order
// @desc    Place an order
// @access  Public (for demo)
router.post('/order', pharmacyController.placeOrder);

// @route   GET /api/pharmacy/orders
// @desc    Get user order history
// @access  Public (for demo)
router.get('/orders', pharmacyController.getOrders);

// @route   GET /api/pharmacy/orders/:id
// @desc    Get order details
// @access  Public
router.get('/orders/:id', pharmacyController.getOrderById);

// @route   PATCH /api/pharmacy/orders/:id/status
// @desc    Update order status
// @access  Public (for demo)
router.patch('/orders/:id/status', pharmacyController.updateOrderStatus);

// @route   POST /api/pharmacy/upload-prescription
// @desc    Upload prescription image
// @access  Public (for demo)
router.post('/upload-prescription', upload.single('prescription'), pharmacyController.uploadPrescription);

// Multer error handler
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File is too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

module.exports = router;
