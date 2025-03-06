const User = require('../models/userModel');

exports.createUser = async (req, res) => {
    const { nombre_completo, rp, area_id, contrasenia, es_admin, es_centro } = req.body;

    if (!nombre_completo || !rp || !area_id || !contrasenia) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    User.createUser(nombre_completo, rp, area_id, contrasenia, es_admin, es_centro, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error al crear el usuario' });
        }
        res.status(201).json({ message: 'Usuario creado correctamente' });
    });
};

exports.getAllUsers = (req, res) => {
    User.getAllUsers((err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener los usuarios' });
        }

        const users = results.map(user => ({
            ...user,
            es_admin: user.es_admin === 1,
            es_centro: user.es_centro === 1
        }));

        res.json(users);
    });
};

exports.updateUser = (req, res) => {
    const { nombre_completo, area_id, contrasenia, es_admin, es_centro } = req.body;
    const { rp } = req.params;

    if (!nombre_completo || !area_id || !contrasenia) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    User.updateUser(nombre_completo, area_id, contrasenia, es_admin, es_centro, rp, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error al actualizar el usuario' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json({ message: 'Usuario actualizado correctamente' });
    });
};

exports.deleteUser = (req, res) => {
    const { rp } = req.params;

    User.deleteUser(rp, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error al eliminar el usuario' });
        }
        res.json({ message: 'Usuario eliminado correctamente' });
    });
};

// 🔹 Obtener todas las áreas disponibles

exports.getAllAreas = (req, res) => {
    User.getAllAreas((err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener las áreas' });
        }
        res.json(results);
    });
};
