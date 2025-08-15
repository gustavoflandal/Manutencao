const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Estoque - implementação pendente', data: [] });
});

module.exports = router;
