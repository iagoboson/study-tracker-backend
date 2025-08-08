const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Placeholder for future user management features
router.get('/profile', protect, (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user.toPublicJSON()
    }
  });
});

module.exports = router; 