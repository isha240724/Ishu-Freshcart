const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET /api/products — list all products (optional ?category= and ?search=)
router.get('/', (req, res) => {
  try {
    const { category, search } = req.query;
    const products = Product.getAll(category, search);
    res.json({ success: true, data: products, count: products.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/products/categories — list all categories
router.get('/categories', (req, res) => {
  try {
    const categories = Product.getCategories();
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/products/:id — get single product
router.get('/:id', (req, res) => {
  try {
    const product = Product.getById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
