const express = require('express');
const { createUser, getAllUsers, updateUser, deleteUser, getAllAreas } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/users', authMiddleware, getAllUsers);
router.post('/users', authMiddleware, createUser);
router.put('/users/:rp', authMiddleware, updateUser);
router.delete('/users/:rp', authMiddleware, deleteUser);
router.get('/areas', authMiddleware, getAllAreas); // 🔹 Nueva ruta para obtener áreas

module.exports = router;
