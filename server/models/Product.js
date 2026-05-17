const fs = require('fs');
const path = require('path');

// Load seed data
const dataPath = path.join(__dirname, '..', 'data', 'products.json');
let products = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

const Product = {
  getAll(category = null, search = null) {
    let result = [...products];

    if (category && category !== 'All') {
      result = result.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      const term = search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
      );
    }

    return result;
  },

  getById(id) {
    return products.find(p => p.id === id) || null;
  },

  getCategories() {
    return [...new Set(products.map(p => p.category))];
  }
};

module.exports = Product;
