const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom du produit est requis'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'La description est requise']
  },
  price: {
    type: Number,
    required: [true, 'Le prix est requis'],
    min: 0
  },
  category: {
    type: String,
    required: [true, 'La catégorie est requise'],
    trim: true
  },
  images: [{
    type: String
  }],
  stock: {
    type: Number,
    required: [true, 'Le stock est requis'],
    min: 0,
    default: 0
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  }
}, {
  timestamps: true
});

// Index pour la recherche
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ store: 1 });

module.exports = mongoose.model('Product', productSchema);
