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

router.post('/', protect, authorize('vendor'), checkVendorApproval, upload.single('logo'), storeValidation, storeController.createStore);
router.get('/', storeController.getAllStores);
router.get('/:identifier', storeController.getStoreByIdOrSlug);
router.get('/:identifier/products', storeController.getStoreProducts);
router.put('/:id', protect, authorize('vendor'), checkStoreOwnership, upload.single('logo'), storeController.updateStore);
router.delete('/:id', protect, authorize('vendor'), checkStoreOwnership, storeController.deleteStore);

module.exports = router;
