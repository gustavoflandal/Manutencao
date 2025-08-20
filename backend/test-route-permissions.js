// Teste rápido das rotas analytics
const express = require('express');
const { requireRole } = require('./middleware/permissions');

console.log('requireRole type:', typeof requireRole);
console.log('requireRole function call result:', typeof requireRole('tecnico'));

const router = express.Router();

// Teste simples
router.get('/test', requireRole('tecnico'), (req, res) => {
  res.json({ message: 'OK' });
});

console.log('Router criado com sucesso!');