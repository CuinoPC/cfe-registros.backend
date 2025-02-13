const db = require('../config/db'); // Importa la conexión MySQL

const Terminal = {};

// Obtener todas las terminales
Terminal.getAll = (callback) => {
    db.query('SELECT * FROM terminales', callback);
};

// Crear una nueva terminal
Terminal.create = (marca, modelo, serie, inventario, rpe, nombre, usuarioId, callback) => {
    const query = 'INSERT INTO terminales (marca, modelo, serie, inventario, rpe_responsable, nombre_responsable, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [marca, modelo, serie, inventario, rpe, nombre, usuarioId], callback);
};

// Actualizar una terminal existente
Terminal.update = (id, marca, modelo, serie, inventario, rpe, nombre, usuarioId, callback) => {
    const query = 'UPDATE terminales SET marca = ?, modelo = ?, serie = ?, inventario = ?, rpe_responsable = ?, nombre_responsable = ?, usuario_id = ? WHERE id = ?';
    db.query(query, [marca, modelo, serie, inventario, rpe, nombre, usuarioId, id], callback);
};

// ✅ Modelo para guardar y recuperar fotos de terminales
const TerminalFoto = {
    create: (terminalId, fotoUrls, callback) => {
        if (!fotoUrls || fotoUrls.length === 0) {
            return callback(new Error("No se proporcionaron fotos"));
        }
        const query = "INSERT INTO terminales_fotos (terminal_id, foto_url, fecha_subida) VALUES ?";
        const values = fotoUrls.map(url => [terminalId, url, new Date()]);
        db.query(query, [values], callback);
    },

    getByTerminalId: (terminalId, callback) => {
        const query = "SELECT * FROM terminales_fotos WHERE terminal_id = ? ORDER BY fecha_subida DESC";
        db.query(query, [terminalId], callback);
    }
};

module.exports = { Terminal, TerminalFoto };
