# 🎴 UNO Multiplayer — Real-Time Web Game

> A browser-based multiplayer UNO game with real-time state synchronization, room-based session management, and zero-install instant play — built for parties, built for the web.

🌐 **Play Now (Advanced Version):** [uno-pro-1.onrender.com](https://uno-pro-1.onrender.com/)

---

## ✨ What's Under the Hood

- 🔄 **Real-time sync** via WebSockets — all 4 players see the same game state instantly
- 🏠 **Room-based sessions** — create or join rooms with a shareable code, no accounts needed
- 🧠 **Server-side game logic** — card validation, turn sequencing, draw mechanics, and win detection enforced on the server, never trusted to the client
- 🎮 **Host-controlled lifecycle** — room creator controls when the game starts
- ⚡ **Zero install** — runs entirely in the browser, share a link and play

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Server | Express |
| Real-time | WebSockets (Socket.io) |
| Frontend | HTML / CSS / JS |
| Deployment | Render |

---

## 🚀 Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/your-username/uno-multiplayer

# 2. Move into backend
cd backend

# 3. Install dependencies
npm install

# 4. Start the server
node server.js

# 5. Open in browser
# http://localhost:3000
```

---

## 🎮 How to Play

1. Open `localhost:3000` — you'll see **Create Room** and **Join Room**
2. Click **Create Room**, enter your name — note the room code shown
3. Open 3 more browser tabs, click **Join Room**, enter the same room code
4. Once all 4 players are in, the host sees a **Start Game** button — click it
5. Play cards by clicking them; draw a card by clicking the center UNO deck image
6. Standard UNO rules apply — match color or number, play action cards strategically

---

## 🚧 Known Limitations & What's Next

| Gap | Planned Fix |
|---|---|
| Frontend not fully responsive | Mobile-first redesign with CSS Grid/Flexbox |
| Fixed 4-player room size | Configurable 2–6 player lobbies |
| No spectator mode | Read-only room join for observers |
| No reconnection handling | Persist session state on disconnect/rejoin |

---

*Core game logic and real-time infrastructure are production-ready — UI polish and mobile responsiveness are the next frontier.*