const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const storeController = require('../controllers/store.controller');
const { protect, authorize, checkVendorApproval } = require('../middlewares/auth.middleware');
const { checkStoreOwnership } = require('../middlewares/ownership.middleware');
const { validate } = require('../middlewares/validation.middleware');
const upload = require('../config/multer');

const storeValidation = [
  body('name').trim().notEmpty().withMessage('Le nom de la boutique est requis'),
  body('description').trim().notEmpty().withMessage('La description est requise'),
  body('slug').optional().isSlug().withMessage('Le slug doit être valide (lettres, chiffres, tirets)'),
  validate
];

const uploadFields = upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'banner', maxCount: 1 }
]);

// Routes spécifiques AVANT les routes paramétrées
router.post('/', protect, authorize('vendor'), checkVendorApproval, uploadFields, storeValidation, storeController.createStore);
router.get('/my-store', protect, authorize('vendor'), storeController.getMyStore);
router.get('/', storeController.getAllStores);

// Routes paramétrées
router.get('/:identifier/products', storeController.getStoreProducts);
router.get('/:identifier/promo-codes', storeController.getStorePromoCodes);
router.get('/:identifier', storeController.getStoreByIdOrSlug);
router.put('/:id', protect, authorize('vendor'), checkStoreOwnership, uploadFields, storeController.updateStore);
router.delete('/:id', protect, authorize('vendor'), checkStoreOwnership, storeController.deleteStore);

module.exports = router;
