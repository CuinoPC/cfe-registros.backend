const User = require('../models/userModel');
const { Terminal } = require('../models/terminalModel');

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

    User.getByRP(rp, (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const usuarioAnterior = results[0];
        const areaAnterior = usuarioAnterior.area_id;

        User.updateUser(nombre_completo, area_id, contrasenia, es_admin, es_centro, rp, async (err, result) => {
            if (err) return res.status(500).json({ error: 'Error al actualizar el usuario' });

            const tareasPendientes = [];

            // 🔁 Si el jefe de centro cambió de área
            if (usuarioAnterior.es_centro === 1 && areaAnterior !== area_id) {
                tareasPendientes.push(new Promise((resolve, reject) => {
                    User.findCentroByAreaId(areaAnterior, (err, nuevos) => {
                        if (err) return reject('Error al buscar nuevo jefe de centro');

                        if (nuevos.length > 0) {
                            const nuevoJefe = nuevos[0];
                            Terminal.updateResponsablePorRP(
                                rp,
                                nuevoJefe.rp,
                                nuevoJefe.nombre_completo,
                                (err) => err ? reject('Error al reasignar terminales') : resolve()
                            );
                        } else {
                            User.getAreaNombreById(areaAnterior, (err, resultArea) => {
                                if (err || resultArea.length === 0) return reject('Error al obtener área');

                                const nombreAreaAnterior = resultArea[0].nom_area;
                                Terminal.quitarResponsableDeArea(nombreAreaAnterior, (err) =>
                                    err ? reject('Error al quitar responsables') : resolve()
                                );
                            });
                        }
                    });
                }));
            }

            // 🧹 Si ya no es jefe de centro
            if (usuarioAnterior.es_centro === 1 && es_centro === false) {
                tareasPendientes.push(new Promise((resolve, reject) => {
                    Terminal.quitarResponsablePorRP(rp, (err) =>
                        err ? reject('Error al quitar responsable del usuario') : resolve()
                    );
                }));
            }

            // ✅ Si ahora es jefe de centro
            if (es_centro) {
                tareasPendientes.push(new Promise((resolve, reject) => {
                    User.getAreaNombreById(area_id, (err, areaResult) => {
                        if (err || areaResult.length === 0) return reject('Error al obtener nombre del área');

                        const nombreArea = areaResult[0].nom_area;
                        Terminal.asignarResponsableAreaVacia(nombreArea, rp, nombre_completo, (err) =>
                            err ? reject('Error al asignar terminales al nuevo jefe') : resolve()
                        );
                    });
                }));
            }

            // 🔚 Esperar que todas las tareas se completen
            Promise.all(tareasPendientes)
                .then(() => {
                    return res.json({ message: 'Usuario y terminales actualizados correctamente' });
                })
                .catch((errorMsg) => {
                    return res.status(500).json({ error: errorMsg });
                });
        });
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
