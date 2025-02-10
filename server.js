const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const terminalRoutes = require('./routes/terminalRoutes'); // Asegúrate de incluirlo aquí

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api', terminalRoutes); // Ahora carga las rutas de terminales también

app.listen(5000, () => {
    console.log('Servidor corriendo en el puerto 5000');
});
