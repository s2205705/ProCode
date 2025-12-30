const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.static('public'));

const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Game state
const rooms = new Map();
const players = new Map();
const matchmakingQueue = [];

// Mock challenges
const challenges = {
    '1': {
        id: '1',
        title: 'Python Variables Challenge',
        difficulty: 'Beginner',
        points: 100,
        description: 'Create variables and perform basic operations.',
        requirements: 'Define three variables and return their sum',
        starter_code: `# Create three variables: a, b, c
# Assign them values: 5, 10, 15
# Return their sum

def solve_challenge():
    # Your code here
    return "Hello, World!"`
    },
    '2': {
        id: '2',
        title: 'Functions & Loops Challenge',
        difficulty: 'Intermediate',
        points: 200,
        description: 'Write a function that processes a list.',
        requirements: 'Create a function that doubles each number in a list',
        starter_code: `# Write a function that takes a list of numbers
# and returns a new list with each number doubled

def solve_challenge():
    # Your code here
    return []
`
    },
    '3': {
        id: '3',
        title: 'Data Structures Challenge',
        difficulty: 'Advanced',
        points: 300,
        description: 'Work with dictionaries and complex data structures.',
        requirements: 'Create a dictionary and manipulate its values',
        starter_code: `# Create a dictionary and perform operations on it

def solve_challenge():
    # Your code here
    return {}
`
    }
};

