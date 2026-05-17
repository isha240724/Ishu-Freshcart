const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// POST /api/orders — place an order
router.post('/', (req, res) => {
  try {
    const { customer } = req.body;
    const order = Order.create(customer);
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/orders — list all orders
router.get('/', (req, res) => {
  try {
    const orders = Order.getAll();
    res.json({ success: true, data: orders, count: orders.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/orders/:id — get single order
router.get('/:id', (req, res) => {
  try {
    const order = Order.getById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
