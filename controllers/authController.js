const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
require('dotenv').config();

// 🔐 Usa clave por defecto si no se define en .env
const SECRET_KEY = process.env.SECRET_KEY || 'Cuino2003';

exports.login = (req, res) => {
    const { rp, contrasenia } = req.body;

    User.findByRP(rp, (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(401).json({ error: 'Usuario no encontrado' });

        const user = results[0];

        if (contrasenia === user.contrasenia) {
            const token = jwt.sign(
                { id: user.id, es_admin: user.es_admin, es_centro: user.es_centro },
                SECRET_KEY, // ✅ Ya nunca será undefined
                { expiresIn: '1h' }
            );

            res.json({
                token,
                es_admin: Boolean(user.es_admin),
                es_centro: Boolean(user.es_centro),
                nombre_completo: user.nombre_completo,
                rp: user.rp
            });
        } else {
            return res.status(401).json({ error: 'Contrasenia incorrecta' });
        }
    });
};
