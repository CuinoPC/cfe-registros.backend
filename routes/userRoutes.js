const express = require('express');
const { createUser, getAllUsers, updateUser, deleteUser } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Ruta para obtener todos los usuarios (solo accesible para administradores)
router.get('/users', authMiddleware, (req, res, next) => {
    if (!req.user.es_admin) {
        return res.status(403).json({ error: 'Acceso denegado' });
    }
    next();
}, getAllUsers);

// Ruta para crear un nuevo usuario (solo accesible para administradores)
router.post('/users', authMiddleware, (req, res, next) => {
    if (!req.user.es_admin) {
        return res.status(403).json({ error: 'Acceso denegado' });
    }
    next();
}, createUser);

// 🔹 Ruta para actualizar un usuario
router.put('/users/:rp', authMiddleware, (req, res, next) => {
    if (!req.user.es_admin) {
        return res.status(403).json({ error: 'Acceso denegado' });
    }
    next();
}, updateUser);

// 🔹 Ruta para eliminar un usuario
router.delete('/users/:rp', authMiddleware, (req, res, next) => {
    if (!req.user.es_admin) {
        return res.status(403).json({ error: 'Acceso denegado' });
    }
    next();
}, deleteUser);

module.exports = router;
