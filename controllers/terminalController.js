const { Terminal, TerminalFoto, HistorialTerminal, TerminalDanada, SupervisionTerminal, MarcaTerminal, SupervisionHoneywell } = require('../models/terminalModel');

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
    const { marca, modelo, serie, inventario, rpe_responsable, nombre_responsable, usuario_id, area } = req.body;

    if (!marca || !modelo || !serie || !inventario || !rpe_responsable || !nombre_responsable || !usuario_id || !area) {
        return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    const realizadoPor = req.body.realizado_por;

    Terminal.create(marca, modelo, serie, inventario, rpe_responsable, nombre_responsable, usuario_id, area, (err, result) => {
        if (err) {
            res.status(500).json({ message: "Error al crear la terminal" });
        } else {
            const terminalId = result.insertId;

            // ✅ Guardar en el historial
            HistorialTerminal.create(terminalId, marca, modelo, serie, inventario, rpe_responsable, nombre_responsable, usuario_id, area, 'Creación', realizadoPor, (histErr) => {
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
    const { marca, modelo, serie, inventario, rpe_responsable, nombre_responsable, usuario_id, area } = req.body;

    if (!marca || !modelo || !serie || !inventario || !rpe_responsable || !nombre_responsable || !usuario_id || !area) {
        return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    const realizadoPor = req.body.realizado_por;

    Terminal.update(id, marca, modelo, serie, inventario, rpe_responsable, nombre_responsable, usuario_id, area, (err) => {
        if (err) {
            res.status(500).json({ message: "Error al actualizar la terminal" });
        } else {
            // ✅ Guardar en el historial
            HistorialTerminal.create(id, marca, modelo, serie, inventario, rpe_responsable, nombre_responsable, usuario_id, area, 'Actualización', realizadoPor, (histErr) => {
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

            if (count + req.files.length > 10) {
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

const marcarTerminalDanada = (req, res) => {
    const { terminalId, marca, modelo, area, serie, inventario } = req.body;
    
    TerminalDanada.create(terminalId, marca, modelo, area, serie, inventario, (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Error al registrar la terminal dañada" });
        }
        res.status(201).json({ message: "Terminal marcada como dañada correctamente" });
    });
};

const obtenerTerminalesDanadas = (req, res) => {
    TerminalDanada.getAll((err, results) => {
        if (err) {
            return res.status(500).json({ error: "Error al obtener terminales dañadas" });
        }

        res.status(200).json(results); // 🔹 Mostramos todas las terminales, incluso las reparadas
    });
};



const actualizarTerminalDanada = (req, res) => {
    const { id } = req.params;
    let { fechaReporte, fechaGuia, fechaDiagnostico, fechaAutorizacion, fechaReparacion, diasReparacion, costo, piezasReparadas, observaciones, ticket } = req.body;

    if (!id) {
        return res.status(400).json({ message: "El ID de la terminal dañada es obligatorio" });
    }

    // ✅ Convertir formato de fecha a 'YYYY-MM-DD'
    const formatDate = (date) => {
        return date ? new Date(date).toISOString().split("T")[0] : null;
    };

    fechaReporte = formatDate(fechaReporte);
    fechaGuia = formatDate(fechaGuia);
    fechaDiagnostico = formatDate(fechaDiagnostico);
    fechaAutorizacion = formatDate(fechaAutorizacion);
    fechaReparacion = formatDate(fechaReparacion);

    TerminalDanada.update(id, fechaReporte, fechaGuia, fechaDiagnostico, fechaAutorizacion, fechaReparacion, diasReparacion, costo, piezasReparadas, observaciones, ticket, (err, result) => {
        if (err) {
            console.error("Error al actualizar la terminal dañada:", err);
            return res.status(500).json({ error: "Error al actualizar la terminal dañada" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Terminal dañada no encontrada" });
        }

        res.status(200).json({ message: "Terminal dañada actualizada correctamente" });
    });
};

// Obtener terminales por área
const getTerminalesPorArea = (req, res) => {
    const { area } = req.params;

    Terminal.getByArea(area, (err, results) => {
        if (err) {
            console.error("Error al obtener terminales por área:", err);
            res.status(500).json({ message: "Error interno del servidor" });
        } else {
            res.status(200).json(results.length > 0 ? results : []); // ✅ Enviar lista vacía si no hay resultados
        }
    });
};

// ✅ Guardar datos de supervisión
const saveSupervisionData = (req, res) => {
    const supervisionData = req.body;

    SupervisionTerminal.save(supervisionData, (err, result) => {
        if (err) {
            console.error("Error al guardar datos de supervisión:", err);
            res.status(500).json({ message: "Error interno del servidor" });
        } else {
            res.status(201).json({ message: "Datos de supervisión guardados correctamente" });
        }
    });
};

// ✅ Actualizar un campo de supervisión en tiempo real
const updateSupervisionData = (req, res) => {
    const { terminal_id, field, value } = req.body;

    SupervisionTerminal.updateField(terminal_id, field, value, (err, result) => {
        if (err) {
            console.error("Error al actualizar supervisión:", err);
            res.status(500).json({ message: "Error interno del servidor" });
        } else {
            res.status(200).json({ message: "Campo actualizado correctamente" });
        }
    });
};

const getSupervisionHistorial = (req, res) => {
    const { terminalId } = req.params;

    SupervisionTerminal.getByTerminalId(terminalId, (err, results) => {
        if (err) {
            console.error("Error al obtener historial de supervisión:", err);
            return res.status(500).json({ message: "Error interno" });
        }

        res.status(200).json(results);
    });
};

const getSupervisionesPorArea = (req, res) => {
    const { area } = req.params;

    SupervisionTerminal.getByArea(area, (err, results) => {
        if (err) {
            console.error("Error al obtener supervisiones por área:", err);
            res.status(500).json({ message: "Error interno" });
        } else {
            res.status(200).json(results);
        }
    });
};

const getPiezasTPS = (req, res) => {
    Terminal.getPiezasTPS((err, results) => {
        if (err) {
            console.error("Error al obtener piezas TPS:", err);
            return res.status(500).json({ error: "Error al obtener piezas" });
        }
        res.status(200).json(results);
    });
};

const updatePiezaTPS = (req, res) => {
    const { id } = req.params;
    const { nombre_pieza, costo } = req.body;

    if (!nombre_pieza || costo === undefined) {
        return res.status(400).json({ message: "Nombre y costo son obligatorios" });
    }

    Terminal.updatePiezaTPS(id, nombre_pieza, costo, (err, result) => {
        if (err) {
            console.error("Error al actualizar la pieza:", err);
            return res.status(500).json({ error: "Error al actualizar la pieza" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Pieza no encontrada" });
        }

        res.status(200).json({ message: "Pieza actualizada correctamente" });
    });
};

const subirArchivoPDF = (req, res) => {
    const id = req.params.id;
    const archivo = req.file;
  
    if (!archivo) return res.status(400).json({ error: "No se subió ningún archivo" });
  
    const rutaPDF = `/uploads/${archivo.filename}`;
  
    Terminal.subirArchivoPDF(id, rutaPDF, (err, result) => {
      if (err) return res.status(500).json({ error: "Error al guardar PDF" });
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Terminal no encontrada" });
      }
  
      res.status(200).json({ mensaje: "Archivo subido", ruta: rutaPDF });
    });
  };

  // Obtener todas las marcas de terminales
const getMarcasTerminales = (req, res) => {
    MarcaTerminal.getAll((err, results) => {
      if (err) {
        console.error("Error al obtener marcas de terminales:", err);
        return res.status(500).json({ message: "Error al obtener marcas" });
      }
      res.status(200).json(results);
    });
  };

  // ✅ Guardar datos de supervisión Honeywell
const saveSupervisionHoneywell = (req, res) => {
    const data = req.body;

    SupervisionHoneywell.save(data, (err, result) => {
        if (err) {
            console.error("Error al guardar datos de supervisión Honeywell:", err);
            res.status(500).json({ message: "Error interno del servidor" });
        } else {
            res.status(201).json({ message: "Datos de supervisión guardados correctamente" });
        }
    });
};

// ✅ Actualizar un campo específico en tiempo real
const updateSupervisionHoneywellField = (req, res) => {
    const { terminal_id, field, value } = req.body;

    SupervisionHoneywell.updateField(terminal_id, field, value, (err, result) => {
        if (err) {
            console.error("Error al actualizar supervisión Honeywell:", err);
            res.status(500).json({ message: "Error interno del servidor" });
        } else {
            res.status(200).json({ message: "Campo actualizado correctamente" });
        }
    });
};

// ✅ Obtener historial de supervisión por terminal_id
const getSupervisionHoneywellHistorial = (req, res) => {
    const { terminalId } = req.params;

    SupervisionHoneywell.getByTerminalId(terminalId, (err, results) => {
        if (err) {
            console.error("Error al obtener historial:", err);
            return res.status(500).json({ message: "Error interno" });
        }

        res.status(200).json(results);
    });
};

// ✅ Obtener supervisiones por área
const getSupervisionesHoneywellPorArea = (req, res) => {
    const { area } = req.params;

    SupervisionHoneywell.getByArea(area, (err, results) => {
        if (err) {
            console.error("Error al obtener supervisiones por área:", err);
            res.status(500).json({ message: "Error interno" });
        } else {
            res.status(200).json(results);
        }
    });
};

module.exports = { 
    getTerminales, createTerminal, updateTerminal, 
    uploadPhotos, getHistorial, marcarTerminalDanada, 
    obtenerTerminalesDanadas, actualizarTerminalDanada, getTerminalesPorArea, 
    SupervisionTerminal, saveSupervisionData, updateSupervisionData,
    getSupervisionHistorial, getPiezasTPS, updatePiezaTPS,
    subirArchivoPDF, getSupervisionesPorArea, getMarcasTerminales,
    saveSupervisionHoneywell, updateSupervisionHoneywellField, getSupervisionHoneywellHistorial,
    getSupervisionesHoneywellPorArea
};
