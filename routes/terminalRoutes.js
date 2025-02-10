const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { getTerminales, createTerminal, updateTerminal, uploadPhotos } = require('../controllers/terminalController');
const authMiddleware = require('../middleware/authMiddleware');

// 📂 Asegurar que la carpeta `uploads/` existe
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 🖼 Configuración de almacenamiento de imágenes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Rutas
router.get('/terminales', authMiddleware, getTerminales);
router.post('/terminales', authMiddleware, createTerminal);
router.put('/terminales/:id', authMiddleware, updateTerminal);
router.post('/terminales/upload', upload.array('photos', 7), uploadPhotos);

module.exports = router;
