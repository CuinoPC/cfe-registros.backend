const db = require('../config/db'); // Asegúrate de importar tu conexión a MySQL

const Terminal = {};

// Obtener todas las terminales portátiles
Terminal.getAll = (callback) => {
    db.query('SELECT * FROM terminales', callback);
};

// Crear una nueva terminal
Terminal.create = (marca, serie, inventario, rpe, nombre, usuarioId, callback) => {
    const query = 'INSERT INTO terminales (marca, serie, inventario, rpe_responsable, nombre_responsable, usuario_id) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [marca, serie, inventario, rpe, nombre, usuarioId], callback);
};

// Actualizar terminal existente
Terminal.update = (id, marca, serie, inventario, rpe, nombre, usuarioId, callback) => {
    const query = 'UPDATE terminales SET marca = ?, serie = ?, inventario = ?, rpe_responsable = ?, nombre_responsable = ?, usuario_id = ? WHERE id = ?';
    db.query(query, [marca, serie, inventario, rpe, nombre, usuarioId, id], callback);
};

module.exports = Terminal;
