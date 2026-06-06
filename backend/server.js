const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = 3000;

// Create an HTTP server and attach socket io
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Default route to serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

let rooms = {};

function roomCodeGenerator(){
    let randomCode;
    while(!randomCode || randomCode in rooms){
        randomCode = String(Math.floor(Math.random()*100));
    }
    return randomCode;
}

io.on('connection', client => {
    client.emit('connected', { data: 'New Player Connected'});

    client.on('createRoom', (data) => {
        let roomCode = roomCodeGenerator();
        client.join(roomCode);

        // Update the rooms object
        if (!rooms[roomCode]) {
            rooms[roomCode] = {};
        }
        rooms[roomCode][data.host] = client.id;
        rooms[roomCode]['host'] = client.id; 

        // Broadcast to the room
        // io.to(roomCode).emit('player_list_update', client.id);

        // Emit the room details to the client
        client.emit('createRoom', { roomPlayers: Object.keys(rooms[roomCode]), roomCode: roomCode, host: rooms[roomCode]['host'] });
    });

    client.on('joinRoom', (data)=>{
        if(!rooms[data.code]){
            return;
        }

        client.join(data.code);
        rooms[data.code][data.player] = client.id;
        io.to(data.code).emit('player_list_update', { players: Object.keys(rooms[data.code]), roomCode: data.code, host: rooms[data.code]['host'] });
    })

    client.on('leaveRoom', (data) => {
        for (const roomCode in rooms) {
            if (rooms[roomCode][data.player] === client.id) {
                client.emit('redirect_to_index');
                delete rooms[roomCode][data.player];
                client.leave(roomCode);
                io.to(roomCode).emit('player_list_update', { players: Object.keys(rooms[roomCode]), roomCode: roomCode, host: rooms[roomCode]['host'] });
                break;
            }
        }
    });

    client.on('disconnect', () => {
    console.log("User disconnected:", client.id);

    for (const roomCode in rooms) {
        for (const player in rooms[roomCode]) {

            if (rooms[roomCode][player] === client.id) {

                delete rooms[roomCode][player];

                // 🔥 notify remaining players
                io.to(roomCode).emit('player_list_update', {
                    players: Object.keys(rooms[roomCode]),
                    roomCode: roomCode,
                    host: rooms[roomCode]['host']
                });

                // 🔥 optional: delete empty room
                const remainingPlayers = Object.keys(rooms[roomCode]).filter(p => p !== 'host');

                if (remainingPlayers.length === 0) {
                    delete rooms[roomCode];
                    console.log("Room deleted:", roomCode);
                }

                break;
            }
        }
    }
    });

    client.on('startGame', () => {

        const roomsOfClient = Array.from(client.rooms);
        const roomID = roomsOfClient.find(room => room !== client.id);

        if (!roomID) {
            console.log("Room not found");
            return;
        }

        // Get player names (excluding 'host')
        const playerNames = Object.keys(rooms[roomID]).filter(name => name !== 'host');

        // Distribute cards
        let distributed = distributeCards([...cards], playerNames.length);

        let playersCards = {}; // { socketId: [cards] }
        let deck = cards;
        let currentPlayerIndex = 0;
        let direction = 1; //clockwise
        let currentColor = null;
        let currentCard = null;
        let discardPile = [];
        let players = [];
        let suitch=true;

        playerNames.forEach((name, index)=>{
            let id = rooms[roomID][name];
            let cards = distributed[index];
            players.push({id, name, cards: cards});
        });
        

        games[roomID] = {players, deck, discardPile, currentPlayerIndex, direction, currentColor, currentCard, suitch};

        playerNames.forEach((name, index) => {
            const socketId = rooms[roomID][name];
            playersCards[socketId] = distributed[index];
        });

        let lastPlayedCard = drawInitialCard(games[roomID]);
        games[roomID].currentCard = lastPlayedCard;
        games[roomID].currentColor = lastPlayedCard[lastPlayedCard.length-1];
        games[roomID].discardPile.push(lastPlayedCard);

        console.log("Emitting to:", roomID);

        // SEND DATA INDIVIDUALLY (IMPORTANT)
        playerNames.forEach((name, index) => {
            const socketId = rooms[roomID][name];

            io.to(socketId).emit('gameStarted', {
                yourCards: playersCards[socketId],
                players: playerNames.map(n => ({
                    name: n,
                    count: playersCards[rooms[roomID][n]].length
                })),
                yourIndex: index,
                lastPlayedCard: lastPlayedCard,
                turn:0,
                suitch: games[roomID].suitch
            });
        });


    });

    client.on('playedCard', (data) => {
        console.log('Played card server me aaya');
        let card = data.card;
        let index = data.index;

        const roomsOfClient = Array.from(client.rooms);
        const roomID = roomsOfClient.find(room => room !== client.id);
        const game = games[roomID];

        const player = game.players[game.currentPlayerIndex];

        // ❌ Not your turn
        if (player.id !== client.id) return;

        // ❌ Card not in hand
        if (!player.cards.includes(card)) return;

        // ❌ validity check
        console.log('validity check kar rahe hain');
        console.log('card hai: ', card, 'aur previous card hai: ', game.currentCard, 'aur prvious color hai: ', game.currentColor);
        let {valid, type} = validityAndType(card, game);
        if (!valid) return;
        console.log('saari chizein valid hain');
        game.suitch = true;

        if(type === 'colorChange'){
            console.log('color change');
            io.to(client.id).emit('chooseColor');
            client.once('colorChosen', (color) => {
                console.log('Ye effect me aa raha hai: ', color);
                game.currentColor = color;
                game.currentCard = card;
                game.discardPile.push(card);
                player.cards.splice(player.cards.indexOf(card), 1);
                game.currentPlayerIndex=(game.currentPlayerIndex+game.direction+game.players.length)%game.players.length;
                sendGameState(roomID);
            });
        }

        else if(type === 'wild'){
            console.log('om namah shivay');
            client.emit('chooseColor');
            client.once('colorChosen', (color) => {
                game.currentColor = color;
                game.currentCard = card;
                game.discardPile.push(card);
                player.cards.splice(player.cards.indexOf(card), 1);
                const nextPlayerIndex = (game.currentPlayerIndex+game.direction+game.players.length)%game.players.length;
                const nextPlayer = game.players[nextPlayerIndex];
                // Draw four cards for the next player
                for (let i = 0; i < 4; i++) {
                    nextPlayer.cards.push(drawRandomCard(game));
                }
                game.currentPlayerIndex=(game.currentPlayerIndex+game.direction*2+game.players.length)%game.players.length;
                sendGameState(roomID);
            });
        }

        else if(type === 'skip'){
            game.currentCard = card;
            game.currentColor = card[card.length-1];
            game.discardPile.push(card);
            player.cards.splice(player.cards.indexOf(card), 1);
            game.currentPlayerIndex=(game.currentPlayerIndex+(game.direction*2)+game.players.length)%game.players.length;
            sendGameState(roomID);
        }

        else if(type === 'reverse'){
            game.currentCard = card;
            game.currentColor = card[card.length-1];
            game.discardPile.push(card);
            player.cards.splice(player.cards.indexOf(card), 1);
            game.direction *= -1;
            game.currentPlayerIndex=(game.currentPlayerIndex+game.direction+game.players.length)%game.players.length;
            sendGameState(roomID);
        }

        else if(type === 'drawTwo'){
            game.currentCard = card;
            game.currentColor = card[card.length-1];
            game.discardPile.push(card);
            player.cards.splice(player.cards.indexOf(card), 1);
            const nextPlayerIndex = (game.currentPlayerIndex+game.direction+game.players.length)%game.players.length;
            const nextPlayer = game.players[nextPlayerIndex];
            // Draw two cards for the next player
            for (let i = 0; i < 2; i++) {
                nextPlayer.cards.push(drawRandomCard(game));
            }
            game.currentPlayerIndex=(game.currentPlayerIndex+(game.direction*2)+game.players.length)%game.players.length;
            sendGameState(roomID);
        }

        else{

            game.currentCard = card;
            game.currentColor = card[card.length-1];
            game.discardPile.push(card);
            player.cards.splice(player.cards.indexOf(card), 1);
            game.currentPlayerIndex=(game.currentPlayerIndex+game.direction+game.players.length)%game.players.length;
            sendGameState(roomID);
        }


    });

    client.on('drawCard', () => {
        const roomsOfClient = Array.from(client.rooms);
        const roomID = roomsOfClient.find(room => room !== client.id);
        const game = games[roomID];
        const player = game.players[game.currentPlayerIndex];

        // ❌ Not your turn
        if (player.id !== client.id) return;

        const drawnCard = drawRandomCard(game);
        player.cards.push(drawnCard);
        game.suitch = false;
        senddrawnState(roomID, client.id);
    });

    client.on('passTurn', () => {
        const roomsOfClient = Array.from(client.rooms);
        const roomID = roomsOfClient.find(room => room !== client.id);
        const game = games[roomID];

        game.currentPlayerIndex=(game.currentPlayerIndex+game.direction+game.players.length)%game.players.length;
        game.suitch = true;
        sendGameState(roomID);

    });

});


