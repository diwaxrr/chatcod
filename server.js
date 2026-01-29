// server.js - Tu backend local
const express = require('express');
const fs = require('fs');
const path = require('path');
const { DeepSeekAPI } = require('./deepseek-integration');

const app = express();
app.use(express.json());

// Proyecto del usuario
const userProject = path.join(process.cwd(), 'mi-proyecto');

// Endpoint principal
app.post('/api/chat', async (req, res) => {
  const { message, userType } = req.body;
  
  // 1. Procesar con DeepSeek
  const analysis = await DeepSeekAPI.analyzeRequest(message, userType);
  
  // 2. Generar/actualizar archivos
  const generatedFiles = generateFiles(analysis);
  
  // 3. Iniciar preview si no está corriendo
  startPreviewServer();
  
  res.json({
    response: analysis.response,
    files: generatedFiles,
    previewUrl: 'http://localhost:3000'
  });
});

// Generar archivos localmente
function generateFiles(analysis) {
  const files = [];
  
  analysis.files.forEach(file => {
    const filePath = path.join(userProject, file.name);
    fs.writeFileSync(filePath, file.content);
    files.push(filePath);
  });
  
  return files;
}

// Servidor de preview
function startPreviewServer() {
  const http = require('http');
  const server = http.createServer((req, res) => {
    // Servir archivos del proyecto
    const requestedFile = req.url === '/' ? '/index.html' : req.url;
    const filePath = path.join(userProject, requestedFile);
    
    if (fs.existsSync(filePath)) {
      res.writeHead(200);
      res.end(fs.readFileSync(filePath));
    } else {
      res.writeHead(404);
      res.end('Archivo no encontrado');
    }
  });
  
  server.listen(3000, () => {
    console.log('Preview server en http://localhost:3000');
  });
}

app.listen(5000, () => {
  console.log('Servidor local en puerto 5000');
  console.log('Proyecto se guarda en:', userProject);
});