// WebSocket connection to PartyKit
let ws;
let currentUser = null;
let participants = [];
let isAnimating = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY = 1000; // 1 second

// Canvas and wheel variables
const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
let rotation = 0;
let targetRotation = 0;

const COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B4D9', '#A8E6CF'
];

// Connect to PartyKit server
function connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    
    // For local development with PartyKit
    const wsUrl = `${protocol}//${host}/party/wheel`;
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        console.log('Connected to server');
        reconnectAttempts = 0; // Reset reconnect attempts on successful connection
    };
    
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            handleMessage(data);
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
        console.log('Disconnected from server');
        
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            const delay = BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts);
            console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
            reconnectAttempts++;
            setTimeout(connect, delay);
        } else {
            console.error('Max reconnection attempts reached. Please refresh the page.');
            showError('Connection lost. Please refresh the page.');
        }
    };
}

// Handle messages from server
function handleMessage(data) {
    switch(data.type) {
        case 'state':
            updateState(data.state);
            break;
        
        case 'winner':
            showWinner(data.winner, data.winnerIndex);
            break;
        
        case 'error':
            showError(data.message);
            break;
    }
}

// Update state from server
function updateState(state) {
    participants = state.participants || [];
    
    // Update participant list
    updateParticipantList();
    
    // Draw wheel
    drawWheel();
    
    // If current user is in the participant list, show game section
    if (currentUser && participants.some(p => p.name === currentUser)) {
        document.getElementById('joinSection').classList.add('hidden');
        document.getElementById('gameSection').classList.remove('hidden');
    }
    
    // Update status message
    if (state.isLocked) {
        document.getElementById('statusMessage').textContent = 
            state.gameStarted ? 'Game in progress...' : 'Entries locked!';
    } else {
        document.getElementById('statusMessage').textContent = 
            'Waiting for game to start...';
    }
    
    // Winner display is handled via the dedicated 'winner' message
    // (see handleMessage → showWinner), which ensures the wheel
    // animation completes before revealing the winner. Do not show
    // the winner directly from state updates to avoid bypassing
    // the animation for late-joining or reconnecting users.
}

// Join the game
document.getElementById('joinForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('nameInput').value.trim();
    
    if (!name) return;
    
    // Check WebSocket is ready
    if (ws.readyState !== WebSocket.OPEN) {
        showError('Not connected to server. Please wait...');
        return;
    }
    
    // Send join message - don't set currentUser yet
    // It will be set after server confirms via state update
    ws.send(JSON.stringify({
        type: 'join',
        name: name
    }));
    
    // Temporarily store the name to check for join confirmation
    currentUser = name;
    
    // Show game section only after successful join
    // (will be handled by state update from server)
});

// Update participant list
function updateParticipantList() {
    const list = document.getElementById('participantList');
    const count = document.getElementById('participantCount');
    
    list.innerHTML = '';
    count.textContent = participants.length;
    
    participants.forEach(participant => {
        const li = document.createElement('li');
        li.textContent = participant.name;
        if (participant.name === currentUser) {
            li.style.fontWeight = 'bold';
            li.style.background = '#e3f2fd';
        }
        list.appendChild(li);
    });
}

// Draw the wheel
function drawWheel() {
    if (!participants.length) return;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 200;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const sliceAngle = (2 * Math.PI) / participants.length;
    
    participants.forEach((participant, index) => {
        const startAngle = rotation + (index * sliceAngle);
        const endAngle = startAngle + sliceAngle;
        
        // Draw slice
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = COLORS[index % COLORS.length];
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = 'white';
        
        // Dynamically adjust font size and truncate long names to fit
        const baseFontSize = 16;
        const minFontSize = 10;
        const maxTextWidth = radius - 60; // keep text away from center
        let fontSize = baseFontSize;
        let text = participant.name;

        ctx.font = 'bold ' + fontSize + 'px Arial';

        // Reduce font size until text fits or minimum size reached
        while (fontSize > minFontSize && ctx.measureText(text).width > maxTextWidth) {
            fontSize -= 1;
            ctx.font = 'bold ' + fontSize + 'px Arial';
        }

        // If still too wide, truncate and add ellipsis
        if (ctx.measureText(text).width > maxTextWidth) {
            const ellipsis = '…';
            let truncated = text;
            while (truncated.length > 0 && ctx.measureText(truncated + ellipsis).width > maxTextWidth) {
                truncated = truncated.slice(0, -1);
            }
            text = truncated + ellipsis;
        }

        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 3;
        ctx.fillText(text, radius - 20, 5);
        ctx.restore();
    });
    
    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.stroke();
}

// Show winner with animation
function showWinner(winner, winnerIndex) {
    if (isAnimating) return;
    
    isAnimating = true;
    const sliceAngle = (2 * Math.PI) / participants.length;
    
    // Calculate target rotation to land on winner
    // We want the winner slice to be at the top (pointer position)
    const winnerSliceMiddle = winnerIndex * sliceAngle + sliceAngle / 2;
    
    // Calculate how much to rotate to align winner with top (0 radians)
    // Add multiple full rotations for effect (5 full spins)
    const spins = 5;
    targetRotation = rotation + (2 * Math.PI * spins) - winnerSliceMiddle;
    
    animateWheel();
}

// Animate wheel spinning
function animateWheel() {
    const diff = targetRotation - rotation;
    
    if (Math.abs(diff) > 0.01) {
        rotation += diff * 0.05; // Ease out
        drawWheel();
        requestAnimationFrame(animateWheel);
    } else {
        rotation = targetRotation;
        drawWheel();
        isAnimating = false;
        
        // Show winner section
        document.getElementById('winnerSection').classList.remove('hidden');
    }
}

// Show error message
function showError(message) {
    const errorEl = document.getElementById('errorMessage');
    errorEl.textContent = message;
    setTimeout(() => {
        errorEl.textContent = '';
    }, 3000);
}

// Initialize
connect();
drawWheel();
