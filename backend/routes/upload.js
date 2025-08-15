const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  res.json({ success: true, message: 'Upload - implementação pendente', data: {} });
});

module.exports = router;
