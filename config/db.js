const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'blzqfqsgkzgqustmlga6-mysql.services.clever-cloud.com',
    user: 'uzhu0qv5zdij7fj8',
    password: 'VmZMGm2YS6Hk37gKJbfZ',
    database: 'blzqfqsgkzgqustmlga6'
});

connection.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('Conectado a la base de datos MySQL');
});

module.exports = connection;
