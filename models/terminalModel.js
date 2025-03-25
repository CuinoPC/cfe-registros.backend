const db = require('../config/db'); // Importa la conexión MySQL

const Terminal = {};

// Obtener todas las terminales
Terminal.getAll = (callback) => {
    db.query('SELECT * FROM terminales', callback);
};

// Obtener terminales por área
Terminal.getByArea = (area, callback) => {
    const query = `
        SELECT t.id, t.marca, t.modelo, t.serie, t.inventario, 
               t.rpe_responsable, t.nombre_responsable, t.usuario_id 
        FROM terminales t
        JOIN usuarios u ON t.usuario_id = u.id
        JOIN areas a ON u.area_id = a.id
        WHERE a.nom_area = ?;
    `;

    db.query(query, [area], callback);
};

// Crear una nueva terminal
Terminal.create = (marca, modelo, serie, inventario, rpe, nombre, usuarioId, area, callback) => {
    const query = 'INSERT INTO terminales (marca, modelo, serie, inventario, rpe_responsable, nombre_responsable, usuario_id, area) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [marca, modelo, serie, inventario, rpe, nombre, usuarioId, area], callback);
},

    // Actualizar una terminal existente
    Terminal.update = (id, marca, modelo, serie, inventario, rpe, nombre, usuarioId, area, callback) => {
        const query = 'UPDATE terminales SET marca = ?, modelo = ?, serie = ?, inventario = ?, rpe_responsable = ?, nombre_responsable = ?, usuario_id = ?, area = ? WHERE id = ?';
        db.query(query, [marca, modelo, serie, inventario, rpe, nombre, usuarioId, area, id], callback);
    };

// ✅ Modelo para guardar y recuperar fotos de terminales
const TerminalFoto = {
    create: (terminalId, fotoUrls, callback) => {
        if (!fotoUrls || fotoUrls.length === 0) {
            return callback(new Error("No se proporcionaron fotos"));
        }

        const query = "INSERT INTO terminales_fotos (terminal_id, foto_url, fecha_subida) VALUES ?";
        const values = fotoUrls.map(url => [terminalId, url, new Date()]);

        db.query(query, [values], (err, result) => {
            if (err) return callback(err);
            callback(null, result);
        });
    },

    getByTerminalId: (terminalId, callback) => {
        const query = "SELECT * FROM terminales_fotos WHERE terminal_id = ? ORDER BY fecha_subida DESC";
        db.query(query, [terminalId], callback);
    },

    countWeeklyUploads: (terminalId, callback) => {
        const query = `
            SELECT COUNT(*) AS total FROM terminales_fotos 
            WHERE terminal_id = ? 
            AND fecha_subida >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `;
        db.query(query, [terminalId], (err, result) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, result.length > 0 ? result[0].total : 0);
        });
    }
};

