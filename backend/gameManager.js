const {
  generateDeck,
  isValidMove,
  applyCardEffect,
  drawFromDeck
} = require('./gameLogic');

function createGame(players) {
  const deck = generateDeck();

  players.forEach(p => {
    p.cards = [];
    for (let i = 0; i < 7; i++) {
      p.cards.push(drawFromDeck(deck));
    }
  });

  const firstCard = drawFromDeck(deck);

  return {
    players,
    deck,
    discard: [firstCard],
    currentCard: firstCard,
    currentColor: firstCard.slice(-1),
    currentPlayerIndex: 0,
    direction: 1
  };
}

function playCard(game, socketId, card) {
  const player = game.players[game.currentPlayerIndex];

  if (player.id !== socketId) return;

  if (!player.cards.includes(card)) return;

  if (!isValidMove(card, game)) return;

  player.cards.splice(player.cards.indexOf(card), 1);

  game.currentCard = card;
  game.currentColor = card.slice(-1);
  game.discard.push(card);

  applyCardEffect(game, card);
}

function drawCard(game, socketId) {
  const player = game.players[game.currentPlayerIndex];
  if (player.id !== socketId) return;

  player.cards.push(drawFromDeck(game.deck));
}

function passTurn(game, socketId) {
  const player = game.players[game.currentPlayerIndex];
  if (player.id !== socketId) return;

  nextTurn(game);
}

function nextTurn(game) {
  game.currentPlayerIndex =
    (game.currentPlayerIndex + game.direction + game.players.length) %
    game.players.length;
}

module.exports = {
  createGame,
  playCard,
  drawCard,
  passTurn
};