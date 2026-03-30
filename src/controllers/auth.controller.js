const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/sendResponse');

// Inscription
exports.register = async (req, res) => {
  try {
    let { name, email, password, role, phone, shopName, storeName, address, businessCategory, description } = req.body;
    
    // Fallback for shopName if storeName is provided
    if (!shopName && storeName) shopName = storeName;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    const avatar = req.file ? `/uploads/${req.file.filename}` : null;

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'customer',
      avatar,
      phone,
      shopName,
      address,
      businessCategory,
      description
    });

    const token = generateToken(user._id);

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVendorApproved: user.isVendorApproved,
        avatar: user.avatar
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Connexion
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const token = generateToken(user._id);

    console.log('🔐 Login - User:', { id: user._id, name: user.name, role: user.role, isVendorApproved: user.isVendorApproved });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVendorApproved: user.isVendorApproved,
        avatar: user.avatar
      },
      token
    });
  } catch (error) {
    console.error('❌ Erreur login:', error);
    res.status(500).json({ message: error.message });
  }
};

// Profil utilisateur
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour le profil
exports.updateProfile = async (req, res) => {
  try {
    const updates = { ...req.body };

    if (req.file) {
      updates.avatar = `/uploads/${req.file.filename}`;
    }

    // Ne pas permettre la modification du mot de passe ici
    delete updates.password;
    delete updates.role;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Changer le mot de passe
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    return sendError(res, 401, 'Mot de passe actuel incorrect');
  }

  user.password = newPassword;
  await user.save();

  sendSuccess(res, 200, null, 'Mot de passe modifié avec succès');
});

// Déconnexion (pour invalidation côté client)
exports.logout = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, null, 'Déconnexion réussie');
});
