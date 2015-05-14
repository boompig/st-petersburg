// create Angular app
var StPeter = angular.module("StPeter", ["ng-context-menu", "ui.bootstrap"]);

// create Angular controller
StPeter.controller("PeterCtrl", function ($scope, $modal) {
    "use strict";

    /****** STATIC DATA *******/
    this.phases = ["WORKER", "BUILDING", "ARISTOCRAT", "UPGRADE"];
    this.playerNames = [
        "Sergei",
        "Ross",
        "Daniel",
        "Will"
    ];
    this.cardMap = {};
    this.cardMap.WORKER = {
        "LUMBERJACK": 6,
        "GOLD_MINER": 6,
        "SHEPHERD": 6,
        "FUR_TRAPPER": 6,
        "SHIP_BUILDER": 6,
        "CZAR_AND_CARPENTER": 1,
    };
    this.cardMap.BUILDING = {
        "MARKET": 5,
        "CUSTOMS_HOUSE": 5,
        "FIREHOUSE": 3,
        "HOSPITAL": 3,
        "LIBRARY": 3,
        "THEATRE": 2,
        "ACADEMY": 1,
        "WAREHOUSE": 1,
        "POTJOMKINS_VILLAGE": 1
    };
    this.cardMap.ARISTOCRAT = {
        "AUTHOR": 6,
        "ADMINISTRATOR": 5,
        "WAREHOUSE_MANAGER": 5,
        "SECRETARY": 4,
        "CONTROLLER": 3,
        "JUDGE": 2,
        "MISTRESS_OF_CEREMONIES": 2,
    };
    this.cardMap.UPGRADE = {
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
    this.phase = "WORKER";
    this.turn = 0;
    this.lastRound = false;
    this.consecutivePasses = 0;

    /****** UI FUNCTIONS ********/

    /**
     * Open the upgrade modal, and pick the card which to upgrade into the selected card
     */
    $scope.openUpgradeModal = function (card, collection, game) {
        var player = game.players[game.turn];
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
        var player = this.players[this.turn];
        var cost = card.cost;
        if (collection === this.lowerBoard) {
            cost--;
        }
        var similarCards = player.cards.filter(function (otherCard) {
            return otherCard.name === card.name;
        });
        cost -= similarCards.length;

        if (player.hasDiscountForCard(card)) {
            cost--;
        }

        // TODO compute special cards here
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
        var player = this.players[this.turn];
        var cost = this.getUpgradeCost(baseCard, upgradeCard, collection);

        console.log("Trying to upgrade " + baseCard.name + " into " + upgradeCard.name + " for " + cost + " coins");

        if (player.money < cost) {
            console.log("Player " + player.name + " cannot afford!");
            return false;
        }

        // pay for the card
        player.money -= cost;
        // remove card from collection
        var idx = collection.indexOf(upgradeCard);
        collection.splice(idx, 1);
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
        player.cards.sort(function (a, b) {
            if (b.upgradeType > a.upgradeType) {
                return 1;
            } else if (b.upgradeType === a.upgradeType) {
                return 0;
            } else {
                return -1;
            }
        })
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
        var tokens = ["ARISTOCRAT", "BUILDING", "WORKER", "UPGRADE"];
        this.players = [];
        while (tokens.length > 0) {
            var idx = Math.floor(Math.random() * tokens.length);
            var token = tokens[idx];
            tokens.splice(idx, 1);
            var name = this.playerNames.pop();
            this.players.push(new Player(name, token));
        }

        // create each deck
        this.decks = {};
        this.createDeckOfType("WORKER");
        this.createDeckOfType("BUILDING");
        this.createDeckOfType("ARISTOCRAT");
        this.createDeckOfType("UPGRADE");

        // reset turn and phase
        this.phase = "WORKER";
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
        if (this.phase !== "UPGRADE") {
            var player, card;

            for (var p = 0; p < this.players.length; p++) {
                player = this.players[p];

                var game = this;
                var relevantCards = player.cards.filter(function (card) {
                    return card.type === game.phase ||
                        (card.type === "UPGRADE" && card.upgradeType === game.phase);
                });

                for (var c = 0; c < relevantCards.length; c++) {
                    card = relevantCards[c];
                    player.money += card.coinYield;
                    player.points += card.pointYield;
                }
            }
        }

        this.lowerBoard = [];
        while (this.upperBoard.length > 0) {
            this.lowerBoard.push(this.upperBoard.pop());
        }
        if (this.phase === "UPGRADE") {
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
            var aristocrats = player.cards.filter(function (card) {
                return card.type === "ARISTOCRAT" || (card.type === "UPGRADE" && card.upgradeType === "ARISTOCRAT");
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
        console.log("Phase is now " + this.phase);
        this.preparePhase();
    };

    this.putCardInHand = function (card, collection) {
        var player = this.players[this.turn];

        // TODO check if warehouse
        if (player.hand.length === player.getMaxHandSize()) {
            return false;
        }

        // remove from collection
        var idx = collection.indexOf(card);
        collection.splice(idx, 1);
        // put in hand
        player.hand.push(card);

        // reset consecutive passes and push to next turn
        this.consecutivePasses = 0;
        this.nextTurn();
    };

    /**
     * Current player wants to buy selected card
     */
    this.buyCard = function (card, collection) {
        var player = this.players[this.turn];
        var cost = this.getCardCost(card, collection);

        if (card.type === "UPGRADE") {
            var cardsToUpgrade = player.cards.filter(function (baseCard) {
                return baseCard.canUpgradeTo(card);
            });
            if (cardsToUpgrade.length === 0) {
                console.log("no cards to upgrade to this card");
                return false;
            }

            $scope.openUpgradeModal(card, collection, this);
            return null;
        } else {
            if (cost > player.money) {
                console.log("Player " + player.name + " cannot afford " + card.name + " with calculated cost " + cost);
                return false;
            }
        }

        // pay for the card
        player.money -= cost;

        // add card to player collection
        player.cards.push(card);

        // remove card from previous collection
        if (collection) {
            var i = collection.indexOf(card);
            collection.splice(i, 1);
        }

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

        if (this.decks[this.phase].length === 0) {
            console.log("No more cards in deck " + this.phase + " which means this is the last round");
            this.lastRound = true;
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
});
