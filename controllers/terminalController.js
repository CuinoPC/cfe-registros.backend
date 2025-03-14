const { Terminal, TerminalFoto, HistorialTerminal  } = require('../models/terminalModel');

// Obtener todas las terminales
const getTerminales = (req, res) => {
    Terminal.getAll((err, results) => {
        if (err) {
            res.status(500).json({ message: "Error interno del servidor" });
        } else {
            const terminales = results;
            const promises = terminales.map(terminal => {
                return new Promise((resolve, reject) => {
                    TerminalFoto.getByTerminalId(terminal.id, (err, fotos) => {
                        if (err) {
                            reject(err);
                        } else {
                            // ✅ Asegurar que `fecha_subida` sea string en formato YYYY-MM-DD
                            const fotosPorFecha = {};
                            fotos.forEach(foto => {
                                const fecha = new Date(foto.fecha_subida).toISOString().split("T")[0];

                                if (!fotosPorFecha[fecha]) {
                                    fotosPorFecha[fecha] = [];
                                }
                                fotosPorFecha[fecha].push(foto.foto_url);
                            });

                            terminal.fotos = fotosPorFecha;
                            resolve();
                        }
                    });
                });
            });

            Promise.all(promises)
                .then(() => res.status(200).json(terminales))
                .catch(() => res.status(500).json({ message: "Error al obtener fotos" }));
        }
    });
};

// Crear una nueva terminal
const createTerminal = (req, res) => {
    const { marca, modelo, serie, inventario, rpe_responsable, nombre_responsable, usuario_id } = req.body;

    if (!marca || !modelo || !serie || !inventario || !rpe_responsable || !nombre_responsable || !usuario_id) {
        return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    Terminal.create(marca, modelo, serie, inventario, rpe_responsable, nombre_responsable, usuario_id, (err, result) => {
        if (err) {
            res.status(500).json({ message: "Error al crear la terminal" });
        } else {
            const terminalId = result.insertId;

            // ✅ Guardar en el historial
            HistorialTerminal.create(terminalId, marca, modelo, serie, inventario, rpe_responsable, nombre_responsable, usuario_id, 'Creación', (histErr) => {
                if (histErr) {
                    console.error("Error al registrar historial:", histErr);
                }
            });

            res.status(201).json({ message: "Terminal creada con éxito", id: terminalId });
        }
    });
};

// Actualizar terminal
const updateTerminal = (req, res) => {
    const { id } = req.params;
    const { marca, modelo, serie, inventario, rpe_responsable, nombre_responsable, usuario_id } = req.body;

    if (!marca || !modelo || !serie || !inventario || !rpe_responsable || !nombre_responsable || !usuario_id) {
        return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    Terminal.update(id, marca, modelo, serie, inventario, rpe_responsable, nombre_responsable, usuario_id, (err) => {
        if (err) {
            res.status(500).json({ message: "Error al actualizar la terminal" });
        } else {
            // ✅ Guardar en el historial
            HistorialTerminal.create(id, marca, modelo, serie, inventario, rpe_responsable, nombre_responsable, usuario_id, 'Actualización', (histErr) => {
                if (histErr) {
                    console.error("Error al registrar historial:", histErr);
                }
            });

            res.status(200).json({ message: "Terminal actualizada con éxito" });
        }
    });
};

// Obtener historial
const getHistorial = (req, res) => {
    HistorialTerminal.getAll((err, results) => {
        if (err) {
            res.status(500).json({ message: "Error al obtener historial" });
        } else {
            res.status(200).json(results);
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

        // ✅ Verificar el número de fotos en la última semana
        TerminalFoto.countWeeklyUploads(terminalId, (err, count) => {
            if (err) {
                return res.status(500).json({ message: 'Error interno al verificar fotos' });
            }

            if (count + req.files.length > 7) {
                return res.status(400).json({ message: 'Límite de 7 fotos por semana alcanzado' });
            }

            // Guardar las fotos si el usuario aún no ha alcanzado el límite
            const photoUrls = req.files.map(file => `/uploads/${file.filename}`);
            TerminalFoto.create(terminalId, photoUrls, (err) => {
                if (err) {
                    console.error('Error al guardar fotos en la BD:', err);
                    return res.status(500).json({ message: 'Error interno al guardar las fotos' });
                }
                res.status(200).json({ message: 'Fotos subidas correctamente', urls: photoUrls });
            });
        });

    } catch (error) {
        console.error('Error al subir fotos:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

module.exports = { getTerminales, createTerminal, updateTerminal, uploadPhotos, getHistorial };
