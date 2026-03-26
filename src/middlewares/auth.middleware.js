const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Vérifier si l'utilisateur est authentifié
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      console.log('❌ Token manquant');
      return res.status(401).json({ message: 'Non autorisé, token manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      console.log('❌ Utilisateur non trouvé:', decoded.id);
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }

    console.log('✅ Utilisateur authentifié:', req.user._id);
    next();
  } catch (error) {
    console.log('❌ Erreur token:', error.message);
    res.status(401).json({ message: 'Token invalide' });
  }
};

// Vérifier les rôles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Le rôle ${req.user.role} n'est pas autorisé à accéder à cette ressource` 
      });
    }
    next();
  };
};

// Vérifier si le vendeur est approuvé
exports.checkVendorApproval = (req, res, next) => {
  if (req.user.role === 'vendor' && !req.user.isVendorApproved) {
    return res.status(403).json({ 
      message: 'Votre compte vendeur doit être approuvé par un administrateur' 
    });
  }
  next();
};
