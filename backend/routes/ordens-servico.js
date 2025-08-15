const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Ordens de serviço - implementação pendente', data: [] });
});

router.get('/:id', (req, res) => {
  res.json({ success: true, message: 'OS específica - implementação pendente', data: { id: req.params.id } });
});

router.post('/', (req, res) => {
  res.json({ success: true, message: 'OS criada - implementação pendente', data: { id: 1, ...req.body } });
});

router.put('/:id', (req, res) => {
  res.json({ success: true, message: 'OS atualizada - implementação pendente', data: { id: req.params.id, ...req.body } });
});

router.delete('/:id', (req, res) => {
  res.json({ success: true, message: 'OS excluída - implementação pendente' });
});

module.exports = router;
