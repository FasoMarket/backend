const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { registerLimiter, loginLimiter } = require('../middlewares/rateLimiter.middleware');
const upload = require('../config/multer');

// Validation pour l'inscription
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Le nom est requis'),
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('role').optional().isIn(['customer', 'vendor']).withMessage('Rôle invalide'),
  validate
];

// Validation pour la connexion
const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Le mot de passe est requis'),
  validate
];

// Validation pour le changement de mot de passe
const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Le mot de passe actuel est requis'),
  body('newPassword').isLength({ min: 6 }).withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères'),
  validate
];

router.post('/register', registerLimiter, upload.single('avatar'), registerValidation, authController.register);
router.post('/login', loginLimiter, loginValidation, authController.login);
router.get('/profile', protect, authController.getProfile);
router.put('/profile', protect, upload.single('avatar'), authController.updateProfile);
router.put('/change-password', protect, changePasswordValidation, authController.changePassword);
router.post('/logout', protect, authController.logout);

module.exports = router;
