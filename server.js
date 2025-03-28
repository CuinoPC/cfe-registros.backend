const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const terminalRoutes = require('./routes/terminalRoutes');
const lectoresRoutes = require('./routes/lectoresRoutes');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 🔹 Hacer pública la carpeta "uploads" para servir imágenes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api', terminalRoutes);
app.use('/api', lectoresRoutes);

app.listen(5000, () => {
    console.log('Servidor corriendo en el puerto 5000');
});
