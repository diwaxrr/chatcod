const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(express.static('../frontend'));

const USER_PROJECTS_PATH = path.join(__dirname, '../user-projects');
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// Sessions simples
const sessions = {};
let sessionCounter = 1;

// 1. Iniciar sesión
app.post('/api/start-session', (req, res) => {
  const userId = `user-${sessionCounter++}`;
  sessions[userId] = { type: 'creator', projectPath: path.join(USER_PROJECTS_PATH, userId) };
  
  // Crear directorio
  fs.mkdir(sessions[userId].projectPath, { recursive: true });
  
  res.json({ 
    userId, 
    message: 'Hola, qué quieres crear hoy?' 
  });
});

// 2. Chat principal
app.post('/api/chat', async (req, res) => {
  try {
    const { userId, message } = req.body;
    
    if (!sessions[userId]) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    // Llamar a DeepSeek
    const aiResponse = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `Eres un asistente de programación. Ayudas a crear aplicaciones web.

            REGLAS DE INTERACCIÓN:
            1. Este es un chat conversacional natural entre tú y el usuario
            2. Tu primer objetivo: entender EXACTAMENTE qué quiere crear el usuario
            3. Pregunta por detalles concretos: colores, fotos, textos, funcionalidades
            4. Cuando tengas claridad, confirma: "Perfecto, voy a prepararlo. Dame un momento por favor"
            5. Mientras generas archivos, informa: "Creando [nombre-del-archivo]..."
            6. Automáticamente actualizas el preview con los cambios
            7. Preguntas: "¿Te gusta así?"
            8. Ajustas según el feedback inmediatamente
            9. Repites pasos 7-8 hasta que digan que estan conformes
            10. Finalizas ofreciendo: "Puedes descargar los archivos, o prefieres que te ayude a publicarlo online?"

            NOTAS IMPORTANTES:
            • Para publicación online: "Puedes gestionar la publicación en [enlace]"
            • Sé paciente - cada usuario tiene su ritmo
            • Usa un tono amigable pero profesional
            • Si no entiendes algo, pide explicacion, ejemplos o imágenes
            • Utiliza la tecnologia mas simple y efectiva posible
            • Utiliza poco codigo, el objetivo es gastar menos tiempo y menos recursos, para ayudar a mas gente
            • Al corregir, solo cambia las partes relevantes, no toques el resto del codigo`
          },
          {
            role: "user", 
            content: message
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const responseText = aiResponse.data.choices[0].message.content;
    
    // Crear archivo HTML simple si se pide un sitio web
    if (message.toLowerCase().includes('sitio') || message.toLowerCase().includes('página')) {
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>Mi Sitio</title>
    <style>
        body { font-family: Arial; padding: 20px; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>Mi Sitio Web</h1>
    <p>Creado con ChatCod</p>
    <p>${message}</p>
</body>
</html>`;
      
      await fs.writeFile(
        path.join(sessions[userId].projectPath, 'index.html'),
        htmlContent
      );
    }

    res.json({
      response: responseText,
      files: ['index.html']
    });

  } catch (error) {
    console.error('Error completo:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Error con la API',
      details: error.response?.data || error.message 
    });
  }
});

// 3. Servir archivos
app.use('/project-files/:userId', express.static(USER_PROJECTS_PATH));

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
  console.log(`✅ DeepSeek API: ${DEEPSEEK_API_KEY ? 'Configurada' : 'NO configurada'}`);
});