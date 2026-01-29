// frontend/app.js - VERSIÓN CORREGIDA
class CreativeAssistantApp {
    constructor() {
        this.userId = null;
        this.userType = 'creator';
        this.sessionActive = false;
        this.ws = null;
        
        this.initElements();
        this.initEventListeners();
        this.initWebSocket();
    }
    
    initElements() {
        this.elements = {
            chatMessages: document.getElementById('chatMessages'),
            userInput: document.getElementById('userInput'),
            sendBtn: document.getElementById('sendBtn'),
            newSessionBtn: document.getElementById('newSessionBtn'),
            refreshPreview: document.getElementById('refreshPreview'),
            downloadAllBtn: document.getElementById('downloadAllBtn'),
            openFolderBtn: document.getElementById('openFolderBtn'),
            publishBtn: document.getElementById('publishBtn'),
            previewFrame: document.getElementById('previewFrame'),
            previewPlaceholder: document.getElementById('previewPlaceholder')
        };
    }
    
    initEventListeners() {
        // Event delegation para botones dinámicos
        this.elements.chatMessages.addEventListener('click', (e) => {
            if (e.target.id === 'startBtn' || e.target.closest('#startBtn')) {
                this.startSession();
            }
        });
        
        // Botón Nueva Conversación en header
        if (this.elements.newSessionBtn) {
            this.elements.newSessionBtn.addEventListener('click', () => this.resetSession());
        }
        
        // Botón Enviar mensaje
        this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
        this.elements.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Botones de control
        if (this.elements.refreshPreview) {
            this.elements.refreshPreview.addEventListener('click', () => this.refreshPreview());
        }
        
        if (this.elements.downloadAllBtn) {
            this.elements.downloadAllBtn.addEventListener('click', () => this.downloadAllFiles());
        }
        
        if (this.elements.openFolderBtn) {
            this.elements.openFolderBtn.addEventListener('click', () => this.openProjectFolder());
        }
        
        if (this.elements.publishBtn) {
            this.elements.publishBtn.addEventListener('click', () => this.publishProject());
        }
    }
    
    initWebSocket() {
        try {
            this.ws = new WebSocket('ws://localhost:7000');
            this.ws.onopen = () => console.log('WebSocket conectado');
            this.ws.onerror = (error) => console.error('WebSocket error:', error);
        } catch (error) {
            console.log('WebSocket no disponible');
        }
    }
    
    async startSession() {
        try {
            const response = await fetch('http://localhost:5000/api/start-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.userId = data.userId;
                this.sessionActive = true;
                
                // Habilitar interfaz
                this.elements.userInput.disabled = false;
                this.elements.userInput.focus();
                this.elements.sendBtn.disabled = false;
                
                // Mostrar mensaje inicial
                this.addMessage('assistant', data.message || '¡Hola! ¿En qué puedo ayudarte hoy?');
                
                // Mostrar preview
                this.elements.previewPlaceholder.style.display = 'none';
                this.elements.previewFrame.style.display = 'block';
                
                // Habilitar botones de descarga
                this.elements.downloadAllBtn.disabled = false;
                this.elements.openFolderBtn.disabled = false;
                
                console.log('Sesión iniciada:', this.userId);
            }
        } catch (error) {
            console.error('Error:', error);
            this.addMessage('assistant', 'Error conectando al servidor. ¿Está ejecutándose el backend?');
        }
    }
    
    async sendMessage() {
        const message = this.elements.userInput.value.trim();
        
        if (!message || !this.sessionActive) return;
        
        // Mostrar mensaje del usuario
        this.addMessage('user', message);
        this.elements.userInput.value = '';
        
        try {
            const response = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.userId,
                    message: message
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Mostrar respuesta
                this.addMessage('assistant', data.response);
                
                // Actualizar preview si hay archivos
                if (data.files && data.files.length > 0) {
                    setTimeout(() => this.refreshPreview(), 500);
                }
            } else {
                throw new Error(data.error || 'Error en la respuesta');
            }
        } catch (error) {
            console.error('Error:', error);
            this.addMessage('assistant', 'Error procesando tu mensaje. Intenta de nuevo.');
        }
    }
    
    addMessage(sender, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.innerHTML = `<i class="fas ${sender === 'user' ? 'fa-user' : 'fa-robot'}"></i>`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'content';
        contentDiv.innerHTML = content.replace(/\n/g, '<br>');
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);
        
        this.elements.chatMessages.appendChild(messageDiv);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }
    
    refreshPreview() {
        if (!this.userId) return;
        this.elements.previewFrame.src = `http://localhost:5000/project-files/${this.userId}/index.html?t=${Date.now()}`;
    }
    
    downloadAllFiles() {
        alert('Función de descarga - Próximamente');
    }
    
    openProjectFolder() {
        alert(`Tu proyecto está en: user-projects/${this.userId}/`);
    }
    
    publishProject() {
        alert('Publicación online - Próximamente');
    }
    
    resetSession() {
        if (confirm('¿Comenzar nueva conversación? Se perderá el progreso.')) {
            this.userId = null;
            this.sessionActive = false;
            
            // Limpiar chat
            this.elements.chatMessages.innerHTML = `
                <div class="message assistant welcome">
                    <div class="avatar">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="content">
                        <h4>Hola, ¿en qué puedo ayudarte hoy? 👋</h4>
                        <button id="startBtn" class="btn-primary">
                            <i class="fas fa-comments"></i> Empezar a crear
                        </button>
                    </div>
                </div>
            `;
            
            // Deshabilitar inputs
            this.elements.userInput.disabled = true;
            this.elements.sendBtn.disabled = true;
            
            // Resetear preview
            this.elements.previewFrame.style.display = 'none';
            this.elements.previewPlaceholder.style.display = 'flex';
            
            // Deshabilitar botones
            this.elements.downloadAllBtn.disabled = true;
            this.elements.openFolderBtn.disabled = true;
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CreativeAssistantApp();
});