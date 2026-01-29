// backend/config.js
module.exports = {
  // Configuración de DeepSeek API
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY,
    model: 'deepseek-chat',
    temperature: 0.7,
    maxTokens: 2000
  },
  
  // Rutas
  paths: {
    userProjects: '../user-projects',
    templates: './templates'
  },
  
  // Tipos de usuario
  userTypes: {
    creator: {
      defaultTemplate: 'simple-website',
      maxFileSize: 10485760 // 10MB
    },
    entrepreneur: {
      defaultTemplate: 'landing-page',
      maxFileSize: 52428800 // 50MB
    },
    developer: {
      defaultTemplate: 'full-stack',
      maxFileSize: 104857600 // 100MB
    }
  }
};