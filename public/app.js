// WebSocket connection to PartyKit
let ws;
let currentUser = null;
let participants = [];
let isAnimating = false;

// Canvas and wheel variables
const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
let rotation = 0;
let targetRotation = 0;
let isSpinning = false;

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
    };
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleMessage(data);
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
        console.log('Disconnected from server');
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
    
    // Update status message
    if (state.isLocked) {
        document.getElementById('statusMessage').textContent = 
            state.gameStarted ? 'Game in progress...' : 'Entries locked!';
    } else {
        document.getElementById('statusMessage').textContent = 
            'Waiting for game to start...';
    }
    
    // Show winner if exists
    if (state.winner) {
        document.getElementById('winnerSection').classList.remove('hidden');
        document.getElementById('winnerName').textContent = state.winner.name;
    }
}

// Join the game
document.getElementById('joinForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('nameInput').value.trim();
    
    if (!name) return;
    
    currentUser = name;
    
    // Send join message
    ws.send(JSON.stringify({
        type: 'join',
        name: name
    }));
    
    // Show game section
    document.getElementById('joinSection').classList.add('hidden');
    document.getElementById('gameSection').classList.remove('hidden');
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
        ctx.font = 'bold 16px Arial';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 3;
        ctx.fillText(participant.name, radius - 20, 5);
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
