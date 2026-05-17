const Product = require('./Product');

// In-memory cart storage
let cartItems = [];

const Cart = {
  getCart() {
    const items = cartItems.map(item => {
      const product = Product.getById(item.productId);
      return {
        productId: item.productId,
        quantity: item.quantity,
        product
      };
    }).filter(item => item.product !== null);

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    return {
      items,
      totalItems,
      totalPrice: Math.round(totalPrice * 100) / 100
    };
  },

  addItem(productId, quantity = 1) {
    const product = Product.getById(productId);
    if (!product) {
      throw new Error('Product not found');
    }
    if (!product.inStock) {
      throw new Error('Product is out of stock');
    }

    const existing = cartItems.find(item => item.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cartItems.push({ productId, quantity });
    }

    return this.getCart();
  },

  updateItem(productId, quantity) {
    const index = cartItems.findIndex(item => item.productId === productId);
    if (index === -1) {
      throw new Error('Item not in cart');
    }

    if (quantity <= 0) {
      cartItems.splice(index, 1);
    } else {
      cartItems[index].quantity = quantity;
    }

    return this.getCart();
  },

  removeItem(productId) {
    const index = cartItems.findIndex(item => item.productId === productId);
    if (index === -1) {
      throw new Error('Item not in cart');
    }

    cartItems.splice(index, 1);
    return this.getCart();
  },

  clear() {
    cartItems = [];
    return this.getCart();
  }
};

module.exports = Cart;
