const express = require('express');
const router = express.Router();
const DepartmentController = require('../controllers/DepartmentController');

// Rotas públicas (sem autenticação)
router.get('/departments/active', DepartmentController.active);

module.exports = router;