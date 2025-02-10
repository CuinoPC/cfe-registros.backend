const express = require('express');
const router = express.Router();
const { getTerminales, createTerminal, updateTerminal } = require('../controllers/terminalController');
const authMiddleware = require('../middleware/authMiddleware'); // Asegúrate de que exista

// Ruta para obtener todas las terminales
router.get('/terminales', authMiddleware, getTerminales);

// Ruta para crear una nueva terminal
router.post('/terminales', authMiddleware, createTerminal);

// Ruta para actualizar una terminal existente
router.put('/terminales/:id', authMiddleware, updateTerminal);

module.exports = router;
