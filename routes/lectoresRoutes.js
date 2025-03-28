const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const {
    getLectores, createLector, updateLector, uploadPhotos,
    getHistorial, marcarLectorDanado, obtenerLectoresDanados,
    actualizarLectorDanado, getLectoresPorArea, saveSupervisionData,
    updateSupervisionData, getSupervisionHistorial, getSupervisionesPorArea,
    getPiezasLectores, updatePiezaLector, subirArchivoPDF
} = require('../controllers/lectorController');

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
router.get('/lectores', authMiddleware, getLectores);
router.post('/lectores', authMiddleware, createLector);
router.put('/lectores/:id', authMiddleware, updateLector);
router.post('/lectores/upload', upload.array('photos', 7), uploadPhotos);

router.get('/lectores/historial', authMiddleware, getHistorial);

router.post('/lectores/danados', authMiddleware, marcarLectorDanado);
router.get('/lectores/danados', authMiddleware, obtenerLectoresDanados);
router.put('/lectores/danados/:id', authMiddleware, actualizarLectorDanado);

router.get('/lectores/area/:area', authMiddleware, getLectoresPorArea);

router.post('/lectores/supervision', authMiddleware, saveSupervisionData);
router.put('/lectores/supervision/update', authMiddleware, updateSupervisionData);

router.get('/lectores/supervision/historial/:lectorId', authMiddleware, getSupervisionHistorial);
router.get('/lectores/supervision/area/:area', authMiddleware, getSupervisionesPorArea);

router.get('/piezas-lectores', authMiddleware, getPiezasLectores);
router.put('/piezas-lectores/:id', authMiddleware, updatePiezaLector);

router.post(
    '/lectores/danados/:id/pdf',
    authMiddleware,
    upload.single('archivo'),
    subirArchivoPDF
);

module.exports = router;
