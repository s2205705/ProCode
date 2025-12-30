/**
 * Multiplayer Game Module
 * Handles real-time 1v1 coding battles
 */

class MultiplayerGame {
    constructor() {
        this.socket = null;
        this.currentRoom = null;
        this.opponent = null;
        this.currentChallenge = null;
        this.matchTimer = null;
        this.timeRemaining = 300; // 5 minutes
        this.isPlayerReady = false;
        this.isOpponentReady = false;
        this.playerCode = '';
        this.opponentCode = '';
        this.results = null;
        this.theme = document.body.classList.contains('deadly-theme') ? 'deadly' : 'cute';
        
        this.init();
    }
    
    init() {
        this.connectSocket();
        this.setupEventListeners();
        this.updateAvailableRooms();
    }
    
    connectSocket() {
        // Connect to SocketIO server
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Connected to multiplayer server');
            this.updateStatus('Connected to server', 'success');
        });
        
        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.updateStatus('Disconnected from server', 'error');
        });
        
        this.socket.on('room_list', (rooms) => {
            this.updateRoomList(rooms);
        });
        
        this.socket.on('joined_room', (data) => {
            this.handleJoinedRoom(data);
        });
        
        this.socket.on('player_joined', (data) => {
            this.handlePlayerJoined(data);
        });
        
        this.socket.on('player_left', (data) => {
            this.handlePlayerLeft(data);
        });
        
        this.socket.on('player_ready', (data) => {
            this.handlePlayerReady(data);
        });
        
        this.socket.on('challenge_start', (data) => {
            this.startChallenge(data);
        });
        
        this.socket.on('code_update', (data) => {
            this.handleCodeUpdate(data);
        });
        
        this.socket.on('challenge_result', (data) => {
            this.handleChallengeResult(data);
        });
        
        this.socket.on('match_complete', (data) => {
            this.handleMatchComplete(data);
        });
        
        this.socket.on('message', (data) => {
            this.addMessage(data.msg, data.type || 'system');
        });
    }
    
    setupEventListeners() {
        // Room creation
        document.getElementById('createRoomBtn')?.addEventListener('click', () => this.createRoom());
        document.getElementById('joinRoomBtn')?.addEventListener('click', () => this.joinRoom());
        document.getElementById('leaveRoomBtn')?.addEventListener('click', () => this.leaveRoom());
        
        // Game controls
        document.getElementById('readyBtn')?.addEventListener('click', () => this.toggleReady());
        document.getElementById('submitMultiplayerBtn')?.addEventListener('click', () => this.submitCode());
        document.getElementById('runMultiplayerBtn')?.addEventListener('click', () => this.runCode());
        
        // Challenge selection
        document.getElementById('challengeSelect')?.addEventListener('change', (e) => {
            this.selectChallenge(e.target.value);
        });
        
        // Code editor events
        const codeEditor = document.getElementById('multiplayerCode');
        if (codeEditor) {
            codeEditor.addEventListener('input', (e) => {
                this.playerCode = e.target.value;
                this.sendCodeUpdate();
            });
        }
        
        // Refresh rooms
        document.getElementById('refreshRoomsBtn')?.addEventListener('click', () => {
            this.updateAvailableRooms();
        });
        
        // Quick match
        document.getElementById('quickMatchBtn')?.addEventListener('click', () => {
            this.findQuickMatch();
        });
    }
    
    createRoom() {
        const roomName = document.getElementById('roomName').value || `Room_${Date.now()}`;
        const isPrivate = document.getElementById('privateRoom').checked;
        const maxPlayers = 2; // 1v1 only
        
        this.socket.emit('create_room', {
            roomName: roomName,
            isPrivate: isPrivate,
            maxPlayers: maxPlayers,
            username: this.getUsername()
        });
        
        this.addMessage(`Creating room: ${roomName}`, 'system');
    }
    
    joinRoom(roomId = null) {
        if (!roomId) {
            roomId = document.getElementById('roomSelect').value;
        }
        
        if (!roomId) {
            this.showNotification('Please select a room to join', 'error');
            return;
        }
        
        this.socket.emit('join_room', {
            roomId: roomId,
            username: this.getUsername()
        });
    }
    
    leaveRoom() {
        if (this.currentRoom) {
            this.socket.emit('leave_room', {
                roomId: this.currentRoom,
                username: this.getUsername()
            });
            
            this.resetRoomState();
            this.showNotification('Left the room', 'info');
        }
    }
    
    findQuickMatch() {
        this.socket.emit('find_match', {
            username: this.getUsername(),
            rating: this.getPlayerRating()
        });
        
        this.updateStatus('Searching for opponent...', 'info');
        this.showNotification('Looking for a quick match', 'info');
    }
    
    toggleReady() {
        if (!this.currentRoom) return;
        
        this.isPlayerReady = !this.isPlayerReady;
        const readyBtn = document.getElementById('readyBtn');
        
        if (this.isPlayerReady) {
            readyBtn.textContent = 'Not Ready';
            readyBtn.classList.add('ready');
        } else {
            readyBtn.textContent = 'Ready';
            readyBtn.classList.remove('ready');
        }
        
        this.socket.emit('player_ready', {
            roomId: this.currentRoom,
            username: this.getUsername(),
            isReady: this.isPlayerReady
        });
    }
    
    selectChallenge(challengeId) {
        if (!this.currentRoom || !challengeId) return;
        
        this.socket.emit('select_challenge', {
            roomId: this.currentRoom,
            challengeId: challengeId,
            username: this.getUsername()
        });
    }
    
    runCode() {
        const code = document.getElementById('multiplayerCode').value;
        const outputElement = document.getElementById('multiplayerOutput');
        
        try {
            // Create safe execution environment
            const safeContext = {
                console: { log: (...args) => args.join(' ') },
                Math: Math,
                String: String,
                Number: Number,
                Array: Array,
                Object: Object
            };
            
            const func = new Function(...Object.keys(safeContext), `
                "use strict";
                try {
                    ${code}
                    return "Execution successful";
                } catch (e) {
                    return "Error: " + e.message;
                }
            `);
            
            const result = func(...Object.values(safeContext));
            outputElement.textContent = result;
            outputElement.className = 'success';
            
            this.showNotification('Code executed successfully', 'success');
        } catch (error) {
            outputElement.textContent = `Error: ${error.message}`;
            outputElement.className = 'error';
            
            this.showNotification('Code execution failed', 'error');
        }
    }
    
    submitCode() {
        if (!this.currentRoom || !this.currentChallenge) {
            this.showNotification('No active challenge', 'error');
            return;
        }
        
        const code = document.getElementById('multiplayerCode').value;
        
        this.socket.emit('submit_challenge', {
            roomId: this.currentRoom,
            username: this.getUsername(),
            code: code,
            challengeId: this.currentChallenge.id,
            timestamp: Date.now()
        });
        
        this.showNotification('Code submitted!', 'success');
    }
    
    sendCodeUpdate() {
        if (!this.currentRoom) return;
        
        this.socket.emit('code_update', {
            roomId: this.currentRoom,
            username: this.getUsername(),
            code: this.playerCode,
            timestamp: Date.now()
        });
    }
    
    updateRoomList(rooms) {
        const roomSelect = document.getElementById('roomSelect');
        const roomList = document.getElementById('roomList');
        
        if (roomSelect) {
            roomSelect.innerHTML = '<option value="">Select a room...</option>';
            rooms.forEach(room => {
                const option = document.createElement('option');
                option.value = room.id;
                option.textContent = `${room.name} (${room.players}/${room.maxPlayers})`;
                roomSelect.appendChild(option);
            });
        }
        
        if (roomList) {
            roomList.innerHTML = '';
            rooms.forEach(room => {
                const roomElement = this.createRoomElement(room);
                roomList.appendChild(roomElement);
            });
        }
    }
    
    createRoomElement(room) {
        const div = document.createElement('div');
        div.className = `room-item ${this.theme}`;
        div.innerHTML = `
            <div class="room-info">
                <h4>${room.name}</h4>
                <p>Players: ${room.players}/${room.maxPlayers}</p>
                <p>Status: ${room.status}</p>
                ${room.challenge ? `<p>Challenge: ${room.challenge.title}</p>` : ''}
            </div>
            <button class="join-room-btn ${this.theme}" data-room-id="${room.id}">
                Join
            </button>
        `;
        
        div.querySelector('.join-room-btn').addEventListener('click', (e) => {
            this.joinRoom(e.target.dataset.roomId);
        });
        
        return div;
    }
    
    handleJoinedRoom(data) {
        this.currentRoom = data.roomId;
        this.opponent = data.opponent;
        
        this.updateStatus(`Joined room: ${data.roomId}`, 'success');
        this.showRoomUI();
        this.addMessage(`You joined ${data.roomId}`, 'system');
        
        if (data.opponent) {
            this.addMessage(`${data.opponent} is in the room`, 'player-joined');
        }
    }
    
    handlePlayerJoined(data) {
        this.opponent = data.username;
        this.addMessage(`${data.username} joined the room`, 'player-joined');
        
        this.updateOpponentInfo(data.username);
        this.showNotification(`${data.username} joined the match!`, 'info');
    }
    
    handlePlayerLeft(data) {
        this.addMessage(`${data.username} left the room`, 'player-left');
        
        if (data.username === this.opponent) {
            this.opponent = null;
            this.updateOpponentInfo('Waiting for opponent...');
            this.resetChallengeState();
            this.showNotification('Opponent left the match', 'warning');
        }
    }
    
    handlePlayerReady(data) {
        if (data.username === this.getUsername()) {
            // Our own ready status
            this.isPlayerReady = data.isReady;
        } else {
            // Opponent's ready status
            this.isOpponentReady = data.isReady;
            this.updateOpponentReady(data.isReady);
            
            if (data.isReady) {
                this.addMessage(`${data.username} is ready!`, 'player-ready');
            }
        }
        
        // Check if both players are ready
        if (this.isPlayerReady && this.isOpponentReady) {
            this.requestChallengeStart();
        }
    }
    
    startChallenge(data) {
        this.currentChallenge = data.challenge;
        this.timeRemaining = data.timeLimit || 300;
        this.isPlayerReady = false;
        this.isOpponentReady = false;
        
        // Update UI for challenge start
        this.showChallengeUI();
        this.updateChallengeInfo(data.challenge);
        this.startMatchTimer();
        
        // Load starter code
        if (data.challenge.starter_code) {
            document.getElementById('multiplayerCode').value = data.challenge.starter_code;
            this.playerCode = data.challenge.starter_code;
        }
        
        this.addMessage(`Challenge started: ${data.challenge.title}`, 'system');
        this.showNotification('Challenge started! Good luck!', 'info');
    }
    
    handleCodeUpdate(data) {
        if (data.username === this.opponent) {
            // Show opponent's code activity (not the actual code)
            this.updateOpponentActivity('Opponent is coding...');
            
            // You could show a typing indicator or code length
            const codeLength = data.code.length;
            this.updateOpponentCodeInfo(`Code length: ${codeLength} chars`);
        }
    }
    
    handleChallengeResult(data) {
        if (data.username === this.getUsername()) {
            // Our result
            this.showResult(data, 'player');
        } else {
            // Opponent's result
            this.showResult(data, 'opponent');
        }
        
        // Store results for comparison
        if (!this.results) this.results = {};
        this.results[data.username] = data;
        
        // Check if both results are in
        if (this.results[this.getUsername()] && this.results[this.opponent]) {
            this.compareResults();
        }
    }
    
    handleMatchComplete(data) {
        this.stopMatchTimer();
        this.showMatchResults(data);
        
        // Update player stats
        if (data.winner === this.getUsername()) {
            this.showNotification('🎉 You won the match!', 'success');
        } else if (data.winner === this.opponent) {
            this.showNotification('💥 You lost the match', 'error');
        } else {
            this.showNotification('🤝 Match ended in a draw', 'info');
        }
        
        // Reset after delay
        setTimeout(() => {
            this.resetChallengeState();
            this.showRoomUI();
        }, 5000);
    }
    
    startMatchTimer() {
        this.stopMatchTimer();
        
        const timerElement = document.getElementById('matchTimer');
        if (timerElement) {
            this.matchTimer = setInterval(() => {
                this.timeRemaining--;
                
                const minutes = Math.floor(this.timeRemaining / 60);
                const seconds = this.timeRemaining % 60;
                timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                
                // Color code based on time remaining
                if (this.timeRemaining <= 60) {
                    timerElement.classList.add('warning');
                }
                if (this.timeRemaining <= 30) {
                    timerElement.classList.add('critical');
                }
                
                if (this.timeRemaining <= 0) {
                    this.stopMatchTimer();
                    this.submitCode(); // Auto-submit when time runs out
                }
            }, 1000);
        }
    }
    
    stopMatchTimer() {
        if (this.matchTimer) {
            clearInterval(this.matchTimer);
            this.matchTimer = null;
        }
    }
    
    updateAvailableRooms() {
        this.socket.emit('get_rooms');
    }
    
    requestChallengeStart() {
        if (!this.currentRoom) return;
        
        this.socket.emit('start_challenge', {
            roomId: this.currentRoom,
            username: this.getUsername()
        });
    }
    
    compareResults() {
        const playerResult = this.results[this.getUsername()];
        const opponentResult = this.results[this.opponent];
        
        // Determine winner based on score and time
        let winner = null;
        if (playerResult.score > opponentResult.score) {
            winner = this.getUsername();
        } else if (opponentResult.score > playerResult.score) {
            winner = this.opponent;
        } else {
            // Tie - could use time as tiebreaker
            winner = null; // Draw
        }
        
        // Emit match results
        this.socket.emit('match_result', {
            roomId: this.currentRoom,
            winner: winner,
            player1: this.getUsername(),
            player2: this.opponent,
            player1Score: playerResult.score,
            player2Score: opponentResult.score
        });
    }
    
    // UI Update Methods
    showRoomUI() {
        document.getElementById('roomSelection')?.classList.add('hidden');
        document.getElementById('roomLobby')?.classList.remove('hidden');
        document.getElementById('challengeArea')?.classList.add('hidden');
        document.getElementById('matchResults')?.classList.add('hidden');
    }
    
    showChallengeUI() {
        document.getElementById('roomLobby')?.classList.add('hidden');
        document.getElementById('challengeArea')?.classList.remove('hidden');
    }
    
    updateStatus(message, type) {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `status ${type}`;
        }
    }
    
    updateOpponentInfo(username) {
        const opponentElement = document.getElementById('opponentName');
        if (opponentElement) {
            opponentElement.textContent = username || 'Waiting for opponent...';
        }
    }
    
    updateOpponentReady(isReady) {
        const readyElement = document.getElementById('opponentReady');
        if (readyElement) {
            readyElement.textContent = isReady ? 'Ready ✓' : 'Not Ready';
            readyElement.className = isReady ? 'ready' : 'not-ready';
        }
    }
    
    updateOpponentActivity(activity) {
        const activityElement = document.getElementById('opponentActivity');
        if (activityElement) {
            activityElement.textContent = activity;
        }
    }
    
    updateOpponentCodeInfo(info) {
        const infoElement = document.getElementById('opponentCodeInfo');
        if (infoElement) {
            infoElement.textContent = info;
        }
    }
    
    updateChallengeInfo(challenge) {
        document.getElementById('challengeTitle').textContent = challenge.title;
        document.getElementById('challengeDescription').textContent = challenge.description;
        document.getElementById('challengePoints').textContent = `Points: ${challenge.points}`;
        document.getElementById('challengeDifficulty').textContent = `Difficulty: ${challenge.difficulty}`;
    }
    
    showResult(data, playerType) {
        const resultElement = document.getElementById(`${playerType}Result`);
        if (resultElement) {
            resultElement.innerHTML = `
                <h4>${data.username}'s Result</h4>
                <p>Score: ${data.score}</p>
                <p>Status: ${data.result.passed ? 'Passed ✓' : 'Failed ✗'}</p>
                ${data.result.output ? `<p>Output: ${data.result.output}</p>` : ''}
            `;
            resultElement.className = data.result.passed ? 'success' : 'error';
        }
    }
    
    showMatchResults(data) {
        const resultsElement = document.getElementById('matchResults');
        if (resultsElement) {
            resultsElement.innerHTML = `
                <h3>Match Results</h3>
                <div class="result-summary">
                    <p>Winner: ${data.winner || 'Draw'}</p>
                    <p>Score: ${data.player1} ${data.player1Score} - ${data.player2Score} ${data.player2}</p>
                    <p>Rating Changes: ${data.ratingChanges || 'Calculating...'}</p>
                </div>
            `;
            resultsElement.classList.remove('hidden');
        }
    }
    
    resetRoomState() {
        this.currentRoom = null;
        this.opponent = null;
        this.currentChallenge = null;
        this.isPlayerReady = false;
        this.isOpponentReady = false;
        this.playerCode = '';
        this.opponentCode = '';
        this.results = null;
        
        document.getElementById('roomSelection')?.classList.remove('hidden');
        document.getElementById('roomLobby')?.classList.add('hidden');
        document.getElementById('challengeArea')?.classList.add('hidden');
        document.getElementById('matchResults')?.classList.add('hidden');
    }
    
    resetChallengeState() {
        this.stopMatchTimer();
        this.currentChallenge = null;
        this.timeRemaining = 300;
        this.results = null;
        
        // Reset UI elements
        const timerElement = document.getElementById('matchTimer');
        if (timerElement) {
            timerElement.textContent = '5:00';
            timerElement.className = '';
        }
    }
    
    addMessage(message, type) {
        const chatBox = document.getElementById('multiplayerChat');
        if (!chatBox) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${type}`;
        messageElement.textContent = message;
        
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
    
    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type} ${this.theme}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    getUsername() {
        return document.body.dataset.username || 'Player';
    }
    
    getPlayerRating() {
        return parseInt(document.body.dataset.rating) || 1000;
    }
}

// Initialize multiplayer game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.multiplayerGame = new MultiplayerGame();
});