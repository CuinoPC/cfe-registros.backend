const User = require('../models/userModel');

exports.createUser = async (req, res) => {
    const { nombre_completo, rp, area, contrasenia, es_admin } = req.body;

    if (!nombre_completo || !rp || !area || !contrasenia) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    User.createUser(nombre_completo, rp, area, contrasenia, es_admin, (err, result) => {
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

        // Convertir es_admin a booleano (0 -> false, 1 -> true)
        const users = results.map(user => ({
            ...user,
            es_admin: user.es_admin === 1 // Asegurar que sea booleano
        }));

        res.json(users);
    });
};

// ✅ Función para actualizar usuario (fuera de `getAllUsers`)
exports.updateUser = (req, res) => {
    const { nombre_completo, area, contrasenia, es_admin } = req.body;
    const { rp } = req.params; // ✅ Obtener RP desde la URL correctamente

    if (!nombre_completo || !area || !contrasenia) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    User.updateUser(nombre_completo, area, contrasenia, es_admin, rp, (err, result) => {
        if (err) {
            console.error("Error en la actualización:", err);
            return res.status(500).json({ error: 'Error al actualizar el usuario' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json({ message: 'Usuario actualizado correctamente' });
    });
};


// ✅ Función para eliminar usuario (fuera de `getAllUsers`)
exports.deleteUser = (req, res) => {
    const { rp } = req.params;

    User.deleteUser(rp, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error al eliminar el usuario' });
        }
        res.json({ message: 'Usuario eliminado correctamente' });
    });
};