io.on('connection', (socket) => {
    console.log('New connection:', socket.id);
    
    let currentPlayer = {
        id: socket.id,
        username: null,
        userId: null,
        rating: 1350,
        currentRoom: null
    };

    // Register player
    socket.on('register_player', (data) => {
        currentPlayer.username = data.username || `Player_${socket.id.substring(0, 5)}`;
        currentPlayer.userId = data.userId || socket.id;
        currentPlayer.rating = data.rating || 1350;
        
        players.set(socket.id, currentPlayer);
        
        // Send online count
        io.emit('online_count', players.size);
        socket.emit('system_message', { message: `Welcome, ${currentPlayer.username}!` });
    });

    // Create room
    socket.on('create_room', (data) => {
        const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const roomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
        
        const room = {
            id: roomId,
            code: roomCode,
            name: data.name,
            creator: data.username,
            creatorId: data.userId,
            challengeId: data.challengeId,
            timeLimit: data.timeLimit || 300,
            isPrivate: data.isPrivate || false,
            players: [{
                id: socket.id,
                username: data.username,
                userId: data.userId,
                rating: data.rating,
                ready: false
            }],
            status: 'waiting',
            createdAt: Date.now()
        };
        
        rooms.set(roomId, room);
        currentPlayer.currentRoom = roomId;
        socket.join(roomId);
        
        socket.emit('room_created', {
            roomId: roomId,
            roomCode: roomCode,
            roomName: room.name
        });
        
        updateRoomList();
    });

    // Join room
    socket.on('join_room', (data) => {
        const room = rooms.get(data.roomId);
        
        if (!room) {
            socket.emit('system_message', { message: 'Room not found' });
            return;
        }
        
        if (room.players.length >= 2) {
            socket.emit('system_message', { message: 'Room is full' });
            return;
        }
        
        if (room.isPrivate && room.creatorId !== data.userId) {
            socket.emit('system_message', { message: 'Private room - invitation required' });
            return;
        }
        
        // Add player to room
        room.players.push({
            id: socket.id,
            username: data.username,
            userId: data.userId,
            rating: data.rating,
            ready: false
        });
        
        currentPlayer.currentRoom = data.roomId;
        socket.join(data.roomId);
        
        // Notify room
        socket.emit('joined_room', {
            roomId: data.roomId,
            roomName: room.name,
            roomCode: room.code,
            opponent: room.players.find(p => p.id !== socket.id)?.username
        });
        
        socket.to(data.roomId).emit('player_joined', {
            username: data.username,
            userId: data.userId,
            rating: data.rating
        });
        
        updateRoomList();
    });

    // Leave room
    socket.on('leave_room', (data) => {
        const room = rooms.get(data.roomId);
        
        if (room) {
            room.players = room.players.filter(p => p.id !== socket.id);
            
            // If room is empty, remove it
            if (room.players.length === 0) {
                rooms.delete(data.roomId);
            } else {
                // Notify remaining player
                socket.to(data.roomId).emit('player_left', {
                    username: data.username,
                    userId: data.userId
                });
                
                // Reset room status if battle was ongoing
                if (room.status === 'playing') {
                    room.status = 'waiting';
                    room.players.forEach(p => p.ready = false);
                }
            }
            
            currentPlayer.currentRoom = null;
            socket.leave(data.roomId);
            updateRoomList();
        }
    });

    // Player ready
    socket.on('player_ready', (data) => {
        const room = rooms.get(data.roomId);
        
        if (room) {
            const player = room.players.find(p => p.userId === data.userId);
            if (player) {
                player.ready = data.isReady;
                
                // Broadcast to room
                io.to(data.roomId).emit('player_ready', {
                    username: data.username,
                    userId: data.userId,
                    isReady: data.isReady
                });
                
                // Check if both players are ready
                if (room.players.length === 2 && room.players.every(p => p.ready)) {
                    startChallenge(room);
                }
            }
        }
    });

    // Start battle
    socket.on('start_battle', (data) => {
        const room = rooms.get(data.roomId);
        if (room) {
            startChallenge(room);
        }
    });

    // Code update
    socket.on('code_update', (data) => {
        socket.to(data.roomId).emit('code_update', {
            ...data,
            userId: currentPlayer.userId
        });
    });

    // Submit solution
    socket.on('submit_solution', (data) => {
        const room = rooms.get(data.roomId);
        if (room) {
            // Store solution
            if (!room.solutions) room.solutions = {};
            room.solutions[data.userId] = data;
            
            socket.to(data.roomId).emit('challenge_result', {
                ...data,
                userId: currentPlayer.userId
            });
            
            // Check if both players submitted
            if (room.solutions && Object.keys(room.solutions).length === 2) {
                calculateResults(room);
            }
        }
    });

    // Matchmaking
    socket.on('find_quick_match', (data) => {
        const player = {
            socketId: socket.id,
            username: data.username,
            userId: data.userId,
            rating: data.rating,
            joinedAt: Date.now()
        };
        
        // Add to matchmaking queue
        matchmakingQueue.push(player);
        
        socket.emit('matchmaking_update', {
            message: 'Searching for opponent...',
            position: matchmakingQueue.length
        });
        
        // Try to match players
        tryMatchPlayers();
    });

    socket.on('cancel_matchmaking', () => {
        const index = matchmakingQueue.findIndex(p => p.socketId === socket.id);
        if (index !== -1) {
            matchmakingQueue.splice(index, 1);
        }
    });

    // Chat
    socket.on('chat_message', (data) => {
        io.to(data.roomId).emit('chat_message', {
            ...data,
            userId: currentPlayer.userId
        });
    });

    // Get rooms
    socket.on('get_rooms', () => {
        updateRoomList();
    });

    // Request rematch
    socket.on('request_rematch', (data) => {
        socket.to(data.roomId).emit('system_message', {
            message: `${data.username} wants a rematch!`
        });
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log('Disconnected:', socket.id);
        
        // Remove from matchmaking
        const mmIndex = matchmakingQueue.findIndex(p => p.socketId === socket.id);
        if (mmIndex !== -1) {
            matchmakingQueue.splice(mmIndex, 1);
        }
        
        // Leave room if in one
        if (currentPlayer.currentRoom) {
            const room = rooms.get(currentPlayer.currentRoom);
            if (room) {
                room.players = room.players.filter(p => p.id !== socket.id);
                
                if (room.players.length === 0) {
                    rooms.delete(room.id);
                } else {
                    io.to(room.id).emit('player_left', {
                        username: currentPlayer.username,
                        userId: currentPlayer.userId
                    });
                }
                
                updateRoomList();
            }
        }
        
        // Remove player
        players.delete(socket.id);
        io.emit('online_count', players.size);
    });
});

