// create Angular app
var StPeter = angular.module("StPeter", ["ng-context-menu", "ui.bootstrap"]);

// create Angular controller
StPeter.controller("PeterCtrl", function ($scope, $modal) {
    "use strict";

    /****** STATIC DATA *******/
    this.phases = [Card.types.WORKER, Card.types.BUILDING, Card.types.ARISTOCRAT, Card.types.UPGRADE];
    this.playerNames = [
        "Sergei",
        "Ross",
        "Daniel",
        "Will"
    ];
    this.cardMap = {};
    this.cardMap[Card.types.WORKER] = {
        "LUMBERJACK": 6,
        "GOLD_MINER": 6,
        "SHEPHERD": 6,
        "FUR_TRAPPER": 6,
        "SHIP_BUILDER": 6,
        "CZAR_AND_CARPENTER": 1,
    };
    this.cardMap[Card.types.BUILDING] = {
        "MARKET": 5,
        "CUSTOMS_HOUSE": 5,
        "FIREHOUSE": 3,
        "HOSPITAL": 3,
        "LIBRARY": 3,
        "THEATRE": 2,
        "ACADEMY": 1,
        "PUB": 2,
        "WAREHOUSE": 1,
        "POTJOMKINS_VILLAGE": 1,
        "OBSERVATORY": 2
    };
    this.cardMap[Card.types.ARISTOCRAT] = {
        "AUTHOR": 6,
        "ADMINISTRATOR": 5,
        "WAREHOUSE_MANAGER": 5,
        "SECRETARY": 4,
        "CONTROLLER": 3,
        "JUDGE": 2,
        "MISTRESS_OF_CEREMONIES": 2,
    };
    this.cardMap[Card.types.UPGRADE] = {
        "WEAVING_MILL": 2,
        "FUR_TRADER": 2,
        "WHARF": 2,
        "DEFAULT": 1
    };
    this.aristocratScoringChart = {
        0: 0,
        1: 1,
        2: 3,
        3: 6,
        4: 10,
        5: 15,
        6: 21,
        7: 28,
        8: 36,
        9: 45,
        10: 55
    };

    /******* GAME STATE DATA *****/
    this.players = [];
    this.decks = {};
    this.upperBoard = [];
    this.lowerBoard = [];
    this.phase = Card.types.WORKER;
    this.turn = 0;
    this.lastRound = false;
    this.consecutivePasses = 0;

    // TODO query this somehow
    this.humanPlayerName = "Daniel";

    /****** UI FUNCTIONS ********/

    /**
     * Open the upgrade modal, and pick the card which to upgrade into the selected card
     */
    $scope.openUpgradeModal = function (card, collection, game) {
        var player = game.getCurrentPlayer();
        var upgradableCards = game.getUpgradableCards(card, player);

        // compute how much it would cost to upgrade each card
        var costMap = {};
        for (var i = 0; i < upgradableCards.length; i++) {
            var baseCard = upgradableCards[i];
            var upgradeCost = game.getUpgradeCost(baseCard, card, collection);
            costMap[baseCard.name] = upgradeCost;
        }

        var modalInstance = $modal.open({
            templateUrl: "upgradeModal.html",
            controller: "ModalInstanceCtrl",
            resolve: {
                baseCards: function () {
                    return upgradableCards;
                },
                upgradeCard: function() {
                    return card;
                },
                costMap: function () {
                    return costMap;
                }
            }
        });

        modalInstance.result.then(function (selectedBaseCard) {
            game.upgradeCard(selectedBaseCard, card, collection);
        }, function () {
            console.log("Did not select card for upgrade");
        });
    };

    /**
     * Open the observatory modal, and pick the deck that you want to peek at
     */
    $scope.openObservatoryModal = function (game, card) {
        var validPhases = [];
        var name;
        for (var i = 0; i < game.phases.length; i++) {
            if (game.decks[game.phases[i]].length > 0) {
                name = game.getPhaseName( game.phases[i] );
                validPhases.push( name );
            }
        }

        var modalInstance = $modal.open({
            templateUrl: "observatoryModal.html",
            controller: "ObservatoryModalInstanceCtrl",
            resolve: {
                phases: function () {
                    return validPhases;
                }
            }
        });
        modalInstance.result.then(function (selectedDeck) {
            console.log("Peeking at deck of type " + selectedDeck);
            if (card) {
                // set the card to used here
                card.played = true;
            }
            var selection = Card.types[selectedDeck.toUpperCase()];
            $scope.openPeekingModal(game, selection);
        }, function () {
            console.log("Did not select a deck, so quitting");
        });
    };

    /**
     * The second part of the observatory flow.
     * Assume that the chosen deck is non-empty.
     */
    $scope.openPeekingModal = function (game, deckType) {
        var player = game.getCurrentPlayer();
        var peekDeck = game.decks[deckType];
        // card removed here, no need to remove later
        var peekCard = peekDeck.pop();
        var cardCost = game.getCardCost(peekCard, null);

        var options = ["Buy", "Put in hand", "Discard"];

        // make sure player can afford card, if the card is not an upgrade
        if (peekCard.type !== Card.types.UPGRADE && cardCost > player.money) {
            options.splice(options.indexOf("Buy"), 1);
        }
        // make sure player has space for the card in the hand
        if (player.getMaxHandSize() === player.hand.length) {
            options.splice(options.indexOf("Put in hand"), 1);
        }

        var modalInstance = $modal.open({
            templateUrl: "peekingModal.html",
            controller: "PeekingModalInstanceCtrl",
            resolve: {
                peekCard: function () {
                    return peekCard;
                },
                cardCost: function () {
                    return cardCost;
                },
                options: function () {
                    return options;
                }
            }
        });
        modalInstance.result.then(function (selectedOption) {
            if (selectedOption === "Buy") {
                game.buyCard(peekCard, null);
            } else if (selectedOption === "Put in hand") {
                game.putCardInHand(peekCard, null);
            } else {
                // discard, do nothing
            }
        }, function () {
            console.log("Did not select an option, so discarding the card");
        });
    };

    /******* GAME FUNCTIONS ********/

    this.getUpgradeCost = function (baseCard, upgradeCard, collection) {
        var upgradeCardCost = this.getCardCost(upgradeCard, collection);
        return Math.max(1, upgradeCardCost - baseCard.upgradeCost);
    };

    /**
     * Return list of cards which can be upgraded (by given player) from given card
     */
    this.getUpgradableCards = function (card, player) {
        return player.cards.filter(function (baseCard) {
            return baseCard.canUpgradeTo(card);
        });
    };

    /**
     * Return the cost of the card after applying all the rules
     * @param  {Card} card          Card object
     * @param  {Array} collection   Collection it came from
     * @return {Number} Final cost of the card
     */
    this.getCardCost = function (card, collection) {
        var player = this.getCurrentPlayer();
        var cost = card.cost;
        // console.log("Calculating cost for card " + card.name);
        // console.log("Base cost is " + cost);
        if (collection === this.lowerBoard) {
            // console.log("Reduce cost by 1 as card is from lower board");
            cost--;
        }
        var similarCards = player.cards.filter(function (otherCard) {
            return otherCard.name === card.name;
        });
        // console.log("Reduce cost by " + similarCards.length + " as player has that many instances of the card already");
        cost -= similarCards.length;

        if (player.hasDiscountForCard(card)) {
            cost--;
            // console.log("Reduce cost by 1, as player has discount card relevant to this card");
        }

        return Math.max(cost, 1);
    };

    /**
     * Upgrade given baseCard to upgradeCard. upgradeCard came from given collection.
     * collection can be one of:
     *     - upperBoard
     *     - lowerBoard
     *     - player hand
     * (passed by reference)
     */
    this.upgradeCard = function (baseCard, upgradeCard, collection) {
        if (! baseCard.canUpgradeTo(upgradeCard)) {
            return false;
        }
        var player = this.getCurrentPlayer();
        var cost = this.getUpgradeCost(baseCard, upgradeCard, collection);
        var idx;

        console.log("Trying to upgrade " + baseCard.name + " into " + upgradeCard.name + " for " + cost + " coins");

        if (player.money < cost) {
            console.log("Player " + player.name + " cannot afford!");
            return false;
        }

        // pay for the card
        player.money -= cost;
        if (player.money < 0) {
            console.error("ERROR: Player money for " + player.name + " has gone negative after upgrading " + baseCard.name + " to " + upgradeCard.name + " for " + cost + "coins");
            alert("ERROR");
        }

        // remove card from collection
        if (collection) {
            idx = collection.indexOf(upgradeCard);
            collection.splice(idx, 1);
        }
        // replace baseCard with upgradeCard
        idx = player.cards.indexOf(baseCard);
        player.cards.splice(idx, 1, upgradeCard);

        this.sortPlayerCards(player);
        // reset consecutive passes
        this.consecutivePasses = 0;

        // successful buy means next turn
        this.nextTurn();
        return true;
    };

    /**
     * Sort the player's cards according to type, after purchase or upgrade
     * Actually use upgradeType, it's more correct
     * 
     * This is not a stable sort.
     */
    this.sortPlayerCards = function (player) {
        // worker -> building -> aristocrat
        player.cards.sort(function (a, b) {
            if (b.upgradeType > a.upgradeType) {
                return 1;
            } else if (b.upgradeType === a.upgradeType) {
                return b.cost - a.cost;
            } else {
                return -1;
            }
        });
    };

    /**
     * Create the deck made of the given type of card.
     * Shuffle the deck.
     */
    this.createDeckOfType = function (type) {
        var numCards, card, cardName;
        var cardMap  = this.cardMap[type];
        this.decks[type] = [];

        var cards = allCards.filter(function (card) {
            return card.type === type;
        });
        for (var c = 0; c < cards.length; c++) {
            cardName = cards[c].name.replace("'", "").replace(/ /g, "_").toUpperCase();
            numCards = cardMap[cardName] || cardMap["DEFAULT"] || 0;
            if (numCards === 0) {
                console.error("Error: missed " + cardName);
            }
            for (var i = 0; i < numCards; i++) {
                card = _.clone(cards[c]);
                this.decks[type].push(card);
            }
        }
        this.decks[type] = _.shuffle(this.decks[type]);
    };

    this.init = function () {
        // assign tokens to players
        var tokens = [Card.types.ARISTOCRAT, Card.types.BUILDING, Card.types.WORKER, Card.types.UPGRADE];
        this.players = [];
        while (tokens.length > 0) {
            var idx = Math.floor(Math.random() * tokens.length);
            var token = tokens[idx];
            tokens.splice(idx, 1);
            var name = this.playerNames.pop();
            this.players.push(new Player(name, token, name === this.humanPlayerName));
        }

        // create each deck
        this.decks = {};
        this.createDeckOfType(Card.types.WORKER);
        this.createDeckOfType(Card.types.BUILDING);
        this.createDeckOfType(Card.types.ARISTOCRAT);
        this.createDeckOfType(Card.types.UPGRADE);

        // reset turn and phase
        this.phase = Card.types.WORKER;
        this.preparePhase();
    };

    /**
     * 1. Set turn to the player with the starter token for this phase
     * 2. Reset consecutive passes
     * 3. Deal cards to top row (assume past cards moved to bottom row)
     */
    this.preparePhase = function () {
        for (var t = 0; t < this.players.length; t++) {
            if (this.players[t].token === this.phase) {
                this.turn = t;
                break;
            }
        }
        this.consecutivePasses = 0;

        // deal cards from current phase's deck, assuming previous phase's cards moved to lower board
        this.dealCards();
    };

    this.isPlayerTurn = function (player) {
        var i = this.players.indexOf(player);
        return i === this.turn;
    };

    this.nextTurn = function () {
        this.turn = (this.turn + 1) % this.players.length;
    };

    this.passTurn = function () {
        this.consecutivePasses++;
        this.nextTurn();

        if (this.consecutivePasses === this.players.length) {
            this.evaluatePhase();
        }
    };

    /**
     * 1. Evaluate money and points based on cards in current phase (if not UPGRADE)
     * 2. Move cards in upper layer to lower layer, and discard lower layer
     * 3. If this is the end of the round, call nextRound(), if not, call nextPhase()
     */
    this.evaluatePhase = function () {
        if (this.phase !== Card.types.UPGRADE) {
            var player, card;

            for (var p = 0; p < this.players.length; p++) {
                player = this.players[p];

                var game = this;
                var relevantCards = player.cards.filter(function (card) {
                    return card.type === game.phase ||
                        (card.type === Card.types.UPGRADE && card.upgradeType === game.phase);
                });

                for (var c = 0; c < relevantCards.length; c++) {
                    card = relevantCards[c];
                    if (card.isPlayable && card.played) {
                        // reset whether card has been played this phase
                        card.played = false;
                        continue;
                    }
                    player.money += card.coinYield;
                    player.points += card.pointYield;

                    if (card.bonusYieldClass !== null) {
                        var bonusCards = player.cards.filter(function (bonusCard) {
                            return bonusCard.type === card.bonusYieldClass ||
                                (bonusCard.type === Card.types.UPGRADE && bonusCard.upgradeType === card.bonusYieldClass);
                        });
                        console.log("Got " + bonusCards.length + " bonus money from card " + card.name);
                        player.money += bonusCards.length;
                    }
                }
            }
        }

        this.lowerBoard = [];
        while (this.upperBoard.length > 0) {
            this.lowerBoard.push(this.upperBoard.pop());
        }
        if (this.phase === Card.types.UPGRADE) {
            this.nextRound();
        } else {
            this.nextPhase();
        }
    };

    /**
     * Evaluate game end conditions in this order:
     * 1. Aristocrat scoring
     * 2. Money scoring
     * 3. Hand penalties
     *
     * Assign scores to the players
     */
    this.evalGameEnd = function () {
        console.log("**** Doing game-end calculations... ****");
        for (var p = 0; p < this.players.length; p++) {
            var player = this.players[p];
            console.log("Player " + player.name + " ended the game with " + player.points + " points");
            var aristocrats = player.cards.filter(function (card) {
                return card.type === Card.types.ARISTOCRAT || (card.type === Card.types.UPGRADE && card.upgradeType === Card.types.ARISTOCRAT);
            });
            // sort by name
            aristocrats.sort(function(a, b) {
                if (a > b) {
                    return 1;
                } else {
                    return -1;
                }
            });
            var numAristocrats = 0;
            for (var a = 0; a < aristocrats.length; a++) {
                if (a === 0 || aristocrats[a].name !== aristocrats[a - 1].name) {
                    numAristocrats++;
                }
            }
            var aristocratPoints = this.aristocratScoringChart[Math.min(numAristocrats, 10)];
            console.log("Player " + player.name + " earned " + aristocratPoints + " points from " + numAristocrats + " aristocrats");
            player.points += aristocratPoints;

            // money scoring
            var moneyPoints = Math.floor(player.money / 10);
            console.log("Player " + player.name + " earned " + moneyPoints + " points from " + player.money + " coins");
            player.points += moneyPoints;

            // hand penalties
            var handPenalty = player.hand.length * 5;
            console.log("Player " + player.name + " was penalized " + handPenalty + " points from " + player.hand.length + " cards in hand");
            player.points -= handPenalty;

            console.log("Final score for player " + player.name + " is " + player.points + " points");
        }
    };

    this.rotateTokens = function () {
        var oldToken, passedToken = null;
        for (var p = 0; p < this.players.length; p++) {
            oldToken = this.players[p].token;
            if (passedToken) {
                this.players[p].token = passedToken;
                console.log("Token for player " + this.players[p].name + " is now " + passedToken);
            }
            passedToken = oldToken;
        }
        console.log("Token for player " + this.players[0].name + " is now " + passedToken);
        this.players[0].token = passedToken;
    };

    /**
     * 1. If this is the last round, print game over and exit
     * 2. Shift tokens between players
     * 3. Call nextPhase
     */
    this.nextRound = function () {
        if (this.lastRound) {
            this.evalGameEnd();

            var winningPlayer = null;
            var winningPoints = -1;
            for (var i = 0; i < this.players.length; i++) {
                if (this.players[i].points > winningPoints) {
                    winningPlayer = this.players[i];
                    winningPoints = this.players[i].points;
                }
            }

            console.log("Game Over! The winner is " + winningPlayer.name + " with " + winningPoints + " points");
            // TODO display this in a nicer way
            alert("Game Over! The winner is " + winningPlayer.name + " with " + winningPoints + " points");
        } else {
            this.rotateTokens();
            this.nextPhase();
        }
    };

    this.nextPhase = function () {
        var i = this.phases.indexOf(this.phase);
        this.phase = this.phases[(i + 1) % this.phases.length];
        console.log("Phase is now " + this.getPhaseName());
        this.preparePhase();
    };

    this.putCardInHand = function (card, collection) {
        var player = this.getCurrentPlayer();

        if (player.hand.length === player.getMaxHandSize()) {
            return false;
        }

        // remove from collection
        if (collection) {
            var idx = collection.indexOf(card);
            collection.splice(idx, 1);
        }
        // put in hand
        player.hand.push(card);

        // reset consecutive passes and push to next turn
        this.consecutivePasses = 0;
        this.nextTurn();
    };

    /**
     * Play the given card (i.e. use its special ability)
     * 
     * @param  {[type]} card       [description]
     * @param  {[type]} player     [description]
     * @param  {[type]} collection [description]
     * @return {[type]}            [description]
     */
    this.playCard = function (card, player, collection) {
        var currentPlayer = this.players[this.turn];
        if (currentPlayer !== player || ! card.isPlayable) {
            return false;
        }

        if (card.name === "Observatory") {
            // prereq # 1 - collection must be player.cards
            // prereq # 2 - card must not have been played this phase
            // prereq # 3 - it must be the BUILDING phase
            if (collection !== player.cards || card.played || this.phase !== Card.types.BUILDING) {
                return false;
            }

            // all conditions are fulfilled
            if (player.isHuman) {
                $scope.openObservatoryModal(this, card);
            } else {
                var pile = AI.pickObservationDeck(player, this);
                if (pile && this.decks[pile] && this.decks[pile].length > 0) {
                    var peekCard = this.decks[pile].pop();
                    var result = AI.pickObservationAction(player, this, peekCard);

                    card.played = true;

                    if (result === "Buy") {
                        this.buyCard(peekCard, null);
                    } else if (result === "Put in hand") {
                        this.putCardInHand(peekCard, null);
                    } else {
                        // do nothing, card garbage collected
                    }
                }
            }
        } else {
            console.error("Unknown card being played: " + card.name);
        }
    };

    /**
     * Return true iff the player can afford the given card
     * For upgrade cards, return true iff player has at least 1 card which can be upgraded
     */
    this.playerCanAffordCard = function (card, player, collection) {
        var cost = this.getCardCost(card, collection);
        if (card.type === Card.types.UPGRADE) {
            var cardsToUpgrade = player.cards.filter(function (baseCard) {
                return baseCard.canUpgradeTo(card);
            });
            return cardsToUpgrade.length > 0;
        } else {
            return cost <= player.money;
        }
    }

    this.getCurrentPlayer = function () {
        return this.players[this.turn];
    };

    /**
     * Current player wants to buy selected card
     */
    this.buyCard = function (card, collection) {
        var player = this.getCurrentPlayer();
        var cost = this.getCardCost(card, collection);

        if (card.type === Card.types.UPGRADE) {
            var cardsToUpgrade = player.cards.filter(function (baseCard) {
                return baseCard.canUpgradeTo(card);
            });
            if (cardsToUpgrade.length === 0) {
                console.log("no cards to upgrade to this card");
                return false;
            }

            if (player.isHuman) {
                $scope.openUpgradeModal(card, collection, this);
                return;
            } else {
                var baseCard = AI.pickUpgradeCard(player, this, card, collection);
                if (baseCard === null) {
                    console.log("Aborting upgrade");
                    return false;
                } else {
                    return this.upgradeCard(baseCard, card, collection);
                }
            }
        } else {
            if (cost > player.money) {
                console.log("Player " + player.name + " cannot afford " + card.name + " with calculated cost " + cost);
                return false;
            }
        }

        // pay for the card
        player.money -= cost;
        if (player.money < 0) {
            console.error("ERROR: money for player " + player.name + " has gone negative after buying card " + card.name + " for " + cost + " coins");
            alert("ERROR");
        }

        // add card to player collection
        player.cards.push(card);

        // remove card from previous collection
        if (collection) {
            var i = collection.indexOf(card);
            collection.splice(i, 1);
        }
        console.log("Player " + player.name + " bought " + card.name + " for " + cost);

        this.sortPlayerCards(player);
        // reset consecutive passes
        this.consecutivePasses = 0;

        // successful buy means next turn
        this.nextTurn();
        return true;
    };

    this.playCardFromHand = function (card, player) {
        if (player !== this.players[this.turn]) {
            console.log("Can only play cards on your turn");
            return false;
        }

        this.buyCard(card, player.hand);
    };

    /**
     * Assume upper cards from last round moved to lower row
     */
    this.dealCards = function () {
        var card, numCards = (2 * this.players.length) - this.lowerBoard.length;
        for (var i = 0; i < numCards && this.decks[this.phase].length > 0; i++) {
            card = this.decks[this.phase].pop();
            this.upperBoard.push(card);
        }

        // sort these cards based on cost, with the first being the cheapest
        this.upperBoard.sort(function (a, b) {
            return a.cost - b.cost;
        });

        if (this.decks[this.phase].length === 0 && !this.lastRound) {
            console.log("No more cards in deck " + this.getPhaseName() + " which means this is the last round");
            alert("Warning: " + this.getPhaseName() + " deck is exhausted. This is the last round.");
            this.lastRound = true;
        }
    };

    this.getPhaseName = function (phase) {
        phase = phase || this.phase;
        switch (phase) {
            case Card.types.WORKER:
                return "Worker";
            case Card.types.BUILDING:
                return "Building";
            case Card.types.ARISTOCRAT:
                return "Aristocrat";
            case Card.types.UPGRADE:
                return "Upgrade";
        }
    };

    this.doRobotAction = function () {
        var player = this.getCurrentPlayer();
        if (! player.isHuman) {
            var deckSizes = [];
            for (var i = 0; i < this.phases.length; i++) {
                deckSizes.push( this.decks[this.phases[i]].length );
            }
            // create the state out of current game state
            var state = new State(deckSizes, this.upperBoard, this.lowerBoard,
                    this.phase, player);
            var obj = AI.analyze(state);
            console.log("Plan for " + player.name + ":");
            for (var i = 0; i < obj.moveList.length; i++)
                console.log(obj.moveList[i].toString());
            var locationMap = {};
            locationMap[Card.locations.UPPER_BOARD] = this.upperBoard;
            locationMap[Card.locations.LOWER_BOARD] = this.lowerBoard;
            locationMap[Card.locations.HAND] = player.hand;
            if (obj.move) {
                switch (obj.move.action) {
                    case Move.actions.PASS:
                        this.passTurn();
                        break;
                    case Move.actions.BUY:
                        this.buyCard(obj.move.card, locationMap[obj.move.location]);
                        break;
                    case Move.actions.PUT_IN_HAND:
                        this.putCardInHand(obj.move.card, locationMap[obj.move.location]);
                        break;
                    case Move.actions.UPGRADE:
                        this.upgradeCard(obj.move.baseCard, obj.move.card,
                                locationMap[obj.move.location]);
                        break;
                }
            } else {
                console.log("nothing to be done");
                this.passTurn();
            }
        }
    };

    this.isCurrentPhase = function (phase) {
        return phase === this.phase;
    };

    this.init();
}).directive("spbCard", function () {
    return {
        templateUrl: "spb-card.html"
    };
});

