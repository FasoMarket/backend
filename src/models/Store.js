const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom de la boutique est requis'],
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'La description est requise']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  logo: {
    type: String,
    default: null
  },
  banner: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  socialLinks: {
    facebook: { type: String, trim: true },
    instagram: { type: String, trim: true },
    twitter: { type: String, trim: true },
    youtube: { type: String, trim: true }
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  }
}, {
  timestamps: true
});

// Générer automatiquement le slug à partir du nom
storeSchema.pre('save', function(next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Supprimer caractères spéciaux
      .replace(/\s+/g, '-')         // Remplacer espaces par tirets
      .replace(/-+/g, '-')          // Éviter tirets multiples
      .trim('-');                   // Supprimer tirets début/fin
    
    // Ajouter un suffixe si le slug existe déjà
    const timestamp = Date.now().toString().slice(-4);
    this.slug = `${this.slug}-${timestamp}`;
  }
  next();
});

module.exports = mongoose.model('Store', storeSchema);