function startChallenge(room) {
    room.status = 'playing';
    
    // Select challenge
    let challenge;
    if (room.challengeId && room.challengeId !== 'random') {
        challenge = challenges[room.challengeId];
    } else {
        // Select random challenge
        const challengeIds = Object.keys(challenges);
        const randomId = challengeIds[Math.floor(Math.random() * challengeIds.length)];
        challenge = challenges[randomId];
    }
    
    if (!challenge) {
        challenge = challenges['1']; // Default to first challenge
    }
    
    // Start battle
    io.to(room.id).emit('challenge_start', {
        challenge: challenge,
        timeLimit: room.timeLimit
    });
    
    updateRoomList();
}

function calculateResults(room) {
    const players = room.players;
    const solutions = room.solutions;
    
    // Calculate winner based on score
    let winner = null;
    let winnerScore = -1;
    
    players.forEach(player => {
        const solution = solutions[player.userId];
        if (solution && solution.score > winnerScore) {
            winnerScore = solution.score;
            winner = player.username;
        }
    });
    
    // Calculate rating changes
    const ratingChanges = {};
    players.forEach(player => {
        let ratingChange = 0;
        if (winner === player.username) {
            ratingChange = 25;
        } else if (winner) {
            ratingChange = -15;
        }
        ratingChanges[player.userId] = ratingChange;
    });
    
    // Send match results
    io.to(room.id).emit('match_complete', {
        winner: winner,
        player1: players[0].username,
        player2: players[1]?.username,
        player1Score: solutions[players[0].userId]?.score || 0,
        player2Score: solutions[players[1]?.userId]?.score || 0,
        ratingChange: ratingChanges[players[0].userId],
        xp: 100,
        winStreak: 1,
        codeQuality: Math.floor(Math.random() * 30) + 70,
        speed: Math.floor(Math.random() * 30) + 70,
        efficiency: Math.floor(Math.random() * 30) + 70
    });
    
    // Reset room for next game
    room.status = 'waiting';
    room.players.forEach(p => p.ready = false);
    delete room.solutions;
}

function tryMatchPlayers() {
    if (matchmakingQueue.length < 2) return;
    
    // Simple matchmaking: pair first two players
    const player1 = matchmakingQueue.shift();
    const player2 = matchmakingQueue.shift();
    
    // Create a room for them
    const roomId = `quick_match_${Date.now()}`;
    const room = {
        id: roomId,
        name: 'Quick Match',
        creator: 'System',
        creatorId: 'system',
        challengeId: 'random',
        timeLimit: 300,
        isPrivate: false,
        players: [
            {
                id: player1.socketId,
                username: player1.username,
                userId: player1.userId,
                rating: player1.rating,
                ready: false
            },
            {
                id: player2.socketId,
                username: player2.username,
                userId: player2.userId,
                rating: player2.rating,
                ready: false
            }
        ],
        status: 'waiting',
        createdAt: Date.now()
    };
    
    rooms.set(roomId, room);
    
    // Notify players
    io.to(player1.socketId).emit('matchmaking_update', { found: true });
    io.to(player2.socketId).emit('matchmaking_update', { found: true });
    
    // Join them to the room
    io.to(player1.socketId).emit('joined_room', {
        roomId: roomId,
        roomName: 'Quick Match',
        opponent: player2.username
    });
    
    io.to(player2.socketId).emit('joined_room', {
        roomId: roomId,
        roomName: 'Quick Match',
        opponent: player1.username
    });
    
    // Actually join sockets to room
    io.sockets.sockets.get(player1.socketId)?.join(roomId);
    io.sockets.sockets.get(player2.socketId)?.join(roomId);
    
    updateRoomList();
}

function updateRoomList() {
    const roomList = Array.from(rooms.values()).map(room => ({
        id: room.id,
        name: room.name,
        creator: room.creator,
        difficulty: challenges[room.challengeId]?.difficulty || 'Beginner',
        timeLimit: room.timeLimit,
        players: room.players.length,
        status: room.status
    }));
    
    io.emit('room_list', roomList);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
