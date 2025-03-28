const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { 
    getTerminales, createTerminal, updateTerminal, uploadPhotos, 
    getHistorial, marcarTerminalDanada,  obtenerTerminalesDanadas, 
    actualizarTerminalDanada, getTerminalesPorArea, saveSupervisionData, 
    updateSupervisionData, getSupervisionHistorial, getPiezasTPS,
    updatePiezaTPS, subirArchivoPDF, getSupervisionesPorArea,
    getMarcasTerminales, saveSupervisionHoneywell, updateSupervisionHoneywellField, 
    getSupervisionHoneywellHistorial, getSupervisionesHoneywellPorArea    
} = require('../controllers/terminalController');
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
router.post('/terminales/upload', upload.array('photos', 10), uploadPhotos);

router.get('/historial', authMiddleware, getHistorial);

router.post('/terminales/danadas', authMiddleware, marcarTerminalDanada);
router.get('/terminales/danadas', authMiddleware, obtenerTerminalesDanadas);

router.put('/terminales/danadas/:id', authMiddleware, actualizarTerminalDanada);

router.get('/terminales/area/:area', authMiddleware, getTerminalesPorArea);

router.post('/terminales/supervision', authMiddleware, saveSupervisionData);
router.put('/terminales/supervision/update', authMiddleware, updateSupervisionData);

router.get('/terminales/supervision/historial/:terminalId', authMiddleware, getSupervisionHistorial);
router.get('/terminales/supervision/area/:area', authMiddleware, getSupervisionesPorArea);

router.get('/piezas', authMiddleware, getPiezasTPS);
router.put('/piezas/:id', authMiddleware, updatePiezaTPS);

router.post(
    '/terminales/danadas/:id/pdf',
    authMiddleware,
    upload.single('archivo'),
    subirArchivoPDF
);

router.get('/terminales/marcas', authMiddleware, getMarcasTerminales);

router.post('/supervision-honeywell', authMiddleware, saveSupervisionHoneywell);
router.put('/supervision-honeywell/update', authMiddleware, updateSupervisionHoneywellField);
router.get('/supervision-honeywell/historial/:terminalId', authMiddleware, getSupervisionHoneywellHistorial);
router.get('/supervision-honeywell/area/:area', authMiddleware, getSupervisionesHoneywellPorArea);


module.exports = router;

