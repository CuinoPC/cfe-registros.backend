const db = require('../config/db');

class User {
    static findByRP(rp, callback) {
        db.query('SELECT * FROM usuarios WHERE rp = ?', [rp], callback);
    }

    static createUser(nombre_completo, rp, area, contrasenia, es_admin, callback) {
        db.query(
            'INSERT INTO usuarios (nombre_completo, rp, area, contrasenia, es_admin) VALUES (?, ?, ?, ?, ?)',
            [nombre_completo, rp, area, contrasenia, es_admin],
            callback
        );
    }

    static getAllUsers(callback) {
        db.query('SELECT id, nombre_completo, rp, area, contrasenia, es_admin FROM usuarios', callback);
    }

    // ✅ Método para actualizar usuario
    static updateUser(nombre_completo, area, contrasenia, es_admin, rp_anterior, callback) {
        db.query(
            'UPDATE usuarios SET nombre_completo = ?, area = ?, contrasenia = ?, es_admin = ? WHERE rp = ?',
            [nombre_completo, area, contrasenia, es_admin, rp_anterior], // 🔹 Asegura que el RP en WHERE sea el correcto
            callback
        );
    }

    // ✅ Método para eliminar usuario
    static deleteUser(rp, callback) {
        db.query('DELETE FROM usuarios WHERE rp = ?', [rp], callback);
    }
}

module.exports = User;
