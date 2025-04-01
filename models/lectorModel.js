const db = require('../config/db');

// ======================= LECTORES =======================
const Lector = {};

// Obtener todos los lectores
Lector.getAll = (callback) => {
    db.query('SELECT * FROM lectores', callback);
};

// Obtener lectores por área
Lector.getByArea = (area, callback) => {
    const query = `
        SELECT l.id, l.marca, l.modelo, l.folio, l.tipo_conector, 
               l.rpe_responsable, l.nombre_responsable, l.usuario_id 
        FROM lectores l
        JOIN usuarios u ON l.usuario_id = u.id
        JOIN areas a ON u.area_id = a.id
        WHERE a.nom_area = ?;
    `;
    db.query(query, [area], callback);
};

// Crear lector
Lector.create = (marca, modelo, folio, tipoConector, rpe, nombre, usuarioId, area, callback) => {
    const query = 'INSERT INTO lectores (marca, modelo, folio, tipo_conector, rpe_responsable, nombre_responsable, usuario_id, area) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [marca, modelo, folio, tipoConector, rpe, nombre, usuarioId, area], callback);
};

// Actualizar lector
Lector.update = (id, marca, modelo, folio, tipoConector, rpe, nombre, usuarioId, area, callback) => {
    const query = 'UPDATE lectores SET marca = ?, modelo = ?, folio = ?, tipo_conector = ?, rpe_responsable = ?, nombre_responsable = ?, usuario_id = ?, area = ? WHERE id = ?';
    db.query(query, [marca, modelo, folio, tipoConector, rpe, nombre, usuarioId, area, id], callback);
};

// Piezas de lectores
Lector.getPiezasLectores = (callback) => {
    db.query('SELECT * FROM piezas_lectores', callback);
};

Lector.updatePiezaLector = (id, nombre, costo, callback) => {
    const query = 'UPDATE piezas_lectores SET nombre_pieza = ?, costo = ? WHERE id = ?';
    db.query(query, [nombre, costo, id], callback);
};

// Subir PDF
Lector.subirArchivoPDF = (id, rutaPDF, callback) => {
    const query = "UPDATE lectores_danados SET archivo_pdf = ? WHERE id = ?";
    db.query(query, [rutaPDF, id], callback);
};

// =================== FOTOS DE LECTORES ===================
const LectorFoto = {
    create: (lectorId, fotoUrls, callback) => {
        if (!fotoUrls || fotoUrls.length === 0) {
            return callback(new Error("No se proporcionaron fotos"));
        }

        const query = "INSERT INTO lectores_fotos (lector_id, foto_url, fecha_subida) VALUES ?";
        const values = fotoUrls.map(url => [lectorId, url, new Date()]);

        db.query(query, [values], callback);
    },

    getByLectorId: (lectorId, callback) => {
        const query = "SELECT * FROM lectores_fotos WHERE lector_id = ? ORDER BY fecha_subida DESC";
        db.query(query, [lectorId], callback);
    },

    countWeeklyUploads: (lectorId, callback) => {
        const query = `
            SELECT COUNT(*) AS total FROM lectores_fotos 
            WHERE lector_id = ? AND fecha_subida >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `;
        db.query(query, [lectorId], (err, result) => {
            if (err) return callback(err);
            callback(null, result.length > 0 ? result[0].total : 0);
        });
    }
};

