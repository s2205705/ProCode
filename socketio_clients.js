/**
 * Socket.IO Client Module for Python Pathfinder
 * Handles real-time communication for multiplayer features
 */

const SocketManager = {
    socket: null,
    callbacks: {},
    
    init() {
        this.connect();
        this.setupEventListeners();
    },
    
    connect() {
        this.socket = io({
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 20000
        });
        
        this.socket.on('connect', () => this.onConnect());
        this.socket.on('disconnect', () => this.onDisconnect());
        this.socket.on('connect_error', (error) => this.onConnectError(error));
        
        // Register default event handlers
        this.registerDefaultHandlers();
    },
    
    registerDefaultHandlers() {
        // System events
        this.on('system_message', this.handleSystemMessage.bind(this));
        this.on('user_connected', this.handleUserConnected.bind(this));
        this.on('user_disconnected', this.handleUserDisconnected.bind(this));
        
        // Room events
        this.on('room_created', this.handleRoomCreated.bind(this));
        this.on('room_updated', this.handleRoomUpdated.bind(this));
        this.on('room_deleted', this.handleRoomDeleted.bind(this));
        
        // Game events
        this.on('game_start', this.handleGameStart.bind(this));
        this.on('game_update', this.handleGameUpdate.bind(this));
        this.on('game_end', this.handleGameEnd.bind(this));
        
        // Chat events
        this.on('chat_message', this.handleChatMessage.bind(this));
        this.on('private_message', this.handlePrivateMessage.bind(this));
        
        // Notification events
        this.on('notification', this.handleNotification.bind(this));
        this.on('achievement_unlocked', this.handleAchievementUnlocked.bind(this));
    },
    
    // Connection handlers
    onConnect() {
        console.log('Connected to Socket.IO server');
        this.emit('user_authenticate', {
            userId: this.getUserId(),
            username: this.getUsername()
        });
        
        this.showNotification('Connected to game server', 'success');
    },
    
    onDisconnect() {
        console.log('Disconnected from Socket.IO server');
        this.showNotification('Disconnected from server. Reconnecting...', 'warning');
    },
    
    onConnectError(error) {
        console.error('Connection error:', error);
        this.showNotification('Connection error. Please check your internet.', 'error');
    },
    
    // Event registration
    on(event, callback) {
        if (!this.callbacks[event]) {
            this.callbacks[event] = [];
            this.socket.on(event, (data) => {
                this.callbacks[event].forEach(cb => cb(data));
            });
        }
        this.callbacks[event].push(callback);
    },
    
    off(event, callback) {
        if (this.callbacks[event]) {
            const index = this.callbacks[event].indexOf(callback);
            if (index > -1) {
                this.callbacks[event].splice(index, 1);
            }
        }
    },
    
    emit(event, data) {
        if (this.socket && this.socket.connected) {
            this.socket.emit(event, data);
            return true;
        } else {
            console.warn('Socket not connected, cannot emit:', event);
            return false;
        }
    },
    
    // Room management
    createRoom(roomData) {
        return this.emit('create_room', {
            ...roomData,
            userId: this.getUserId(),
            username: this.getUsername()
        });
    },
    
    joinRoom(roomId) {
        return this.emit('join_room', {
            roomId,
            userId: this.getUserId(),
            username: this.getUsername()
        });
    },
    
    leaveRoom(roomId) {
        return this.emit('leave_room', {
            roomId,
            userId: this.getUserId(),
            username: this.getUsername()
        });
    },
    
    inviteToRoom(roomId, targetUserId) {
        return this.emit('invite_to_room', {
            roomId,
            targetUserId,
            userId: this.getUserId(),
            username: this.getUsername()
        });
    },
    
    // Game actions
    startGame(roomId, gameType) {
        return this.emit('start_game', {
            roomId,
            gameType,
            userId: this.getUserId()
        });
    },
    
    submitSolution(roomId, challengeId, code, language = 'python') {
        return this.emit('submit_solution', {
            roomId,
            challengeId,
            code,
            language,
            userId: this.getUserId(),
            username: this.getUsername(),
            timestamp: Date.now()
        });
    },
    
    updateProgress(roomId, progress) {
        return this.emit('update_progress', {
            roomId,
            progress,
            userId: this.getUserId()
        });
    },
    
    sendChatMessage(roomId, message, type = 'public') {
        return this.emit('chat_message', {
            roomId,
            message,
            type,
            userId: this.getUserId(),
            username: this.getUsername(),
            timestamp: Date.now()
        });
    },
    
    // Utility methods
    getUserId() {
        return document.body.dataset.userId || 'anonymous';
    },
    
    getUsername() {
        return document.body.dataset.username || 'Anonymous';
    },
    
    getTheme() {
        return document.body.classList.contains('deadly-theme') ? 'deadly' : 'cute';
    },
    
    // Event handlers
    handleSystemMessage(data) {
        console.log('System:', data.message);
        this.showNotification(data.message, data.type || 'info');
    },
    
    handleUserConnected(data) {
        console.log('User connected:', data.username);
        if (data.userId !== this.getUserId()) {
            this.showNotification(`${data.username} is now online`, 'info');
        }
    },
    
    handleUserDisconnected(data) {
        console.log('User disconnected:', data.username);
        if (data.userId !== this.getUserId()) {
            this.showNotification(`${data.username} went offline`, 'warning');
        }
    },
    
    handleRoomCreated(data) {
        console.log('Room created:', data.room);
        // Update room list UI
        if (window.multiplayerGame && window.multiplayerGame.updateRoomList) {
            window.multiplayerGame.updateRoomList([data.room]);
        }
    },
    
    handleRoomUpdated(data) {
        console.log('Room updated:', data.room);
        // Update specific room in UI
    },
    
    handleRoomDeleted(data) {
        console.log('Room deleted:', data.roomId);
        // Remove room from UI
    },
    
    handleGameStart(data) {
        console.log('Game started:', data);
        // Initialize game UI
        if (window.game) {
            window.game.startMultiplayerGame(data);
        }
    },
    
    handleGameUpdate(data) {
        console.log('Game update:', data);
        // Update game state
        if (window.game && window.game.updateGameState) {
            window.game.updateGameState(data);
        }
    },
    
    handleGameEnd(data) {
        console.log('Game ended:', data);
        // Show results
        if (window.game && window.game.showResults) {
            window.game.showResults(data);
        }
    },
    
    handleChatMessage(data) {
        console.log('Chat message:', data);
        // Add message to chat UI
        if (window.chatManager && window.chatManager.addMessage) {
            window.chatManager.addMessage(data);
        }
    },
    
    handlePrivateMessage(data) {
        console.log('Private message:', data);
        // Show private message notification
        this.showNotification(`Private message from ${data.sender}`, 'info');
        
        if (window.chatManager && window.chatManager.addPrivateMessage) {
            window.chatManager.addPrivateMessage(data);
        }
    },
    
    handleNotification(data) {
        console.log('Notification:', data);
        this.showNotification(data.message, data.type || 'info');
    },
    
    handleAchievementUnlocked(data) {
        console.log('Achievement unlocked:', data);
        this.showAchievementNotification(data.achievement);
    },
    
    // UI Helpers
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `socket-notification ${type} ${this.getTheme()}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getIconForType(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
            min-width: 300px;
            max-width: 400px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
        `;
        
        // Style based on type and theme
        if (this.getTheme() === 'cute') {
            notification.style.background = 'white';
            notification.style.border = '2px solid var(--cute-primary)';
            notification.style.boxShadow = '0 4px 15px rgba(255, 158, 216, 0.2)';
        } else {
            notification.style.background = 'var(--deadly-secondary)';
            notification.style.border = '1px solid var(--deadly-primary)';
            notification.style.boxShadow = '0 4px 15px rgba(255, 70, 85, 0.2)';
        }
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOutRight 0.3s ease-out forwards';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    },
    
    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = `achievement-notification ${this.getTheme()}`;
        notification.innerHTML = `
            <div class="achievement-icon">${achievement.icon || '🏆'}</div>
            <div class="achievement-content">
                <h4>Achievement Unlocked!</h4>
                <h3>${achievement.name}</h3>
                <p>${achievement.description}</p>
                <div class="achievement-points">
                    <i class="fas fa-star"></i>
                    <span>+${achievement.points || 10} points</span>
                </div>
            </div>
            <div class="achievement-confetti"></div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 20px;
            border-radius: 15px;
            z-index: 10001;
            animation: popIn 0.5s ease-out;
            min-width: 350px;
            max-width: 500px;
            text-align: center;
        `;
        
        if (this.getTheme() === 'cute') {
            notification.style.background = 'linear-gradient(135deg, var(--cute-primary), var(--cute-accent))';
            notification.style.color = 'white';
            notification.style.boxShadow = '0 10px 30px rgba(255, 158, 216, 0.4)';
        } else {
            notification.style.background = 'linear-gradient(135deg, var(--deadly-primary), var(--deadly-secondary))';
            notification.style.color = 'var(--deadly-text)';
            notification.style.boxShadow = '0 10px 30px rgba(255, 70, 85, 0.4)';
        }
        
        document.body.appendChild(notification);
        
        // Add confetti effect
        this.createConfetti();
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'popOut 0.5s ease-out forwards';
                setTimeout(() => notification.remove(), 500);
            }
        }, 5000);
    },
    
    createConfetti() {
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        confettiContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10000;
        `;
        
        document.body.appendChild(confettiContainer);
        
        // Create confetti pieces
        const colors = this.getTheme() === 'cute' 
            ? ['#ff9ed8', '#a6e3ff', '#ffd166', '#ff9ed8']
            : ['#ff4655', '#1fc0ff', '#00ff9d', '#ffd166'];
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: absolute;
                width: ${10 + Math.random() * 10}px;
                height: ${10 + Math.random() * 10}px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                top: -20px;
                left: ${Math.random() * 100}%;
                border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
                opacity: ${0.7 + Math.random() * 0.3};
                animation: fall ${2 + Math.random() * 3}s linear forwards;
                transform: rotate(${Math.random() * 360}deg);
            `;
            
            confettiContainer.appendChild(confetti);
        }
        
        // Remove container after animation
        setTimeout(() => {
            confettiContainer.remove();
        }, 3000);
    },
    
    getIconForType(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    },
    
    setupEventListeners() {
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.emit('user_away', { userId: this.getUserId() });
            } else {
                this.emit('user_back', { userId: this.getUserId() });
            }
        });
        
        // Handle beforeunload
        window.addEventListener('beforeunload', () => {
            this.emit('user_leaving', { userId: this.getUserId() });
        });
    },
    
    // Connection status
    isConnected() {
        return this.socket && this.socket.connected;
    },
    
    getConnectionId() {
        return this.socket ? this.socket.id : null;
    },
    
    // Room utilities
    getCurrentRoom() {
        return this.socket ? this.socket.rooms.values().next().value : null;
    },
    
    // Reconnection
    reconnect() {
        if (this.socket) {
            this.socket.connect();
        }
    },
    
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
};

