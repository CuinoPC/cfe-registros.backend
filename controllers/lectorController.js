const {
    Lector,
    LectorFoto,
    HistorialLector,
    LectorDanado,
    SupervisionLector
} = require('../models/lectorModel');

// 1. Obtener todos los lectores
const getLectores = (req, res) => {
    Lector.getAll((err, results) => {
        if (err) return res.status(500).json({ message: "Error interno del servidor" });

        const lectores = results;
        const promises = lectores.map(lector => {
            return new Promise((resolve, reject) => {
                LectorFoto.getByLectorId(lector.id, (err, fotos) => {
                    if (err) return reject(err);

                    const fotosPorFecha = {};
                    fotos.forEach(foto => {
                        const fecha = new Date(foto.fecha_subida).toISOString().split("T")[0];
                        if (!fotosPorFecha[fecha]) fotosPorFecha[fecha] = [];
                        fotosPorFecha[fecha].push(foto.foto_url);
                    });

                    lector.fotos = fotosPorFecha;
                    resolve();
                });
            });
        });

        Promise.all(promises)
            .then(() => res.status(200).json(lectores))
            .catch(() => res.status(500).json({ message: "Error al obtener fotos" }));
    });
};

// 2. Crear lector
const createLector = (req, res) => {
    const { marca, modelo, folio, tipo_conector, rpe_responsable, nombre_responsable, usuario_id, area } = req.body;

    if (!marca || !modelo || !folio || !tipo_conector || !usuario_id || !area) {
        return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    const realizadoPor = req.body.realizado_por;

    Lector.create(marca, modelo, folio, tipo_conector, rpe_responsable, nombre_responsable, usuario_id, area, (err, result) => {
        if (err) return res.status(500).json({ message: "Error al crear el lector" });

        const lectorId = result.insertId;
        HistorialLector.create(lectorId, marca, modelo, folio, tipo_conector, rpe_responsable, nombre_responsable, usuario_id, area, 'Creación', realizadoPor, () => {});
        res.status(201).json({ message: "Lector creado con éxito", id: lectorId });
    });
};

// 3. Actualizar lector
const updateLector = (req, res) => {
    const { id } = req.params;
    const { marca, modelo, folio, tipo_conector, rpe_responsable, nombre_responsable, usuario_id, area } = req.body;

    if (!marca || !modelo || !folio || !tipo_conector || !usuario_id || !area) {
        return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    const realizadoPor = req.body.realizado_por;

    Lector.update(id, marca, modelo, folio, tipo_conector, rpe_responsable, nombre_responsable, usuario_id, area, (err) => {
        if (err) return res.status(500).json({ message: "Error al actualizar el lector" });

        HistorialLector.create(id, marca, modelo, folio, tipo_conector, rpe_responsable, nombre_responsable, usuario_id, area, 'Actualización', realizadoPor, () => {});
        res.status(200).json({ message: "Lector actualizado con éxito" });
    });
};

// 4. Subir fotos
const uploadPhotos = (req, res) => {
    if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'No se subieron fotos' });

    const lectorId = req.body.lectorId;
    if (!lectorId) return res.status(400).json({ message: 'lectorId es requerido' });

    LectorFoto.countWeeklyUploads(lectorId, (err, count) => {
        if (err) return res.status(500).json({ message: 'Error al verificar fotos' });

        if (count + req.files.length > 10) {
            return res.status(400).json({ message: 'Límite de 10 fotos por semana alcanzado' });
        }

        const photoUrls = req.files.map(file => `/uploads/${file.filename}`);
        LectorFoto.create(lectorId, photoUrls, (err) => {
            if (err) return res.status(500).json({ message: 'Error al guardar fotos' });

            res.status(200).json({ message: 'Fotos subidas correctamente', urls: photoUrls });
        });
    });
};

// 5. Historial
const getHistorial = (req, res) => {
    HistorialLector.getAll((err, results) => {
        if (err) return res.status(500).json({ message: "Error al obtener historial" });
        res.status(200).json(results);
    });
};

// 6. Marcar lector dañado
const marcarLectorDanado = (req, res) => {
    const { lectorId, marca, modelo, area, folio, tipo_conector } = req.body;

    LectorDanado.create(lectorId, marca, modelo, area, folio, tipo_conector, (err) => {
        if (err) return res.status(500).json({ error: "Error al registrar lector dañado" });

        res.status(201).json({ message: "Lector marcado como dañado correctamente" });
    });
};

// 7. Obtener lectores dañados
const obtenerLectoresDanados = (req, res) => {
    LectorDanado.getAll((err, results) => {
        if (err) return res.status(500).json({ error: "Error al obtener lectores dañados" });

        res.status(200).json(results);
    });
};

