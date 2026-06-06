const gameScreen = document.getElementById('game-screen');
const preGameScreen = document.getElementById('pregame-screen');
const createRoom = document.getElementById('createRoom');
const joinRoom = document.getElementById('joinRoom');
const pregameUtilites = document.getElementById('pregameUtilities');
const leaveButton = document.createElement('button');
leaveButton.id = 'leaveRoom';
leaveButton.textContent = 'Leave Room';
const socket = io();
window.socket = socket;
const startButton = document.createElement('button');
startButton.id = 'startGame';
startButton.textContent = 'Start Game';

socket.on('connected', (msg)=>{console.log(msg)});

let playerName='';
createRoom.addEventListener('click', ()=>{
    playerName=prompt("Enter your name") 
    socket.emit('createRoom', {host: playerName})}
);

leaveButton.addEventListener('click', () => {
    // Emit a leaveRoom event to the server
    console.log("Someone is leaving room");
    socket.emit('leaveRoom', { player: playerName });
});

socket.on('createRoom', (data) => {
    // Clear previous player list
    pregameUtilites.innerHTML = '';

    // Create a container div for the player list
    const playerListDiv = document.createElement('div');
    playerListDiv.id = 'player-list';

    // Add a title to the player list
    const title = document.createElement('h3');
    title.textContent = `Room Code: ${data.roomCode}`;
    playerListDiv.appendChild(title);

    // Iterate through the players and add them to the list
    for (const name of data.roomPlayers) {
        if(name=='host') continue;
        const playerDiv = document.createElement('div');
        playerDiv.textContent = `${name}`;
        playerListDiv.appendChild(playerDiv);
    }

    // Append the player list to the pregame utilities section
    pregameUtilites.appendChild(playerListDiv);
    pregameUtilites.appendChild(leaveButton);
    pregameUtilites.appendChild(startButton);
});

joinRoom.addEventListener('click', ()=>{
    let roomCode = prompt("Enter the Room code");
    playerName = prompt("Enter your name");
    socket.emit('joinRoom', {player: playerName, code: roomCode});
})

startButton.addEventListener('click', ()=>{
    socket.emit('startGame');
    console.log("start clicked");
})

// socket.on('joinRoom', (data) => {
//     // Clear previous player list
//     pregameUtilites.innerHTML = '';

//     // Create a container div for the player list
//     const playerListDiv = document.createElement('div');
//     playerListDiv.id = 'player-list';

//     // Add a title to the player list
//     const title = document.createElement('h3');
//     title.textContent = `Room Code: ${data.roomCode}`;
//     playerListDiv.appendChild(title);

//     // Iterate through the players and add them to the list
//     for (const name of data.roomPlayers) {
//         if(name=='host') continue;
//         const playerDiv = document.createElement('div');
//         playerDiv.textContent = `${name}`;
//         playerListDiv.appendChild(playerDiv);
//     }

//     // Append the player list to the pregame utilities section
//     pregameUtilites.appendChild(playerListDiv);
//     pregameUtilites.appendChild(leaveButton);
// });

socket.on('player_list_update', (data) => {
    pregameUtilites.innerHTML = '';

    // Create a container div for the player list
    const playerListDiv = document.createElement('div');
    playerListDiv.id = 'player-list';

    // Add a title to the player list
    const title = document.createElement('h3');
    title.textContent = `Room Code: ${data.roomCode}`;
    playerListDiv.appendChild(title);

    // Iterate through the players and add them to the list
    for (const name of data.players) {
        if(name=='host') continue;
        const playerDiv = document.createElement('div');
        playerDiv.textContent = name;
        playerListDiv.appendChild(playerDiv);
    }

    // Append the player list to the pregame utilities section
    pregameUtilites.appendChild(playerListDiv);
    pregameUtilites.appendChild(leaveButton);

    if(data.host===socket.id){
        pregameUtilites.appendChild(startButton);
    }
});

socket.on('disconnect', (reason) => {
    console.log(`Player disconnected: ${reason}`);
});

socket.on('redirect_to_index', ()=>{
    console.log('redirecting to index page');
    window.location.href = '/';
})