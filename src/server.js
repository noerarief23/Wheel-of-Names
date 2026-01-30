export default class WheelServer {
  constructor(room) {
    this.room = room;
  }

  async onStart() {
    // Initialize state when server starts
    this.state = await this.room.storage.get("state") || {
      participants: [],
      gameStarted: false,
      winner: null,
      isLocked: false
    };
  }

  async onConnect(connection, ctx) {
    // Send current state to newly connected client
    connection.send(JSON.stringify({
      type: "state",
      state: this.state
    }));
  }

  async onMessage(message, connection) {
    try {
      const data = JSON.parse(message);

      switch(data.type) {
        case "join":
          await this.handleJoin(data.name, connection);
          break;
        
        case "start":
          await this.handleStart(connection);
          break;
        
        case "reset":
          await this.handleReset(connection);
          break;
      }
    } catch (error) {
      connection.send(JSON.stringify({
        type: "error",
        message: "Invalid message format"
      }));
    }
  }

  async handleJoin(name, connection) {
    // Validate name
    if (!name || typeof name !== 'string') {
      connection.send(JSON.stringify({
        type: "error",
        message: "Invalid name."
      }));
      return;
    }

    // Validate name length
    const trimmedName = name.trim();
    if (trimmedName.length === 0 || trimmedName.length > 50) {
      connection.send(JSON.stringify({
        type: "error",
        message: "Name must be between 1 and 50 characters."
      }));
      return;
    }

    // Don't allow joins if game is locked
    if (this.state.isLocked) {
      connection.send(JSON.stringify({
        type: "error",
        message: "Game is locked. Cannot join."
      }));
      return;
    }

    // Check maximum participants
    if (this.state.participants.length >= 100) {
      connection.send(JSON.stringify({
        type: "error",
        message: "Maximum number of participants reached."
      }));
      return;
    }

    // Check if name already exists
    if (this.state.participants.some(p => p.name === trimmedName)) {
      connection.send(JSON.stringify({
        type: "error",
        message: "Name already exists. Please choose another."
      }));
      return;
    }

    // Add participant
    this.state.participants.push({
      name: trimmedName,
      id: crypto.randomUUID()
    });

    await this.saveState();
    this.broadcastState();
  }

  async handleStart(connection) {
    // Can only start once
    if (this.state.gameStarted) {
      connection.send(JSON.stringify({
        type: "error",
        message: "Game already started."
      }));
      return;
    }

    // Need at least 2 participants
    if (this.state.participants.length < 2) {
      connection.send(JSON.stringify({
        type: "error",
        message: "Need at least 2 participants to start."
      }));
      return;
    }

    // Lock entries and start game
    this.state.isLocked = true;
    this.state.gameStarted = true;

    // Select winner randomly on server
    const winnerIndex = Math.floor(Math.random() * this.state.participants.length);
    this.state.winner = this.state.participants[winnerIndex];

    await this.saveState();
    
    // Broadcast the winner to all clients
    this.room.broadcast(JSON.stringify({
      type: "winner",
      winner: this.state.winner,
      winnerIndex: winnerIndex
    }));
  }

  async handleReset(connection) {
    // Reset the game state
    this.state = {
      participants: [],
      gameStarted: false,
      winner: null,
      isLocked: false
    };

    await this.saveState();
    this.broadcastState();
  }

  async saveState() {
    await this.room.storage.put("state", this.state);
  }

  broadcastState() {
    this.room.broadcast(JSON.stringify({
      type: "state",
      state: this.state
    }));
  }
}