const HistorialTerminal = {
    create: (terminalId, marca, modelo, serie, inventario, rpe, nombre, usuarioId, area, accion, callback) => {
        const query = `INSERT INTO historial_terminales 
                      (terminal_id, marca, modelo, serie, inventario, rpe_responsable, nombre_responsable, usuario_id, area, accion, fecha) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
        db.query(query, [terminalId, marca, modelo, serie, inventario, rpe, nombre, usuarioId, area, accion], callback);
    },

    getAll: (callback) => {
        const query = "SELECT * FROM historial_terminales ORDER BY fecha DESC";
        db.query(query, callback);
    }
};

const TerminalDanada = {
    create: (terminalId, marca, modelo, area, serie, inventario, callback) => {
        const query = `INSERT INTO terminales_danadas (terminal_id, marca, modelo, area, serie, inventario) VALUES (?, ?, ?, ?, ?, ?)`;
        db.query(query, [terminalId, marca, modelo, area, serie, inventario], callback);
    },

    update: (id, fechaReporte, fechaGuia, fechaDiagnostico, fechaAutorizacion, fechaReparacion, diasReparacion, costo, piezasReparadas, observaciones, ticket, callback) => {
        const query = `UPDATE terminales_danadas 
                       SET fecha_reporte = ?, fecha_guia = ?, fecha_diagnostico = ?, 
                           fecha_autorizacion = ?, fecha_reparacion = ?, dias_reparacion = ?, 
                           costo = ?, piezas_reparadas = ?, observaciones = ?, ticket = ? 
                       WHERE id = ?`;

        // ✅ Asegurar que las fechas estén en formato 'YYYY-MM-DD' o NULL si no hay valor
        const formatDate = (date) => (date ? new Date(date).toISOString().split("T")[0] : null);

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
        db.query("SELECT * FROM terminales_danadas", callback);
    }
};

// ✅ Modelo para datos de supervisión
const SupervisionTerminal = {};

// 🔹 Guardar datos de supervisión
SupervisionTerminal.save = (data, callback) => {
    const query = `
        INSERT INTO supervision_terminales (terminal_id, anio_antiguedad, rpe_usuario, fotografias_fisicas,
            etiqueta_activo_fijo, chip_con_serie_tableta, foto_carcasa, apn, correo_gmail, seguridad_desbloqueo,
            coincide_serie_sim_imei, responsiva_apn, centro_trabajo_correcto, responsiva, serie_correcta_sistic,
            serie_correcta_siitic, asignacion_rpe_mysap, total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            anio_antiguedad = VALUES(anio_antiguedad),
            rpe_usuario = VALUES(rpe_usuario),
            fotografias_fisicas = VALUES(fotografias_fisicas),
            etiqueta_activo_fijo = VALUES(etiqueta_activo_fijo),
            chip_con_serie_tableta = VALUES(chip_con_serie_tableta),
            foto_carcasa = VALUES(foto_carcasa),
            apn = VALUES(apn),
            correo_gmail = VALUES(correo_gmail),
            seguridad_desbloqueo = VALUES(seguridad_desbloqueo),
            coincide_serie_sim_imei = VALUES(coincide_serie_sim_imei),
            responsiva_apn = VALUES(responsiva_apn),
            centro_trabajo_correcto = VALUES(centro_trabajo_correcto),
            responsiva = VALUES(responsiva),
            serie_correcta_sistic = VALUES(serie_correcta_sistic),
            serie_correcta_siitic = VALUES(serie_correcta_siitic),
            asignacion_rpe_mysap = VALUES(asignacion_rpe_mysap),
            total = VALUES(total);
    `;

    // ✅ Convertir valores vacíos en NULL o valores por defecto
    const formatValue = (value, isNumber = false) => {
        if (value === "" || value === undefined || value === null) {
            return isNumber ? 0 : null;
        }
        return value;
    };

    db.query(query, [
        formatValue(data.terminal_id, true),
        formatValue(data.anio_antiguedad),
        formatValue(data.rpe_usuario),
        formatValue(data.fotografias_fisicas, true),
        formatValue(data.etiqueta_activo_fijo, true),
        formatValue(data.chip_con_serie_tableta, true),
        formatValue(data.foto_carcasa, true),
        formatValue(data.apn, true),
        formatValue(data.correo_gmail),
        formatValue(data.seguridad_desbloqueo, true),
        formatValue(data.coincide_serie_sim_imei, true),
        formatValue(data.responsiva_apn, true),
        formatValue(data.centro_trabajo_correcto, true),
        formatValue(data.responsiva, true),
        formatValue(data.serie_correcta_sistic, true),
        formatValue(data.serie_correcta_siitic, true),
        formatValue(data.asignacion_rpe_mysap, true),
        formatValue(data.total, true)
    ], callback);
};

// ✅ Nueva función para actualizar un solo campo en la supervisión
SupervisionTerminal.updateField = (terminalId, field, value, callback) => {
    const query = `UPDATE supervision_terminales SET ?? = ? WHERE terminal_id = ?`;
    db.query(query, [field, value, terminalId], callback);
};

SupervisionTerminal.getByTerminalId = (terminalId, callback) => {
    const query = `
        SELECT 
            s.*, 
            t.serie, 
            t.inventario 
        FROM supervision_terminales s
        JOIN terminales t ON s.terminal_id = t.id
        WHERE s.terminal_id = ?
        ORDER BY s.id DESC
    `;
    db.query(query, [terminalId], callback);
};

Terminal.getPiezasTPS = (callback) => {
    const query = 'SELECT * FROM piezas_tps';
    db.query(query, callback);
};

Terminal.updatePiezaTPS = (id, nombre, costo, callback) => {
    const query = 'UPDATE piezas_tps SET nombre_pieza = ?, costo = ? WHERE id = ?';
    db.query(query, [nombre, costo, id], callback);
};

Terminal.subirArchivoPDF = (id, rutaPDF, callback) => {
    const query = "UPDATE terminales_danadas SET archivo_pdf = ? WHERE id = ?";
    db.query(query, [rutaPDF, id], callback);
};

Terminal.updateResponsablePorRP = (rpAntiguo, rpNuevo, nombreNuevo, callback) => {
    const query = `UPDATE terminales 
                   SET rpe_responsable = ?, nombre_responsable = ? 
                   WHERE rpe_responsable = ?`;
    db.query(query, [rpNuevo, nombreNuevo, rpAntiguo], callback);
};

Terminal.quitarResponsableDeArea = (area, callback) => {
    const query = `UPDATE terminales 
                   SET rpe_responsable = '-', nombre_responsable = '-' 
                   WHERE area = ? AND rpe_responsable IS NOT NULL`;
    db.query(query, [area], callback);
  };
  

Terminal.asignarResponsableAreaVacia = (areaNombre, rp, nombre, callback) => {
    const query = `
        UPDATE terminales
        SET rpe_responsable = ?, nombre_responsable = ?
        WHERE area = ? AND (rpe_responsable = '' OR rpe_responsable IS NULL)
    `;
    db.query(query, [rp, nombre, areaNombre], callback);
};

Terminal.asignarResponsableAreaVacia = (areaNombre, rp, nombre, callback) => {
    const query = `
        UPDATE terminales
        SET rpe_responsable = ?, nombre_responsable = ?
        WHERE area = ?
        AND (rpe_responsable IS NULL OR rpe_responsable = '' OR rpe_responsable = '-')
    `;
    db.query(query, [rp, nombre, areaNombre], callback);
};

  


module.exports = { Terminal, TerminalFoto, HistorialTerminal, TerminalDanada, SupervisionTerminal };
