const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.SECRET_KEY || 'Cuino2003'; // 🔹 Usa la variable de entorno si existe

module.exports = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ error: 'Acceso denegado' });

    try {
        const verified = jwt.verify(token, SECRET_KEY);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ error: 'Token inválido' });
    }
};