// =================== HISTORIAL DE LECTORES ===================
const HistorialLector = {
    create: (lectorId, marca, modelo, folio, tipoConector, rpe, nombre, usuarioId, area, accion, realizadoPor, callback) => {
        const query = `INSERT INTO historial_lectores 
                      (lector_id, marca, modelo, folio, tipo_conector, rpe_responsable, nombre_responsable, usuario_id, area, accion, realizado_por, fecha) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
        db.query(query, [lectorId, marca, modelo, folio, tipoConector, rpe, nombre, usuarioId, area, accion, realizadoPor], callback);
    },

    getAll: (callback) => {
        db.query("SELECT * FROM historial_lectores ORDER BY fecha DESC", callback);
    }
};

// =================== LECTORES DAÑADOS ===================
const LectorDanado = {
    create: (lectorId, marca, modelo, area, folio, tipoConector, callback) => {
        const query = `INSERT INTO lectores_danados (lector_id, marca, modelo, area, folio, tipo_conector) VALUES (?, ?, ?, ?, ?, ?)`;
        db.query(query, [lectorId, marca, modelo, area, folio, tipoConector], callback);
    },

    update: (id, fechaReporte, fechaGuia, fechaDiagnostico, fechaAutorizacion, fechaReparacion, diasReparacion, costo, piezasReparadas, observaciones, ticket, callback) => {
        const formatDate = (date) => (date ? new Date(date).toISOString().split("T")[0] : null);

        const query = `UPDATE lectores_danados 
                       SET fecha_reporte = ?, fecha_guia = ?, fecha_diagnostico = ?, 
                           fecha_autorizacion = ?, fecha_reparacion = ?, dias_reparacion = ?, 
                           costo = ?, piezas_reparadas = ?, observaciones = ?, ticket = ?
                       WHERE id = ?`;

        db.query(query, [
            formatDate(fechaReporte),
            formatDate(fechaGuia),
            formatDate(fechaDiagnostico),
            formatDate(fechaAutorizacion),
            formatDate(fechaReparacion),
            diasReparacion,
            costo,
            piezasReparadas,
            observaciones,
            ticket,
            id
        ], callback);
    },

    getAll: (callback) => {
        db.query("SELECT * FROM lectores_danados", callback);
    }
};

// ✅ Modelo para datos de supervisión de lectores
const SupervisionLector = {};

// 🔹 Guardar datos de supervisión
SupervisionLector.save = (data, callback) => {
    const query = `
        INSERT INTO supervision_lectores (
            lector_id, 
            fotografia_conector,
            fotografia_cincho_folio,
            fotografia_cabezal,
            registro_ctrl_lectores,
            ubicacion_ctrl_lectores,
            registro_siitic,
            ubicacion_siitic,
            total,
            area
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            fotografia_conector = VALUES(fotografia_conector),
            fotografia_cincho_folio = VALUES(fotografia_cincho_folio),
            fotografia_cabezal = VALUES(fotografia_cabezal),
            registro_ctrl_lectores = VALUES(registro_ctrl_lectores),
            ubicacion_ctrl_lectores = VALUES(ubicacion_ctrl_lectores),
            registro_siitic = VALUES(registro_siitic),
            ubicacion_siitic = VALUES(ubicacion_siitic),
            total = VALUES(total),
            area = VALUES(area)
    `;

    // ✅ Convertir valores vacíos en NULL o valores por defecto
    const format = (val, isNum = false) => {
        return (val === "" || val === undefined || val === null)
            ? (isNum ? 0 : null)
            : val;
    };

    db.query(query, [
        format(data.lector_id, true),
        format(data.fotografia_conector, true),
        format(data.fotografia_cincho_folio, true),
        format(data.fotografia_cabezal, true),
        format(data.registro_ctrl_lectores, true),
        format(data.ubicacion_ctrl_lectores, true),
        format(data.registro_siitic, true),
        format(data.ubicacion_siitic, true),
        format(data.total, true),
        format(data.area)
    ], callback);
};

// 🔹 Obtener supervisión por ID de lector
SupervisionLector.getByLectorId = (lectorId, callback) => {
    const query = `
        SELECT 
            s.*, 
            l.folio,
            l.marca,
            l.modelo,
            l.tipo_conector
        FROM supervision_lectores s
        JOIN lectores l ON s.lector_id = l.id
        WHERE s.lector_id = ?
        ORDER BY s.id DESC
    `;
    db.query(query, [lectorId], callback);
};

// 🔹 Obtener supervisiones por área
SupervisionLector.getByArea = (area, callback) => {
    const query = `
        SELECT 
            s.*, 
            l.folio,
            l.marca,
            l.modelo,
            l.tipo_conector
        FROM supervision_lectores s
        JOIN lectores l ON s.lector_id = l.id
        WHERE l.area = ?
        ORDER BY s.id DESC
    `;
    db.query(query, [area], callback);
};

// 🔹 Actualizar campo individual de supervisión
SupervisionLector.updateField = (lectorId, field, value, callback) => {
    const query = `UPDATE supervision_lectores SET ?? = ? WHERE lector_id = ?`;
    db.query(query, [field, value, lectorId], callback);
};

// 🔁 Reasignar lectores de un responsable a otro
Lector.updateResponsablePorRP = (rpAntiguo, rpNuevo, nombreNuevo, callback) => {
    const query = `
        UPDATE lectores 
        SET rpe_responsable = ?, nombre_responsable = ? 
        WHERE rpe_responsable = ?
    `;
    db.query(query, [rpNuevo, nombreNuevo, rpAntiguo], callback);
};

// 🔥 Quitar responsables cuando se queda sin jefe de centro
Lector.quitarResponsableDeArea = (area, callback) => {
    const query = `
        UPDATE lectores 
        SET rpe_responsable = '-', nombre_responsable = '-' 
        WHERE area = ? AND rpe_responsable IS NOT NULL
    `;
    db.query(query, [area], callback);
};

// ➕ Asignar nuevo jefe a lectores sin responsable
Lector.asignarResponsableAreaVacia = (areaNombre, rp, nombre, callback) => {
    const query = `
        UPDATE lectores
        SET rpe_responsable = ?, nombre_responsable = ?
        WHERE area = ? AND (
            rpe_responsable IS NULL OR 
            rpe_responsable = '' OR 
            rpe_responsable = '-'
        )
    `;
    db.query(query, [rp, nombre, areaNombre], callback);
};

// 🔙 Quitar responsable si ya no es jefe
Lector.quitarResponsablePorRP = (rp, callback) => {
    const query = `
        UPDATE lectores
        SET rpe_responsable = '-', nombre_responsable = '-'
        WHERE rpe_responsable = ?
    `;
    db.query(query, [rp], callback);
};

// 🔍 Obtener lectores por RP de responsable
Lector.getByResponsable = (rp, callback) => {
    const query = `SELECT * FROM lectores WHERE rpe_responsable = ?`;
    db.query(query, [rp], callback);
};

module.exports = {
    Lector,
    LectorFoto,
    HistorialLector,
    LectorDanado,
    SupervisionLector
};