let games = {
  /* 
  roomCode: {
    players: [
      { id, name, cards: [] }
    ],
    deck: [],
    discardPile: [],
    currentPlayerIndex: 0,
    direction: 1, // 1 = clockwise, -1 = reverse
    currentColor: null,
    currentCard: null,
    suitch: true
  }
  */
};










// gameplay part

// Array to hold all card names
const cards = [];

// Define card properties
const colors = ["R", "Y", "G", "B"];
const numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const actionCards = ["skip", "_", "D2"];
const wildCards = ["W", "D4W"];

// Generate number cards
colors.forEach(color => {
    numbers.forEach((number, index) => {
        cards.push(`${number}${color}`); // Add one card for each number
        if (index !== 0) { // Add a second card for numbers 1-9
            cards.push(`${number}${color}`);
        }
    });

    // Generate action cards
    actionCards.forEach(action => {
        cards.push(`${action}${color}`);
        cards.push(`${action}${color}`); // Add two of each action card
    });
});

// Add wild cards
wildCards.forEach(wild => {
    for (let i = 0; i < 4; i++) {
        cards.push(wild);
    }
});

// Function to distribute cards to players
function distributeCards(cards, numPlayers) {
    const players = Array.from({ length: numPlayers }, () => []);

    for (let i = 0; i < numPlayers; i++) {
        for (let j = 0; j < 7; j++) {
            const randomIndex = Math.floor(Math.random() * cards.length);
            players[i].push(cards[randomIndex]);
            cards.splice(randomIndex, 1); // Remove the card from the deck
        }
    }

    return players;
}


