const Cart = require('./Cart');

// In-memory orders storage
let orders = [];
let orderCounter = 1000;

const Order = {
  create(customer) {
    const cart = Cart.getCart();

    if (cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    if (!customer || !customer.name || !customer.address || !customer.phone) {
      throw new Error('Customer name, address, and phone are required');
    }

    const order = {
      id: `ORD-${++orderCounter}`,
      items: cart.items.map(item => ({
        productId: item.productId,
        name: item.product.name,
        emoji: item.product.emoji,
        price: item.product.price,
        quantity: item.quantity,
        subtotal: Math.round(item.product.price * item.quantity * 100) / 100
      })),
      total: cart.totalPrice,
      totalItems: cart.totalItems,
      customer: {
        name: customer.name,
        address: customer.address,
        phone: customer.phone
      },
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    orders.push(order);

    // Clear cart after placing order
    Cart.clear();

    return order;
  },

  getAll() {
    return [...orders].reverse();
  },

  getById(id) {
    return orders.find(o => o.id === id) || null;
  }
};

module.exports = Order;
