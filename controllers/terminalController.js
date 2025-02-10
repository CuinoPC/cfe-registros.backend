const { Terminal, TerminalFoto } = require('../models/terminalModel');

// Obtener todas las terminales
const getTerminales = (req, res) => {
    Terminal.getAll((err, results) => {
        if (err) {
            console.error("Error al obtener terminales:", err);
            res.status(500).json({ message: "Error interno del servidor" });
        } else {
            // Obtener las fotos de cada terminal
            const terminales = results;
            const promises = terminales.map(terminal => {
                return new Promise((resolve, reject) => {
                    TerminalFoto.getByTerminalId(terminal.id, (err, fotos) => {
                        if (err) {
                            reject(err);
                        } else {
                            terminal.fotos = fotos.map(foto => foto.foto_url);
                            resolve();
                        }
                    });
                });
            });

            // Esperar a que todas las fotos sean recuperadas
            Promise.all(promises)
                .then(() => res.status(200).json(terminales))
                .catch(error => {
                    console.error("Error al obtener fotos:", error);
                    res.status(500).json({ message: "Error al obtener fotos" });
                });
        }
    });
};

// Crear una nueva terminal
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

// Actualizar terminal
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

// Función para subir fotos
const uploadPhotos = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No se subieron fotos' });
        }

        const terminalId = req.body.terminalId;
        if (!terminalId) {
            return res.status(400).json({ message: 'terminalId es requerido' });
        }

        const photoUrls = req.files.map(file => `/uploads/${file.filename}`);

        // Guardar las fotos en la base de datos
        TerminalFoto.create(terminalId, photoUrls, (err, result) => {
            if (err) {
                console.error('Error al guardar fotos en la BD:', err);
                return res.status(500).json({ message: 'Error interno al guardar las fotos' });
            }
            res.status(200).json({ message: 'Fotos subidas correctamente', urls: photoUrls });
        });

    } catch (error) {
        console.error('Error al subir fotos:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

module.exports = { getTerminales, createTerminal, updateTerminal, uploadPhotos };
