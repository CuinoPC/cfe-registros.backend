const Terminal = require('../models/terminalModel');

const getTerminales = (req, res) => {
    Terminal.getAll((err, results) => {
        if (err) {
            console.error("Error al obtener terminales:", err);
            res.status(500).json({ message: "Error interno del servidor" });
        } else {
            res.status(200).json(results);
        }
    });
};

const createTerminal = (req, res) => {
    const { marca, serie, inventario, rpe_responsable, nombre_responsable, usuario_id } = req.body;

    if (!marca || !serie || !inventario || !rpe_responsable || !nombre_responsable || !usuario_id) {
        return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    Terminal.create(marca, serie, inventario, rpe_responsable, nombre_responsable, usuario_id, (err, result) => {
        if (err) {
            console.error("Error al crear terminal:", err);
            res.status(500).json({ message: "Error al crear la terminal" });
        } else {
            res.status(201).json({ message: "Terminal creada con éxito", id: result.insertId });
        }
    });
};

const updateTerminal = (req, res) => {
    const { id } = req.params;
    const { marca, serie, inventario, rpe_responsable, nombre_responsable, usuario_id } = req.body;

    if (!marca || !serie || !inventario || !rpe_responsable || !nombre_responsable || !usuario_id) {
        return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    Terminal.update(id, marca, serie, inventario, rpe_responsable, nombre_responsable, usuario_id, (err, result) => {
        if (err) {
            console.error("Error al actualizar terminal:", err);
            res.status(500).json({ message: "Error al actualizar la terminal" });
        } else {
            res.status(200).json({ message: "Terminal actualizada con éxito" });
        }
    });
};

module.exports = { getTerminales, createTerminal, updateTerminal };
