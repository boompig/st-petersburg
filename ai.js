var AI = {};
AI.probFromHand = 0.9;
AI.probBuy = 0.8;
AI.probPickUp = 0.25;

AI.makeRandomMove = function (player, game) {
	console.log("Making AI move for player " + player.name);
	var result = null;

	if (player === game.getCurrentPlayer() && Math.random() < AI.probFromHand) {
		result = AI.playCardFromHand(player, game);
	}

	if (!result && player === game.getCurrentPlayer() && Math.random() < AI.probBuy) {
		result = AI.buyRandomCard(player, game);
	}

	if (!result && player === game.getCurrentPlayer() && Math.random() < AI.probPickUp) {
		result = AI.putRandomCardInHand(player, game);
	}

	if (! result && player === game.getCurrentPlayer()) {
		console.log("Fallthrough case - AI for " + player.name + " passes");
		game.passTurn();
	}
};

AI.playCardFromHand = function (player, game) {
	console.log("AI for " + player.name + " trying to play card from hand...");
	var validCards = player.hand.filter(function (card) {
		return game.playerCanAffordCard(card, player, player.hand);
	});
	if (validCards.length === 0) {
		console.log("No cards in hand which can be played.");
		return false;
	}
	var idx = Math.floor(Math.random() * validCards.length);
	var card = validCards[idx];
	console.log("AI for " + player.name + " is playing card " + card.name + " from hand");
	return game.buyCard(card, player.hand);
};

AI.pickObservationDeck = function (player, game) {
	var decks = game.phases.filter(function (name) {
		return game.decks[name].length > 0;
	});
	var idx = Math.floor(Math.random() * decks.length);
	return decks[idx];
};

AI.pickObservationAction = function (player, game, peekCard) {
	if (game.playerCanAffordCard(card, player, null)) {
		return "Buy";
	} else if (player.getMaxHandSize() > player.hand.length) {
		return "Put in hand";
	} else {
		return "Discard";
	}
};

AI.pickUpgradeCard = function (player, game, card, collection) {
	console.log("AI for " + player.name + " trying to upgrade card into " + card.name);
	var cardCost = game.getCardCost(card, collection);

	var validCards = player.cards.filter(function (baseCard) {
		return baseCard.canUpgradeTo(card) &&
			player.money >= game.getUpgradeCost(baseCard, card, collection);
	});
	if (validCards.length === 0) {
		console.log("No card found which can be upgraded.");
		return null;
	} else {
		var idx = Math.floor(Math.random() * validCards.length);
		var baseCard = validCards[idx];
		console.log("AI for " + player.name + " trying to upgrade " + baseCard.name + " into " + card.name);
		return baseCard;
	}
};

AI.buyRandomCard = function (player, game) {
	console.log("AI for " + player.name + " trying to buy card...");
	var card;
	var cardCollection = [];

	for (var i = 0; i < game.upperBoard.length; i++) {
		card = game.upperBoard[i];
		if (game.playerCanAffordCard(card, player, game.upperBoard)) {
			cardCollection.push(card);
		}
	}

	for (var i = 0; i < game.lowerBoard.length; i++) {
		card = game.lowerBoard[i];
		if (game.playerCanAffordCard(card, player, game.lowerBoard)) {
			cardCollection.push(card);
		}
	}

	if (cardCollection.length === 0) {
		console.log("No cards to buy");
		return false;
	}

	// pick a random card
	var idx = Math.floor(Math.random() * cardCollection.length);
	var randomCard = cardCollection[idx];
	var sourceCollection;
	if (game.upperBoard.indexOf(randomCard) >= 0) {
		sourceCollection = game.upperBoard;
	} else {
		sourceCollection = game.lowerBoard;
	}

	var cost = game.getCardCost(randomCard, sourceCollection);
	console.log("AI for " + player.name + " buying card " + randomCard.name + " for " + cost + " coins");
	return game.buyCard(randomCard, sourceCollection);
};

AI.putRandomCardInHand = function (player, game) {
	console.log("AI for " + player.name + " trying to put card in hand...");
	if (player.getMaxHandSize() === player.hand.length) {
		console.log("hand is full");
		return false;
	}

	var card;
	var cardCollection = [];

	for (var i = 0; i < game.upperBoard.length; i++) {
		card = game.upperBoard[i];
		cardCollection.push(card);
	}

	for (var i = 0; i < game.lowerBoard.length; i++) {
		card = game.lowerBoard[i];
		cardCollection.push(card);
	}

	if (cardCollection.length === 0) {
		console.log("No cards to put in hand.");
		return false;
	}

	// pick a random card
	var idx = Math.floor(Math.random() * cardCollection.length);
	var randomCard = cardCollection[idx];
	console.log("Searching for source collection of card " + randomCard.name);
	var sourceCollection;
	if (game.upperBoard.indexOf(randomCard) >= 0) {
		sourceCollection = game.upperBoard;
	} else {
		sourceCollection = game.lowerBoard;
	}

	console.log("AI for " + player.name + " putting " + randomCard.name + " in hand");
	game.putCardInHand(randomCard, sourceCollection);
	return true;
};