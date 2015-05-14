// create Angular app
var StPeter = angular.module("StPeter", []);
// create Angular controller
StPeter.controller("PeterCtrl", ["$scope", function ($scope) {
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
    this.cardMap["WORKER"] = {
        "LUMBERJACK": 6,
        "GOLD_MINER": 6,
        "SHEPHERD": 6,
        "FUR_TRAPPER": 6,
        "SHIP_BUILDER": 6,
        "CZAR_AND_CARPENTER": 1,
    };
    this.cardMap["BUILDING"] = {
        "MARKET": 5,
        "CUSTOMS_HOUSE": 5,
        "FIREHOUSE": 3,
        "HOSPITAL": 3,
        "LIBRARY": 3,
        "THEATRE": 2,
        "ACADEMY": 1
    };
    this.cardMap["ARISTOCRAT"] = {
        "AUTHOR": 6,
        "ADMINISTRATOR": 5,
        "WAREHOUSE_MANAGER": 5,
        "SECRETARY": 4,
        "CONTROLLER": 3,
        "JUDGE": 2,
        "MISTRESS": 2,
    };
    this.cardMap["UPGRADE"] = {
        "DEFAULT": 1
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

    /**
     * Create the deck made of the given type of card.
     * Shuffle the deck.
     */
    this.createDeckOfType = function (type) {
        var numCards, card;
        var cardMap  = this.cardMap[type];
        this.decks[type] = [];

        var cards = allCards.filter(function (card) {
            return card.type === type;
        });
        for (var c = 0; c < cards.length; c++) {
            numCards = cardMap[cards[c].name] || cardMap["DEFAULT"] || 0;
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

        // deal first 8 cards
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
     * 1. If this is the last round, print game over and exit
     * 2. Shift tokens between players
     * 3. Call nextPhase
     */
    this.nextRound = function () {
        if (this.lastRound) {
            console.log("game over");
            // TODO eval game over conditions
            return false;
        }

        // rotate tokens
        var token, player;
        for (var p = 0; p < this.players.length; p++) {
            player = this.players[p];
            token = player.token;
            player.token = this.players[(p + 1) % this.players.length].token;
        }

        this.nextPhase();
    };

    this.nextPhase = function () {
        var i = this.phases.indexOf(this.phase);
        this.phase = this.phases[(i + 1) % this.phases.length];
        console.log("Phase is now " + this.phase);
        this.preparePhase();
    };

    /**
     * Current player wants to buy selected card
     */
    this.buyCard = function (card, container) {
        // for now only use upper or lower to determine card cost
        var cost = card.cost;
        var player = this.players[this.turn];
        if (container === this.lowerBoard && cost > 1) {
            cost--;
        }
        if (cost > player.money) {
            return false;
        }

        if (card.type === "UPGRADE") {
            var cardsToUpgrade = player.cards.filter(function (baseCard) {
                return baseCard.canUpgradeTo(card);
            });
            if (cardsToUpgrade.length === 0) {
                console.log("no cards to upgrade to this card");
                return false;
            }
            // pick the card to upgrade from
            // for now, do this via popup
            var idx = null;
            while (idx === null) {
                idx = prompt("Enter the number to upgrade, from these cards: " + 
                        cardsToUpgrade.join(", "));
                console.log(player.cards[idx]);
                return false;
            }
        }

        // pay for the card
        player.money -= cost;

        // add card to player collection
        player.cards.push(card);

        // remove card from container
        var i = container.indexOf(card);
        container.splice(i, 1);

        // successful buy means next turn
        this.nextTurn();
        return true;
    };

    /**
     * Assume upper cards from last round moved to lower row
     */
    this.dealCards = function () {
        var card, numCards = (2 * this.players.length) - this.lowerBoard.length;
        for (var i = 0; i < numCards; i++) {
            card = this.decks[this.phase].pop();
            this.upperBoard.push(card);
        }
    };

    this.isCurrentPhase = function (phase) {
        return phase === this.phase;
    };

    this.init();
}]);
