// const socket = window.socket;

socket.on('gameStarted', (data) => {
    preGameScreen.style.display = 'none';
    gameScreen.style.display = 'flex';
    suitch=data.suitch;
    console.log("displayCards function is being called");

    displayCards(
        data.yourCards,
        data.players,
        data.yourIndex,
        data.turn,
        data.lastPlayedCard,
        data.suitch
    );

});

function displayCards(yourCards, playersInfo, yourIndex, turn, lastPlayedCard, suitch) {

    const playerContainers = [
        document.querySelector('.player1'),
        document.querySelector('.player2'),
        document.querySelector('.player3'),
        document.querySelector('.player4')
    ];

    playersInfo.forEach((player, index) => {

        const container = playerContainers[index];
        container.innerHTML = '';

        // Player name
        const playername = document.createElement('h2');
        playername.textContent = player.name;
        playername.style.textAlign = 'center';
        container.appendChild(playername);

        if (index === yourIndex) {
            // 🔥 SHOW REAL CARDS (ONLY YOURS)

            yourCards.forEach(card => {
                const img = document.createElement('img');
                img.src = `CardsFront/${card}.png`;
                img.style.width = '20%';

                img.addEventListener('click', () => {
                    console.log(`card chala: ${card} index: ${index} turn: ${turn}`);
                    onCardClick(card, index, turn);
                });

                container.appendChild(img);
            });

        } else {
            // 🔥 SHOW BACKSIDE FOR OTHERS

            for (let i = 0; i < player.count; i++) {
                const img = document.createElement('img');
                img.src = `card-back.png`;
                img.style.width = '20%';
                container.appendChild(img);
            }
        }
    });

    // Center deck
    const cardSourceContainer = document.querySelector('.center-container .center-card:nth-child(2)');
    cardSourceContainer.innerHTML = '';

    const img = document.createElement('img');
    img.src = `card-back.png`;
    img.style.width = '40%';

    img.addEventListener('click', () => {
        console.log("Naya card nikala");
        if(suitch) onDrawCardClick();
    });

    cardSourceContainer.appendChild(img);

    // Last played card
    const cardsPlayedDiv = document.querySelector('.cards-played');
    cardsPlayedDiv.innerHTML = `
        <img src="CardsFront/${lastPlayedCard}.png" 
        style="width: 40%; height: 80%;">
    `;

    console.log("displayed the cards");
    
}


function onCardClick(card, index){
    console.log('card par click hua');
    socket.emit('playedCard', {card:card, index:index});
}

socket.on('game_state', (data) => {

    let passButton = document.getElementById('passButton');
    if(passButton) passButton.remove();
    displayCards(
        data.yourCards,
        data.players,
        data.yourIndex,
        data.currentTurn,
        data.currentCard,
        data.suitch
    );
});

function onDrawCardClick(){

    socket.emit('drawCard');
}

socket.on('drawn_state', (data) => {
    displayCards(
        data.yourCards,
        data.players,
        data.yourIndex,
        data.currentTurn,
        data.currentCard,
        data.suitch
    );

    const gameBox = document.getElementById('game-screen');
    const pass = document.createElement('button');
    pass.id = 'passButton';
    pass.textContent = 'Pass';
    
    gameBox.appendChild(pass);

    pass.addEventListener('click', ()=>{
        socket.emit('passTurn');
        pass.remove();
    });
});

socket.on('chooseColor', () => {
    const colors = ['R', 'G', 'B', 'Y'];
    const colorOptionsDiv = document.createElement('div');
    colorOptionsDiv.id = 'colorOptions';
    colorOptionsDiv.style.position = 'absolute';
    colorOptionsDiv.style.top = '50%';
    colorOptionsDiv.style.left = '50%';
    colorOptionsDiv.style.transform = 'translate(-50%, -50%)';
    colorOptionsDiv.style.backgroundColor = 'white';
    colorOptionsDiv.style.padding = '20px';
    colorOptionsDiv.style.borderRadius = '10px';
    colorOptionsDiv.style.display = 'flex';
    colorOptionsDiv.style.gap = '10px';

    colors.forEach(color => {
        const colorBtn = document.createElement('button');
        colorBtn.textContent = color;
        colorBtn.style.backgroundColor = color;
        colorBtn.style.border = 'none';
        colorBtn.style.padding = '10px';
        colorBtn.style.margin = '5px';
        colorBtn.style.borderRadius = '5px';
        colorBtn.style.cursor = 'pointer';

        colorBtn.addEventListener('click', () => {
            socket.emit('colorChosen', color);
            colorOptionsDiv.remove();
        });

        colorOptionsDiv.appendChild(colorBtn);
    });

    document.body.appendChild(colorOptionsDiv);
});