// 8. Actualizar lector dañado
const actualizarLectorDanado = (req, res) => {
    const { id } = req.params;
    let {
        fechaReporte,
        fechaGuia,
        fechaDiagnostico,
        fechaAutorizacion,
        fechaReparacion,
        diasReparacion,
        costo,
        piezasReparadas,
        observaciones,
        ticket
    } = req.body;

    if (!id) return res.status(400).json({ message: "El ID del lector dañado es obligatorio" });

    const formatDate = (date) => date ? new Date(date).toISOString().split("T")[0] : null;

    fechaReporte = formatDate(fechaReporte);
    fechaGuia = formatDate(fechaGuia);
    fechaDiagnostico = formatDate(fechaDiagnostico);
    fechaAutorizacion = formatDate(fechaAutorizacion);
    fechaReparacion = formatDate(fechaReparacion);

    LectorDanado.update(id, fechaReporte, fechaGuia, fechaDiagnostico, fechaAutorizacion, fechaReparacion, diasReparacion, costo, piezasReparadas, observaciones, ticket, (err, result) => {
        if (err) return res.status(500).json({ error: "Error al actualizar lector dañado" });
        if (result.affectedRows === 0) return res.status(404).json({ message: "Lector dañado no encontrado" });

        res.status(200).json({ message: "Lector dañado actualizado correctamente" });
    });
};

// 9. Obtener lectores por área
const getLectoresPorArea = (req, res) => {
    const { area } = req.params;

    Lector.getByArea(area, (err, results) => {
        if (err) return res.status(500).json({ message: "Error interno del servidor" });
        res.status(200).json(results.length > 0 ? results : []);
    });
};

// ✅ Guardar datos de supervisión de lector
const saveSupervisionData = (req, res) => {
    const supervisionData = req.body;

    SupervisionLector.save(supervisionData, (err, result) => {
        if (err) {
            console.error("Error al guardar datos de supervisión:", err);
            res.status(500).json({ message: "Error interno del servidor" });
        } else {
            res.status(201).json({ message: "Datos de supervisión guardados correctamente" });
        }
    });
};

// ✅ Actualizar un campo de supervisión de lector en tiempo real
const updateSupervisionData = (req, res) => {
    const { lector_id, field, value } = req.body;

    SupervisionLector.updateField(lector_id, field, value, (err, result) => {
        if (err) {
            console.error("Error al actualizar supervisión:", err);
            res.status(500).json({ message: "Error interno del servidor" });
        } else {
            res.status(200).json({ message: "Campo actualizado correctamente" });
        }
    });
};

// ✅ Obtener historial de supervisión por lector
const getSupervisionHistorial = (req, res) => {
    const { lectorId } = req.params;

    SupervisionLector.getByLectorId(lectorId, (err, results) => {
        if (err) {
            console.error("Error al obtener historial de supervisión:", err);
            return res.status(500).json({ message: "Error interno" });
        }

        res.status(200).json(results);
    });
};

// ✅ Obtener todas las supervisiones por área
const getSupervisionesPorArea = (req, res) => {
    const { area } = req.params;

    SupervisionLector.getByArea(area, (err, results) => {
        if (err) {
            console.error("Error al obtener supervisiones por área:", err);
            res.status(500).json({ message: "Error interno del servidor" });
        } else {
            res.status(200).json(results);
        }
    });
};

// 14. Obtener piezas de lectores
const getPiezasLectores = (req, res) => {
    Lector.getPiezasLectores((err, results) => {
        if (err) return res.status(500).json({ error: "Error al obtener piezas" });
        res.status(200).json(results);
    });
};

// 15. Actualizar pieza
const updatePiezaLector = (req, res) => {
    const { id } = req.params;
    const { nombre_pieza, costo } = req.body;

    if (!nombre_pieza || costo === undefined) {
        return res.status(400).json({ message: "Nombre y costo son obligatorios" });
    }

    Lector.updatePiezaLector(id, nombre_pieza, costo, (err, result) => {
        if (err) return res.status(500).json({ error: "Error al actualizar la pieza" });
        if (result.affectedRows === 0) return res.status(404).json({ message: "Pieza no encontrada" });
        res.status(200).json({ message: "Pieza actualizada correctamente" });
    });
};

// 16. Subir archivo PDF
const subirArchivoPDF = (req, res) => {
    const id = req.params.id;
    const archivo = req.file;

    if (!archivo) return res.status(400).json({ error: "No se subió ningún archivo" });

    const rutaPDF = `/uploads/${archivo.filename}`;

    Lector.subirArchivoPDF(id, rutaPDF, (err, result) => {
        if (err) return res.status(500).json({ error: "Error al guardar PDF" });
        if (result.affectedRows === 0) return res.status(404).json({ error: "Lector no encontrado" });

        res.status(200).json({ mensaje: "Archivo subido", ruta: rutaPDF });
    });
};

// 17. Exportar todo
module.exports = {
    getLectores, createLector, updateLector,
    uploadPhotos, getHistorial, marcarLectorDanado,
    obtenerLectoresDanados, actualizarLectorDanado, getLectoresPorArea,
    saveSupervisionData, updateSupervisionData, getSupervisionHistorial,
    getSupervisionesPorArea, getPiezasLectores, updatePiezaLector,
    subirArchivoPDF
};
