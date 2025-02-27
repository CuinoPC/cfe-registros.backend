const db = require('../config/db');

class User {
    static findByRP(rp, callback) {
        db.query(
            `SELECT u.*, a.nom_area, a.proceso 
             FROM usuarios u 
             JOIN areas a ON u.area_id = a.id 
             WHERE u.rp = ?`,
            [rp], callback
        );
    }

    static createUser(nombre_completo, rp, area_id, contrasenia, es_admin, es_centro, callback) {
        db.query(
            'INSERT INTO usuarios (nombre_completo, rp, area_id, contrasenia, es_admin, es_centro) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre_completo, rp, area_id, contrasenia, es_admin, es_centro],
            callback
        );
    }

    static getAllUsers(callback) {
        db.query(
            `SELECT u.id, u.nombre_completo, u.rp, a.nom_area, a.proceso, u.contrasenia, u.es_admin, u.es_centro 
             FROM usuarios u 
             JOIN areas a ON u.area_id = a.id`,
            callback
        );
    }

    static updateUser(nombre_completo, area_id, contrasenia, es_admin, es_centro, rp, callback) {
        db.query(
            'UPDATE usuarios SET nombre_completo = ?, area_id = ?, contrasenia = ?, es_admin = ?, es_centro = ? WHERE rp = ?',
            [nombre_completo, area_id, contrasenia, es_admin, es_centro, rp],
            callback
        );
    }

    static deleteUser(rp, callback) {
        db.query('DELETE FROM usuarios WHERE rp = ?', [rp], callback);
    }

    static getAllAreas(callback) {
        db.query('SELECT * FROM areas', callback);
    }
}

module.exports = User;
