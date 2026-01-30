// WebSocket connection to PartyKit
let ws;
let participants = [];

// Connect to PartyKit server
function connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    
    // For local development with PartyKit
    const wsUrl = `${protocol}//${host}/party/wheel`;
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        console.log('Connected to server');
        updateMessage('Connected to server');
    };
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleMessage(data);
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        updateMessage('Connection error', true);
    };
    
    ws.onclose = () => {
        console.log('Disconnected from server');
        updateMessage('Disconnected. Reconnecting...');
        setTimeout(connect, 3000); // Reconnect after 3 seconds
    };
}

// Handle messages from server
function handleMessage(data) {
    switch(data.type) {
        case 'state':
            updateState(data.state);
            break;
        
        case 'winner':
            updateState({ ...data, gameStarted: true, isLocked: true });
            updateMessage(`Winner selected: ${data.winner.name}!`);
            break;
        
        case 'error':
            updateMessage(data.message, true);
            break;
    }
}

// Update state from server
function updateState(state) {
    participants = state.participants || [];
    
    // Update participant list
    updateParticipantList();
    
    // Update game status
    const gameStatus = document.getElementById('gameStatus');
    const entriesStatus = document.getElementById('entriesStatus');
    const currentWinner = document.getElementById('currentWinner');
    
    gameStatus.textContent = state.gameStarted ? 'Started' : 'Waiting';
    gameStatus.style.color = state.gameStarted ? '#28a745' : '#ffc107';
    
    entriesStatus.textContent = state.isLocked ? 'Locked' : 'Open';
    entriesStatus.style.color = state.isLocked ? '#dc3545' : '#28a745';
    
    currentWinner.textContent = state.winner ? state.winner.name : 'None';
    currentWinner.style.color = state.winner ? '#28a745' : '#6c757d';
    
    // Update button states
    document.getElementById('startButton').disabled = 
        state.gameStarted || participants.length < 2;
}

// Update participant list
function updateParticipantList() {
    const list = document.getElementById('participantList');
    const count = document.getElementById('participantCount');
    
    list.innerHTML = '';
    count.textContent = participants.length;
    
    if (participants.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No participants yet';
        li.style.fontStyle = 'italic';
        li.style.color = '#999';
        list.appendChild(li);
    } else {
        participants.forEach((participant, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}. ${participant.name}`;
            list.appendChild(li);
        });
    }
}

// Update message
function updateMessage(message, isError = false) {
    const messageEl = document.getElementById('adminMessage');
    messageEl.textContent = message;
    messageEl.style.color = isError ? '#dc3545' : '#28a745';
}

// Start game
document.getElementById('startButton').addEventListener('click', () => {
    ws.send(JSON.stringify({ type: 'start' }));
    updateMessage('Starting game...');
});

// Reset game
document.getElementById('resetButton').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset the game? This will clear all participants.')) {
        ws.send(JSON.stringify({ type: 'reset' }));
        updateMessage('Game reset');
    }
});

// Initialize
connect();
