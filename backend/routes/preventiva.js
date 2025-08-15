const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Preventiva - implementação pendente', data: [] });
});

module.exports = router;
