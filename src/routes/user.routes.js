const express = require('express');
const router = express.Router();

// Routes utilisateurs (à implémenter si nécessaire)
router.get('/', (req, res) => {
  res.json({ message: 'Routes utilisateurs' });
});

module.exports = router;
