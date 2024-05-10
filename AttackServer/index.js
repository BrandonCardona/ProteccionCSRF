const express = require('express');
const path = require('path');

const app = express();
const PORT = 5000;

// Ruta para servir el archivo HTML
app.get('/', (req, res) => {
    // Ruta absoluta al archivo HTML
    const filePath = path.join(__dirname, 'index.html');
    
    // Enviar el archivo HTML como respuesta
    res.sendFile(filePath);
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Listening on PORT ${PORT}`);
});