/**
 * Controls the modal which opens on card upgrade
 */
StPeter.controller("ModalInstanceCtrl", function ($scope, $modalInstance, baseCards, upgradeCard, costMap) {
    "use strict";
    $scope.upgradableCards = baseCards;
    $scope.upgradeCard = upgradeCard;
    $scope.costMap = costMap;
    $scope.selected = {
        card: $scope.upgradableCards[0]
    };

    $scope.ok = function () {
        $modalInstance.close($scope.selected.card);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("cancel");
    };

    $scope.getCost = function (card) {
        return $scope.costMap[card.name];
    };

    $scope.getCardString = function (card) {
        return card.name + " (" + $scope.getCost(card) + ")";
    };
});

/**
 * Controls the modal which opens on observatory play
 */
StPeter.controller("ObservatoryModalInstanceCtrl", function ($scope, $modalInstance, phases) {
    $scope.phases = phases;
    $scope.selected = {
        deck: $scope.phases[0]
    };

    $scope.ok = function () {
        $modalInstance.close($scope.selected.deck);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("cancel");
    };
});

/**
 * Controls the modal which opens as the second stage of observatory play
 */
StPeter.controller("PeekingModalInstanceCtrl", function ($scope, $modalInstance, peekCard, cardCost, options) {
    $scope.options = options;
    $scope.peekCard = peekCard;
    $scope.cardCost = cardCost;
    $scope.selected = {
        option: $scope.options[0]
    };

    $scope.ok = function () {
        $modalInstance.close($scope.selected.option);
    };
});