// Add CSS animations
const socketStyles = document.createElement('style');
socketStyles.textContent = `
@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOutRight {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}

@keyframes popIn {
    0% {
        transform: translate(-50%, -50%) scale(0.5);
        opacity: 0;
    }
    70% {
        transform: translate(-50%, -50%) scale(1.1);
    }
    100% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
    }
}

@keyframes popOut {
    0% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
    }
    100% {
        transform: translate(-50%, -50%) scale(0.5);
        opacity: 0;
    }
}

@keyframes fall {
    0% {
        transform: translateY(0) rotate(0deg);
        opacity: 1;
    }
    100% {
        transform: translateY(100vh) rotate(360deg);
        opacity: 0;
    }
}

.notification-close {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    padding: 0;
    font-size: 0.9rem;
    opacity: 0.7;
    transition: opacity 0.2s;
}

.notification-close:hover {
    opacity: 1;
}

.achievement-content h4 {
    margin: 0 0 5px 0;
    font-size: 0.9rem;
    opacity: 0.9;
}

.achievement-content h3 {
    margin: 0 0 10px 0;
    font-size: 1.5rem;
}

.achievement-content p {
    margin: 0 0 10px 0;
    opacity: 0.9;
}

.achievement-points {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.2);
}

.achievement-icon {
    font-size: 3rem;
    margin-bottom: 10px;
}
`;

document.head.appendChild(socketStyles);

// Initialize SocketManager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    SocketManager.init();
    window.SocketManager = SocketManager;
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SocketManager;
}