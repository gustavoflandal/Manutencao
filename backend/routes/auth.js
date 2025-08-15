const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { authenticate } = require('../middleware/auth');

// Rotas públicas
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refreshToken);

// Rotas protegidas
router.post('/logout', authenticate, AuthController.logout);
router.get('/verify', authenticate, AuthController.verify);
router.post('/change-password', authenticate, AuthController.changePassword);

module.exports = router;
