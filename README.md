# Wheel of Names 🎡

A real-time web-based doorprize game built with PartyKit. Users can join a shared lobby, and an admin can start the game to randomly select a winner. All participants see the same synchronized wheel animation.

## Features

- **Real-time synchronization** using PartyKit WebSockets
- **User page** for joining the game and viewing the wheel
- **Admin page** for controlling the game (start/reset)
- **Server-side winner selection** ensures fairness
- **Synchronized wheel animation** across all connected clients
- **Lock mechanism** prevents new entries after game starts
- Built with **vanilla HTML, CSS, and JavaScript**

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/noerarief23/Wheel-of-Names.git
cd Wheel-of-Names
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open your browser:
   - **User page**: http://localhost:1999/
   - **Admin page**: http://localhost:1999/admin.html

## How to Use

### For Participants:
1. Open the user page (index.html)
2. Enter your name and click "Join"
3. Wait for the admin to start the game
4. Watch the wheel spin and see who wins!

### For Admin:
1. Open the admin page (admin.html)
2. Wait for participants to join
3. Click "Start Game" when ready (requires at least 2 participants)
4. The game will lock entries and select a winner
5. Use "Reset Game" to start over

## Project Structure

```
Wheel-of-Names/
├── src/
│   └── server.js          # PartyKit server logic
├── public/
│   ├── index.html         # User page
│   ├── admin.html         # Admin page
│   ├── app.js            # User page JavaScript
│   ├── admin.js          # Admin page JavaScript
│   └── style.css         # Styles
├── package.json
├── partykit.json
└── README.md
```

## Technology Stack

- **PartyKit**: Real-time multiplayer infrastructure
- **WebSocket**: Real-time bidirectional communication
- **Canvas API**: Wheel rendering and animation
- **Vanilla JavaScript**: No frameworks needed

## Deployment

### Deploy to PartyKit Cloud

Deploy the full real-time application to PartyKit:

```bash
npm run deploy
```

### Deploy to GitHub Pages

The repository includes a GitHub Actions workflow that automatically deploys the static files to GitHub Pages when you push to the `main` branch.

**Setup Instructions:**

1. Go to your repository Settings → Pages
2. Under "Build and deployment", select "GitHub Actions" as the source
3. Push your changes to the `main` branch
4. The workflow will automatically build and deploy your site

**Note:** GitHub Pages deployment serves the static HTML/CSS/JS files. For full real-time functionality with WebSockets, you'll need to deploy the PartyKit server separately and update the WebSocket URLs in the client code to point to your PartyKit deployment.

Alternatively, you can run the complete application with PartyKit locally or deploy it to PartyKit cloud for full real-time features.

## License

MIT