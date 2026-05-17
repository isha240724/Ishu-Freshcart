/* ============================================================
   FreshCart — Main Application Controller
   ============================================================ */

(function () {
  'use strict';

  // ---- State ----
  let currentCategory = 'All';
  let searchTerm = '';
  let cartData = { items: [], totalItems: 0, totalPrice: 0 };
  let debounceTimer = null;

  // ---- DOM References ----
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    // Navbar
    searchInput: $('#search-input'),
    searchClear: $('#search-clear'),
    cartBtn: $('#cart-btn'),
    cartBadge: $('#cart-badge'),
    btnOrders: $('#btn-orders'),
    logoLink: $('#logo-link'),

    // Hero
    heroCta: $('#hero-cta'),

    // Products
    categoryTabs: $('#category-tabs'),
    productGrid: $('#product-grid'),
    emptyProducts: $('#empty-products'),

    // Cart Drawer
    cartOverlay: $('#cart-overlay'),
    cartDrawer: $('#cart-drawer'),
    cartClose: $('#cart-close'),
    cartBody: $('#cart-body'),
    cartEmpty: $('#cart-empty'),
    cartFooter: $('#cart-footer'),
    cartHeaderBadge: $('#cart-header-badge'),
    cartTotalPrice: $('#cart-total-price'),
    btnCheckout: $('#btn-checkout'),
    btnClearCart: $('#btn-clear-cart'),

    // Checkout
    checkoutOverlay: $('#checkout-overlay'),
    checkoutModal: $('#checkout-modal'),
    checkoutClose: $('#checkout-close'),
    checkoutSummary: $('#checkout-summary'),
    checkoutForm: $('#checkout-form'),
    checkoutTotalPrice: $('#checkout-total-price'),
    btnPlaceOrder: $('#btn-place-order'),
    orderLoader: $('#order-loader'),

    // Confirmation
    confirmOverlay: $('#confirm-overlay'),
    confirmOrderId: $('#confirm-order-id'),
    confirmDetails: $('#confirm-details'),
    btnContinue: $('#btn-continue'),

    // Orders
    ordersOverlay: $('#orders-overlay'),
    ordersClose: $('#orders-close'),
    ordersList: $('#orders-list'),
    ordersEmpty: $('#orders-empty'),

    // Toast
    toastContainer: $('#toast-container')
  };

  // ---- Initialize ----
  async function init() {
    await loadCategories();
    await loadProducts();
    await refreshCart();
    bindEvents();
  }

  // ---- Categories ----
  async function loadCategories() {
    const res = await api.getCategories();
    if (!res.success) return;

    const tabs = dom.categoryTabs;
    res.data.forEach(cat => {
      const emojiMap = {
        'Fruits': '🍎', 'Vegetables': '🥬', 'Dairy': '🧀',
        'Bakery': '🍞', 'Beverages': '☕', 'Snacks': '🥜'
      };
      const btn = document.createElement('button');
      btn.className = 'cat-tab';
      btn.dataset.category = cat;
      btn.innerHTML = `<span class="cat-emoji">${emojiMap[cat] || '📦'}</span> ${cat}`;
      tabs.appendChild(btn);
    });
  }

  // ---- Products ----
  async function loadProducts() {
    const res = await api.getProducts(currentCategory, searchTerm);
    if (!res.success) return;

    const products = res.data;
    if (products.length === 0) {
      dom.productGrid.innerHTML = '';
      dom.emptyProducts.classList.remove('hidden');
      return;
    }

    dom.emptyProducts.classList.add('hidden');
    dom.productGrid.innerHTML = products.map((p, i) => createProductCard(p, i)).join('');

    // Stagger animations
    requestAnimationFrame(() => {
      dom.productGrid.querySelectorAll('.product-card').forEach((card, i) => {
        card.style.animationDelay = `${i * 0.05}s`;
        card.classList.add('animate-in');
      });
    });
  }

  function createProductCard(product, index) {
    const inCart = cartData.items.find(i => i.productId === product.id);
    const qty = inCart ? inCart.quantity : 0;

    return `
      <div class="product-card" data-id="${product.id}">
        <div class="product-emoji-wrap">
          <span class="product-emoji">${product.emoji}</span>
        </div>
        <div class="product-info">
          <span class="product-category-label">${product.category}</span>
          <h3 class="product-name">${product.name}</h3>
          <p class="product-desc">${product.description}</p>
          <div class="product-meta">
            <span class="product-price">$${product.price.toFixed(2)}</span>
            <span class="product-unit">/ ${product.unit}</span>
          </div>
        </div>
        <div class="product-actions">
          ${qty > 0
            ? `<div class="qty-control">
                 <button class="qty-btn qty-minus" data-id="${product.id}" data-action="decrease">−</button>
                 <span class="qty-value">${qty}</span>
                 <button class="qty-btn qty-plus" data-id="${product.id}" data-action="increase">+</button>
               </div>`
            : `<button class="btn-add-cart" data-id="${product.id}">
                 <span class="btn-add-icon">+</span> Add to Cart
               </button>`
          }
        </div>
      </div>`;
  }

  // ---- Cart ----
  async function refreshCart() {
    const res = await api.getCart();
    if (!res.success) return;
    cartData = res.data;
    updateCartUI();
  }

  function updateCartUI() {
    // Badge
    if (cartData.totalItems > 0) {
      dom.cartBadge.textContent = cartData.totalItems;
      dom.cartBadge.classList.remove('hidden');
    } else {
      dom.cartBadge.classList.add('hidden');
    }

    dom.cartHeaderBadge.textContent = cartData.totalItems;
    dom.cartTotalPrice.textContent = `$${cartData.totalPrice.toFixed(2)}`;

    // Cart body
    if (cartData.items.length === 0) {
      dom.cartBody.innerHTML = '';
      dom.cartEmpty.classList.remove('hidden');
      dom.cartFooter.classList.add('hidden');
    } else {
      dom.cartEmpty.classList.add('hidden');
      dom.cartFooter.classList.remove('hidden');
      dom.cartBody.innerHTML = cartData.items.map(item => createCartItem(item)).join('');
    }
  }

  function createCartItem(item) {
    const p = item.product;
    const subtotal = (p.price * item.quantity).toFixed(2);
    return `
      <div class="cart-item" data-id="${item.productId}">
        <span class="cart-item-emoji">${p.emoji}</span>
        <div class="cart-item-info">
          <h4>${p.name}</h4>
          <span class="cart-item-price">$${p.price.toFixed(2)} × ${item.quantity} = <strong>$${subtotal}</strong></span>
        </div>
        <div class="cart-item-controls">
          <button class="qty-btn qty-minus" data-id="${item.productId}" data-action="cart-decrease">−</button>
          <span class="qty-value">${item.quantity}</span>
          <button class="qty-btn qty-plus" data-id="${item.productId}" data-action="cart-increase">+</button>
          <button class="cart-item-remove" data-id="${item.productId}" data-action="cart-remove" title="Remove">🗑️</button>
        </div>
      </div>`;
  }

  function openCart() {
    dom.cartDrawer.classList.remove('hidden');
    dom.cartOverlay.classList.remove('hidden');
    requestAnimationFrame(() => {
      dom.cartDrawer.classList.add('open');
      dom.cartOverlay.classList.add('open');
    });
  }

  function closeCart() {
    dom.cartDrawer.classList.remove('open');
    dom.cartOverlay.classList.remove('open');
    setTimeout(() => {
      dom.cartDrawer.classList.add('hidden');
      dom.cartOverlay.classList.add('hidden');
    }, 350);
  }

  // ---- Checkout ----
  function openCheckout() {
    closeCart();
    setTimeout(() => {
      dom.checkoutSummary.innerHTML = cartData.items.map(item => {
        const p = item.product;
        return `
          <div class="checkout-item">
            <span>${p.emoji} ${p.name}</span>
            <span>×${item.quantity} — $${(p.price * item.quantity).toFixed(2)}</span>
          </div>`;
      }).join('');
      dom.checkoutTotalPrice.textContent = `$${cartData.totalPrice.toFixed(2)}`;
      dom.checkoutOverlay.classList.remove('hidden');
      requestAnimationFrame(() => dom.checkoutOverlay.classList.add('open'));
    }, 400);
  }

  function closeCheckout() {
    dom.checkoutOverlay.classList.remove('open');
    setTimeout(() => dom.checkoutOverlay.classList.add('hidden'), 350);
  }

  async function submitOrder(e) {
    e.preventDefault();
    const name = $('#customer-name').value.trim();
    const address = $('#customer-address').value.trim();
    const phone = $('#customer-phone').value.trim();

    if (!name || !address || !phone) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    // Show loader
    dom.btnPlaceOrder.disabled = true;
    dom.btnPlaceOrder.querySelector('.btn-text').textContent = 'Placing Order...';
    dom.orderLoader.classList.remove('hidden');

    // Simulate slight delay for UX
    await new Promise(r => setTimeout(r, 800));

    const res = await api.placeOrder({ name, address, phone });

    dom.btnPlaceOrder.disabled = false;
    dom.btnPlaceOrder.querySelector('.btn-text').textContent = 'Place Order';
    dom.orderLoader.classList.add('hidden');

    if (!res.success) {
      showToast(res.error || 'Failed to place order', 'error');
      return;
    }

    // Close checkout, show confirmation
    closeCheckout();
    dom.checkoutForm.reset();

    setTimeout(() => {
      showOrderConfirmation(res.data);
    }, 400);
  }

  function showOrderConfirmation(order) {
    dom.confirmOrderId.textContent = `Order ${order.id}`;
    dom.confirmDetails.innerHTML = `
      <div class="confirm-info">
        <p><strong>📍 Delivering to:</strong> ${order.customer.name}</p>
        <p>${order.customer.address}</p>
        <p>📞 ${order.customer.phone}</p>
      </div>
      <div class="confirm-items">
        ${order.items.map(i => `
          <div class="confirm-item">
            <span>${i.emoji} ${i.name} ×${i.quantity}</span>
            <span>$${i.subtotal.toFixed(2)}</span>
          </div>
        `).join('')}
      </div>
      <div class="confirm-total">
        <span>Total</span>
        <span>$${order.total.toFixed(2)}</span>
      </div>`;

    dom.confirmOverlay.classList.remove('hidden');
    requestAnimationFrame(() => dom.confirmOverlay.classList.add('open'));

    refreshCart();
    loadProducts();
  }

  function closeConfirmation() {
    dom.confirmOverlay.classList.remove('open');
    setTimeout(() => dom.confirmOverlay.classList.add('hidden'), 350);
  }

  // ---- Orders History ----
  async function openOrders() {
    const res = await api.getOrders();
    if (!res.success) return;

    if (res.data.length === 0) {
      dom.ordersList.innerHTML = '';
      dom.ordersEmpty.classList.remove('hidden');
    } else {
      dom.ordersEmpty.classList.add('hidden');
      dom.ordersList.innerHTML = res.data.map(order => `
        <div class="order-card">
          <div class="order-card-header">
            <span class="order-id">${order.id}</span>
            <span class="order-status">${order.status}</span>
          </div>
          <div class="order-card-items">
            ${order.items.map(i => `<span class="order-item-pill">${i.emoji} ${i.name} ×${i.quantity}</span>`).join('')}
          </div>
          <div class="order-card-footer">
            <span class="order-date">${new Date(order.createdAt).toLocaleString()}</span>
            <span class="order-total">$${order.total.toFixed(2)}</span>
          </div>
        </div>
      `).join('');
    }

    dom.ordersOverlay.classList.remove('hidden');
    requestAnimationFrame(() => dom.ordersOverlay.classList.add('open'));
  }

  function closeOrders() {
    dom.ordersOverlay.classList.remove('open');
    setTimeout(() => dom.ordersOverlay.classList.add('hidden'), 350);
  }

  // ---- Toast ----
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
    dom.toastContainer.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 2500);
  }

  // ---- Event Binding ----
  function bindEvents() {
    // Logo → scroll to top
    dom.logoLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Hero CTA → scroll to products
    dom.heroCta.addEventListener('click', () => {
      document.getElementById('products-section').scrollIntoView({ behavior: 'smooth' });
    });

    // Search
    dom.searchInput.addEventListener('input', () => {
      const val = dom.searchInput.value.trim();
      dom.searchClear.classList.toggle('hidden', val.length === 0);
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        searchTerm = val;
        loadProducts();
      }, 300);
    });

    dom.searchClear.addEventListener('click', () => {
      dom.searchInput.value = '';
      dom.searchClear.classList.add('hidden');
      searchTerm = '';
      loadProducts();
    });

    // Category Tabs
    dom.categoryTabs.addEventListener('click', (e) => {
      const tab = e.target.closest('.cat-tab');
      if (!tab) return;
      $$('.cat-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentCategory = tab.dataset.category;
      loadProducts();
    });

    // Product Grid — Add to cart / quantity
    dom.productGrid.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-id]');
      if (!btn) return;
      const id = btn.dataset.id;
      const action = btn.dataset.action;

      if (btn.classList.contains('btn-add-cart')) {
        await api.addToCart(id, 1);
        showToast('Added to cart!');
      } else if (action === 'increase') {
        const item = cartData.items.find(i => i.productId === id);
        await api.updateCartItem(id, (item ? item.quantity : 0) + 1);
      } else if (action === 'decrease') {
        const item = cartData.items.find(i => i.productId === id);
        if (item && item.quantity > 1) {
          await api.updateCartItem(id, item.quantity - 1);
        } else {
          await api.removeFromCart(id);
        }
      }

      await refreshCart();
      await loadProducts();
    });

    // Cart button
    dom.cartBtn.addEventListener('click', openCart);
    dom.cartClose.addEventListener('click', closeCart);
    dom.cartOverlay.addEventListener('click', closeCart);

    // Cart body — quantity / remove
    dom.cartBody.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-id]');
      if (!btn) return;
      const id = btn.dataset.id;
      const action = btn.dataset.action;

      if (action === 'cart-increase') {
        const item = cartData.items.find(i => i.productId === id);
        await api.updateCartItem(id, item.quantity + 1);
      } else if (action === 'cart-decrease') {
        const item = cartData.items.find(i => i.productId === id);
        if (item.quantity > 1) {
          await api.updateCartItem(id, item.quantity - 1);
        } else {
          await api.removeFromCart(id);
        }
      } else if (action === 'cart-remove') {
        await api.removeFromCart(id);
        showToast('Item removed');
      }

      await refreshCart();
      await loadProducts();
    });

    // Clear cart
    dom.btnClearCart.addEventListener('click', async () => {
      await api.clearCart();
      await refreshCart();
      await loadProducts();
      showToast('Cart cleared');
    });

    // Checkout
    dom.btnCheckout.addEventListener('click', openCheckout);
    dom.checkoutClose.addEventListener('click', closeCheckout);
    dom.checkoutOverlay.addEventListener('click', (e) => {
      if (e.target === dom.checkoutOverlay) closeCheckout();
    });
    dom.checkoutForm.addEventListener('submit', submitOrder);

    // Confirmation
    dom.btnContinue.addEventListener('click', closeConfirmation);
    dom.confirmOverlay.addEventListener('click', (e) => {
      if (e.target === dom.confirmOverlay) closeConfirmation();
    });

    // Orders
    dom.btnOrders.addEventListener('click', openOrders);
    dom.ordersClose.addEventListener('click', closeOrders);
    dom.ordersOverlay.addEventListener('click', (e) => {
      if (e.target === dom.ordersOverlay) closeOrders();
    });

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
      document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
    });
  }

  // ---- Boot ----
  document.addEventListener('DOMContentLoaded', init);
})();