function drawInitialCard(game) {
    if (game.deck.length === 0) {
        console.log('No more cards to draw.');
        return;
    }
    let randomIndex=Math.floor(Math.random() * game.deck.length);
    // Get a random index from the cards array
    while(game.deck[randomIndex][0]==='_' || game.deck[randomIndex][0]==='D' || game.deck[randomIndex][0]==='W' || game.deck[randomIndex][0]==='s'){
        randomIndex = Math.floor(Math.random() * game.deck.length);
    }
    console.log(`Random index: ${randomIndex}, Card at index: ${game.deck[randomIndex]}`);
    // Remove the card from the array and store it in lastPlayedCard
    let initialCard = game.deck.splice(randomIndex, 1)[0];
    console.log(`Card drawn: ${initialCard}`);

    return initialCard;

}


function drawRandomCard(game) {

    for(let i=0; i<game.discardPile.length-1; i++){
        game.deck.push(game.discardPile[i]);
    }

    if (game.deck.length === 0) {
        console.log('No more cards to draw.');
        return;
    }
    let randomIndex=Math.floor(Math.random() * game.deck.length);
    
    console.log(`Random index: ${randomIndex}, Card at index: ${game.deck[randomIndex]}`);
    // Remove the card from the array and store it in lastPlayedCard
    let drawnCard = game.deck.splice(randomIndex, 1)[0];
    console.log(`Card drawn: ${drawnCard}`);

    return drawnCard;
}


function validityAndType(card, game) {
    const currentCardColor = card[card.length-1];
    const lastCardColor = game.currentColor;
    const lastCardNumber = game.currentCard[0];

    if (card[0] === "W" && currentCardColor === "W") return {valid: true, type: 'colorChange'};

    if (card[0] === 'D' && currentCardColor === "W") return {valid: true, type: 'wild'};

    if ((card[0] === 's' && currentCardColor === lastCardColor) || (card[0] === 's' && lastCardNumber === 's')) return {valid: true, type: 'skip'};
    
    if ((card[0] === '_' && currentCardColor === lastCardColor) || (card[0] === '_' && lastCardNumber === '_')) return {valid: true, type: 'reverse'};

    if ((card[0] === 'D' && currentCardColor === lastCardColor) || (card[0] === 'D' && lastCardNumber === 'D')) return {valid: true, type: 'drawTwo'};

    if (card[0] === lastCardNumber || currentCardColor === lastCardColor) return {valid: true, type: 'numberCard'};

    else return {valid: false, type: 'none'};
}

function advanceTurn(game, type){
    if(type === 'wild' || type==='skip' || type === 'drawTwo'){
        game.currentPlayerIndex=(game.currentPlayerIndex+2)%game.players.length;
        return;
    }
    if(type === 'reverse'){
        game.direction = -1;
        game.currentPlayerIndex=(game.currentPlayerIndex-1+game.players.length)%game.players.length;
        return;
    }

    game.currentPlayerIndex=(game.currentPlayerIndex+game.direction+game.players.length)%game.players.length;

}

function sendGameState(roomID){
    const game = games[roomID];

    game.players.forEach((p, index) => {
        io.to(p.id).emit('game_state', {
            yourCards: p.cards,
            players: game.players.map(pl => ({
                name: pl.name,
                count: pl.cards.length
            })),
            yourIndex: index,
            currentCard: game.currentCard,
            currentColor: game.currentColor,
            currentTurn: game.currentPlayerIndex,
            suitch: game.suitch
        });
    });
}

function senddrawnState(roomID, socketId){
    const game = games[roomID];

    game.players.forEach((p, index) => {
        if(p.id === socketId){
            io.to(p.id).emit('drawn_state', {
                yourCards: p.cards,
                players: game.players.map(pl => ({
                    name: pl.name,
                    count: pl.cards.length
                })),
                yourIndex: index,
                currentCard: game.currentCard,
                currentColor: game.currentColor,
                currentTurn: game.currentPlayerIndex,
                suitch: game.suitch
            });
        }
        else{
            io.to(p.id).emit('game_state', {
                yourCards: p.cards,
                players: game.players.map(pl => ({
                    name: pl.name,
                    count: pl.cards.length
                })),
                yourIndex: index,
                currentCard: game.currentCard,
                currentColor: game.currentColor,
                currentTurn: game.currentPlayerIndex,
                suitch: game.suitch
            });
        }
    });
}

