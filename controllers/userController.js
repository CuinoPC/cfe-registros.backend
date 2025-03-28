const User = require('../models/userModel');
const { Terminal, HistorialTerminal, } = require('../models/terminalModel');
const { Lector, HistorialLector } = require('../models/lectorModel');

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
                            // 🔄 Terminales
                            Terminal.updateResponsablePorRP(
                                rp,
                                nuevoJefe.rp,
                                nuevoJefe.nombre_completo,
                                (err) => {
                                    if (err) return reject('Error al reasignar terminales');
                                    Terminal.getByResponsable(nuevoJefe.rp, (err, terminales) => {
                                        if (err || !terminales) return resolve();
                                        terminales.forEach((terminal) => {
                                            HistorialTerminal.create(
                                                terminal.id,
                                                terminal.marca,
                                                terminal.modelo,
                                                terminal.serie,
                                                terminal.inventario,
                                                nuevoJefe.rp,
                                                nuevoJefe.nombre_completo,
                                                terminal.usuario_id,
                                                terminal.area,
                                                'Actualización',
                                                () => { }
                                            );
                                        });
                                        resolve();
                                    });
                                }
                            );
                            // 🔄 Lectores
                            Lector.updateResponsablePorRP(
                                rp,
                                nuevoJefe.rp,
                                nuevoJefe.nombre_completo,
                                (err) => {
                                    if (err) return reject('Error al reasignar lectores');
                                    Lector.getByResponsable(nuevoJefe.rp, (err, lectores) => {
                                        if (err || !lectores) return resolve();
                                        lectores.forEach((lector) => {
                                            HistorialLector.create(
                                                lector.id,
                                                lector.marca,
                                                lector.modelo,
                                                lector.folio,
                                                lector.tipo_conector,
                                                nuevoJefe.rp,
                                                nuevoJefe.nombre_completo,
                                                lector.usuario_id,
                                                lector.area,
                                                'Actualización',
                                                () => { }
                                            );
                                        });
                                        resolve();
                                    });
                                }
                            );

                        } else {
                            User.getAreaNombreById(areaAnterior, (err, resultArea) => {
                                if (err || resultArea.length === 0) return reject('Error al obtener área');
                                const nombreAreaAnterior = resultArea[0].nom_area;
                                Terminal.quitarResponsableDeArea(nombreAreaAnterior, (err) => {
                                    if (err) return reject('Error al quitar responsables de terminales');
                                    Lector.quitarResponsableDeArea(nombreAreaAnterior, (err) =>
                                        err ? reject('Error al quitar responsables de lectores') : resolve()
                                    );
                                });
                            });
                        }
                    });
                }));
            }

            // 🧹 Si ya no es jefe de centro
            if (usuarioAnterior.es_centro === 1 && es_centro === false) {
                tareasPendientes.push(new Promise((resolve, reject) => {
                    Terminal.quitarResponsablePorRP(rp, (err) => {
                        if (err) return reject('Error al quitar responsable de terminales');
                        Lector.quitarResponsablePorRP(rp, (err) =>
                            err ? reject('Error al quitar responsable de lectores') : resolve()
                        );
                    });
                }));
            }


            // ✅ Si ahora es jefe de centro
            if (es_centro) {
                tareasPendientes.push(new Promise((resolve, reject) => {
                    User.getAreaNombreById(area_id, (err, areaResult) => {
                        if (err || areaResult.length === 0) return reject('Error al obtener nombre del área');
                        const nombreArea = areaResult[0].nom_area;
                        Terminal.asignarResponsableAreaVacia(nombreArea, rp, nombre_completo, (err) => {
                            if (err) return reject('Error al asignar terminales al nuevo jefe');
                            Terminal.getByResponsable(rp, (err, terminales) => {
                                if (err || !terminales) return resolve();
                                terminales.forEach((terminal) => {
                                    HistorialTerminal.create(
                                        terminal.id,
                                        terminal.marca,
                                        terminal.modelo,
                                        terminal.serie,
                                        terminal.inventario,
                                        rp,
                                        nombre_completo,
                                        terminal.usuario_id,
                                        terminal.area,
                                        'Actualización',
                                        () => { }
                                    );
                                });
                                resolve();
                            });
                        });
                        Lector.asignarResponsableAreaVacia(nombreArea, rp, nombre_completo, (err) => {
                            if (err) return reject('Error al asignar lectores al nuevo jefe');
                            Lector.getByResponsable(rp, (err, lectores) => {
                                if (err || !lectores) return resolve();
                                lectores.forEach((lector) => {
                                    HistorialLector.create(
                                        lector.id,
                                        lector.marca,
                                        lector.modelo,
                                        lector.folio,
                                        lector.tipo_conector,
                                        rp,
                                        nombre_completo,
                                        lector.usuario_id,
                                        lector.area,
                                        'Actualización',
                                        () => { }
                                    );
                                });
                                resolve();
                            });
                        });
                    });
                }));
            }

            Promise.all(tareasPendientes)
                .then(() => {
                    return res.json({ message: 'Usuario, terminales y lectores actualizados correctamente' });
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
