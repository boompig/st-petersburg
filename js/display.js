/* global angular, _ */

import { allCards, Card } from "./cards.js";
import { StaticGameData } from "./static-data.js";
import { Player } from "./player.js";
import { State } from "../my_node_modules/game-state.js";
import { Move } from "../my_node_modules/game-move.js";
import { AI } from "../my_node_modules/ai.js";

const Console = console;

// create Angular app
const StPeter = angular.module("stPeter", [
    "ngAnimate",
    "ng-context-menu",
    "ui.bootstrap"]);

// create Angular controller
StPeter.controller("PeterCtrl", function ($scope, $timeout, $uibModal) {
    "use strict";

    /****** STATIC DATA *******/
    this.phases = StaticGameData.Phases;

    // these are the possible names for the AI
    this.playerNames = [
        "Sergei",
        "Ross",
        "Daniel",
        "Will",
        "Alexey",
        "Elia",
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

    /******* GAME STATE DATA *****/
    // map of deck type to card array
    this.decks = {};
    this.players = [];
    this.upperBoard = [];
    this.lowerBoard = [];
    this.phase = Card.types.WORKER;
    // index of the player whose turn it is
    this.turn = 0;
    this.consecutivePasses = 0;
    /******* END GAME STATE DATA */

    /******* derived game state data ******/
    // true iff this is the last round
    this.lastRound = false;
    this.isGameOver = false;
    /******* derived game state data ******/

    /****** UI DATA **************/
    this.aiIsWorking = false;
    this.humanPlayerIndex = 0;
    this.humanPlayerName = null;
    this.humanPlayerNameError = false;
    /****** UI DATA **************/

    /******* GAME TRACE DATA *****/
    this.gameId = null;
    // a list of actions taken by all players, in the order that they were taken
    this.actions = [];
    /* number of rounds *completed* so far */
    this.numRounds = 0;
    /******* GAME TRACE DATA *****/

    /****** UI FUNCTIONS ********/

    /**
     * Open the upgrade modal, and pick the card which to upgrade into the selected card
     * @param {Card} card
     * @param {Array<Card>} collection
     */
    $scope.openUpgradeModal = function (card, collection, game) {
        const player = game.getCurrentPlayer();
        const upgradableCards = game.getUpgradableCards(card, player);

        // compute how much it would cost to upgrade each card
        const costMap = {};
        for (let i = 0; i < upgradableCards.length; i++) {
            const baseCard = upgradableCards[i];
            const upgradeCost = game.getUpgradeCost(baseCard, card, collection);
            costMap[baseCard.name] = upgradeCost;
        }

        const modalInstance = $uibModal.open({
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
            Console.log("Did not select card for upgrade");
        });
    };

    /**
     * Use the pub to exchange money for points.
     * Also sets the card as played.
     * Async function.
     * @param {Game} game
     * @param {Card} card
     */
    $scope.openPubModal = function(game, card) {
        const humanPlayer = game.getHumanPlayer();
        const modalInstance = $uibModal.open({
            templateUrl: "js/angular-templates/pub-modal.html",
            controller: "PubModalInstanceCtrl",
            resolve: {
                player: humanPlayer,
            },
        });
        return modalInstance.result.then(function(coinsToExchange) {
            Console.log(`Exchanging ${coinsToExchange} coins using pub`);
            card.played = true;
            if(isNaN(Number.parseInt(coinsToExchange))) {
                Console.warn("Some sort of error in pub modal");
                Console.log(coinsToExchange);
            } else if(humanPlayer.money >= coinsToExchange) {
                humanPlayer.money -= coinsToExchange;
                const points = Math.floor(coinsToExchange / 2);
                humanPlayer.points += points;
            } else {
                Console.log(`Coins to exchange: ${coinsToExchange}`);
                Console.log(`Player money: ${humanPlayer.money}`);
                Console.error("Specified too many coins to exchange");
                alert(`Specified too many coins to exchange (you only have ${humanPlayer.money} coins)`);
            }
        });
    };

    /**
     * Open the observatory modal, and pick the deck that you want to peek at.
     * Set the card as played
     * Async function
     * @param {Game} game
     * @param {Card} card
     */
    $scope.openObservatoryModal = function (game, card) {
        const validPhases = [];
        let name;
        for (let i = 0; i < game.phases.length; i++) {
            if (game.decks[game.phases[i]].length > 0) {
                name = game.getPhaseName( game.phases[i] );
                validPhases.push( name );
            }
        }

        let modalInstance = $uibModal.open({
            templateUrl: "observatoryModal.html",
            controller: "ObservatoryModalInstanceCtrl",
            resolve: {
                phases: function () {
                    return validPhases;
                }
            }
        });
        modalInstance.result.then(function (selectedDeck) {
            Console.log("Peeking at deck of type " + selectedDeck);
            // set the card to used here
            card.played = true;
            let selection = Card.types[selectedDeck.toUpperCase()];
            $scope.openPeekingModal(game, selection);
        }, function () {
            Console.log("Did not select a deck, so quitting");
        });
    };

    /**
     * Return a promise that resolves into the player name
     */
    $scope.openPlayerNameModal = function() {
        Console.log("Asking for the player's name...");
        let modalInstance = $uibModal.open({
            templateUrl: "js/angular-templates/player-name-modal.html",
            controller: "PlayerNameInstanceCtrl",
        });
        return modalInstance.result.then(function(playerName) {
            return playerName;
        });
    };

    /**
     * The second part of the observatory flow.
     * Assume that the chosen deck is non-empty.
     * @param {Card.types} deckType
     */
    $scope.openPeekingModal = function (game, deckType) {
        const player = game.getCurrentPlayer();
        const peekDeck = game.decks[deckType];
        // card removed here, no need to remove later
        const peekCard = peekDeck.pop();
        const cardCost = game.getCardCost(peekCard, null);

        const options = [];

        // make sure player can afford card, if the card is not an upgrade
        if (peekCard.type === Card.types.UPGRADE || cardCost <= player.money) {
            options.push(`Buy (${cardCost})`);
        }
        // make sure player has space for the card in the hand
        if (player.getMaxHandSize() > player.hand.length) {
            options.push("Put in hand");
        }

        options.push("Discard");

        const modalInstance = $uibModal.open({
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
            if (selectedOption.startsWith("Buy")) {
                game.buyCard(peekCard, peekDeck);
            } else if (selectedOption === "Put in hand") {
                game.putCardInHand(peekCard, peekDeck);
            } else {
                // discard, do nothing
            }
        }, function () {
            Console.log("Did not select an option, so discarding the card");
        });
    };

    /******* GAME FUNCTIONS ********/

    /**
     * Easier to reload the page than to reset the state
     */
    this.newGame = function () {
        window.location.reload();
    };

    /**
     * @param {Card} baseCard
     * @param {Card} upgradeCard
     * @param {Array<Card>} collection
     * @returns {number}
     */
    this.getUpgradeCost = function (baseCard, upgradeCard, collection) {
        const upgradeCardCost = this.getCardCost(upgradeCard, collection);
        return Math.max(1, upgradeCardCost - baseCard.upgradeCost);
    };

    /**
     * Return list of cards which can be upgraded (by given player) from given card
     * @param {Card} card
     * @param {Player} player
     * @returns {Array<Card>}
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
        const player = this.getCurrentPlayer();
        let cost = card.cost;
        // Console.log("Calculating cost for card " + card.name);
        // Console.log("Base cost is " + cost);
        if (collection === this.lowerBoard) {
            // Console.log("Reduce cost by 1 as card is from lower board");
            cost--;
        }
        const similarCards = player.cards.filter(function (otherCard) {
            return otherCard.name === card.name;
        });
        // Console.log("Reduce cost by " + similarCards.length + " as player has that many instances of the card already");
        cost -= similarCards.length;

        if (player.hasDiscountForCard(card)) {
            cost--;
            // Console.log("Reduce cost by 1, as player has discount card relevant to this card");
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
     * @param {Card} baseCard
     * @param {Card} upgradeCard
     * @param {Array<Card>} collection
     * @returns {boolean}
     */
    this.upgradeCard = function (baseCard, upgradeCard, collection) {
        if (! baseCard.canUpgradeTo(upgradeCard)) {
            return false;
        }
        const player = this.getCurrentPlayer();
        const cost = this.getUpgradeCost(baseCard, upgradeCard, collection);
        let idx;

        Console.log("Trying to upgrade " + baseCard.name + " into " + upgradeCard.name + " for " + cost + " coins");

        if (player.money < cost) {
            Console.log("Player " + player.name + " cannot afford!");
            alert("Player " + player.name + " cannot afford to perform this upgrade");
            return false;
        }

        // record this action
        let locationName = this.getLocationFromCollection(collection);
        this.actions.push(new Move(
            Move.actions.UPGRADE,
            locationName,
            baseCard,
            upgradeCard
        ));

        // pay for the card
        player.money -= cost;
        if (player.money < 0) {
            Console.error("ERROR: Player money for " + player.name + " has gone negative after upgrading " + baseCard.name + " to " + upgradeCard.name + " for " + cost + "coins");
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
     * @param {Player} player
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
     * @param {Card.types} type
     */
    this.createDeckOfType = function (type) {
        let numCards, card, cardName;
        const cardMap  = this.cardMap[type];
        this.decks[type] = [];

        const cards = allCards.filter(function (card) {
            return card.type === type;
        });
        for (let c = 0; c < cards.length; c++) {
            cardName = cards[c].name.replace("'", "").replace(/ /g, "_").toUpperCase();
            numCards = cardMap[cardName] || cardMap["DEFAULT"] || 0;
            if (numCards === 0) {
                Console.error("Error: missed " + cardName);
            }
            for (let i = 0; i < numCards; i++) {
                card = _.clone(cards[c]);
                this.decks[type].push(card);
            }
        }
        this.decks[type] = _.shuffle(this.decks[type]);
    };

    /**
     * @returns {String}
     */
    this.getRandomGameId = function () {
        const dateString = (new Date()).toISOString().split("T")[0];
        const randomNonce = Math.floor(Math.random() * 1e8);
        return dateString + "-" + randomNonce;
    };

    /**
     * Return a shuffled array of tokens that will be assigned to the players in the same order
     * @returns {Array<Card.types>}
     */
    this.getTokenOrder = function() {
        let tokens = [Card.types.ARISTOCRAT, Card.types.BUILDING, Card.types.WORKER, Card.types.UPGRADE];
        let shuffledTokens = _.shuffle(tokens);
        return shuffledTokens;
    };

    this.init = function() {
        if(window.sessionStorage) {
            this.humanPlayerName = window.sessionStorage.getItem("humanPlayerName");
        }

        if(this.humanPlayerName) {
            Console.log("Read human player's name from session storage: " + this.humanPlayerName);
            this.gameInit();
        } else {
            $scope.openPlayerNameModal().then((playerName) => {
                Console.log("Got name " + playerName);
                this.humanPlayerName = playerName;
                if(!this.humanPlayerName) {
                    Console.log("human player name not set");
                    this.humanPlayerNameError = true;
                    return;
                }

                if(window.sessionStorage) {
                    Console.log("Saving human player's name to session storage");
                    // save the human player's name to session storage
                    window.sessionStorage.setItem("humanPlayerName", this.humanPlayerName);
                }

                // running game init in another thread so modal can close
                Console.log("// running game init in another thread so modal can close");
                $timeout(() => {
                    this.gameInit();
                }, 0);
            }).catch(() => {
                Console.log("human player name not set");
                this.humanPlayerNameError = true;
            });
        }
    };

    /**
     * Return the 3 AI names to use
     * Make sure none of them is the same as the humanPlayerName
     * @returns {Array<String>}
     */
    this.getAiNames = function() {
        // shuffle so that the result is different each time
        let playerNames = _.shuffle(this.playerNames);
        for(let i = 0; i < playerNames.length; i++) {
            if(playerNames[i] === this.humanPlayerName) {
                playerNames.splice(i, 1);
                break;
            }
        }
        return playerNames.slice(0, 3);
    };

    /**
     * Assume this.humanPlayerName is already set
     */
    this.gameInit = function () {
        this.gameId = this.getRandomGameId();

        // assign tokens to players
        let tokens = this.getTokenOrder();
        // figure out which AIs are going to play
        let playerNames = this.getAiNames();
        // insert the human player's name into the list of player names (at the beginning)
        playerNames.splice(0, 0, this.humanPlayerName);
        for(let i = 0; i < playerNames.length; i++) {
            let name = playerNames[i];
            let token = tokens[i];
            this.players.push(new Player(name, token, i === this.humanPlayerIndex));
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

        // create consideDecks to write initial state to server *only*
        const conciseDecks = {};
        for(let phaseIndex in this.decks) {
            let cardNames = this.decks[phaseIndex].map((card) => {
                return card.name;
            });
            let deckName = this.getPhaseName(phaseIndex);
            conciseDecks[deckName] = cardNames;
        }
        const initialState = {
            "humanPlayerIndex": this.humanPlayerIndex,
            "playerTokenAllocation": this.players.map((player) => {
                return this.getPhaseName(player.token);
            }),
            "decks": conciseDecks,
        };
        this.sendInitialGameState(this.gameId, initialState);
    };

    /**
     *
     * @param {String} url
     * @param {any} data
     */
    this.corsPostJSON = function(url, data) {
        return window.fetch(url, {
            body: JSON.stringify(data),
            method: "POST",
            credentials: "omit",
            mode: "cors",
            headers: { "Content-Type": "application/json" },
            referrer: "no-referrer",
            redirect: "follow",
        });
    };

    /**
     *
     * @param {String} gameId
     * @param {any} initialState
     */
    this.sendInitialGameState = function(gameId, initialState) {
        let baseUrl;
        if(window.location.href.startsWith("http://localhost")) {
            baseUrl = "http://localhost:9897";
        } else {
            baseUrl = "https://boompig.herokuapp.com";
        }
        // const baseUrl = "http://localhost:9897"
        const url = baseUrl + "/api/st-petersburg/initial-game-state";
        // Console.log(initialState);
        this.corsPostJSON(url, {
            gameId: gameId,
            initialState: initialState,
        }).then((response) => {
            if (response.ok) {
                response.json().then((obj) => Console.log(obj));
            } else {
                response.text().then((obj) => Console.log(obj));
            }
        }).catch((err) => {
            Console.error("Failed to write initial game state to server:");
            Console.error(err);
        });
    };

    /**
     *
     * @param {String} gameId
     * @param {any} finalState
     */
    this.sendFinalGameState = function(gameId, finalState) {
        let baseUrl;
        if(window.location.href.startsWith("http://localhost")) {
            baseUrl = "http://localhost:9897";
        } else {
            baseUrl = "https://boompig.herokuapp.com";
        }
        const url = baseUrl + "/api/st-petersburg/final-game-state";
        finalState.actions = this.actions;
        // Console.log(finalState);
        this.corsPostJSON(url, {
            gameId: gameId,
            finalState: finalState,
        }).then((response) => {
            if (response.ok) {
                response.json().then((obj) => Console.log(obj));
            } else {
                response.text().then((obj) => Console.log(obj));
            }
        }).catch((err) => Console.error(err));
    };

    /**
     * 1. Set turn to the player with the starter token for this phase
     * 2. Reset consecutive passes
     * 3. Deal cards to top row (assume past cards moved to bottom row)
     */
    this.preparePhase = function () {
        for (let t = 0; t < this.players.length; t++) {
            if (this.players[t].token === this.phase) {
                this.turn = t;
                break;
            }
        }
        this.consecutivePasses = 0;

        // deal cards from current phase's deck, assuming previous phase's cards moved to lower board
        this.dealCards();
    };

    /**
     *
     * @param {Player} player
     * @returns {boolean}
     */
    this.isPlayerTurn = function (player) {
        const i = this.players.indexOf(player);
        return i === this.turn;
    };

    this.nextTurn = function () {
        this.turn = (this.turn + 1) % this.players.length;
    };

    this.passTurn = function () {
        // record this action to historical data
        this.actions.push(new Move(Move.actions.PASS));
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
            let player, card;

            for (let p = 0; p < this.players.length; p++) {
                player = this.players[p];

                const game = this;
                const relevantCards = player.cards.filter(function (card) {
                    return card.type === game.phase ||
                        (card.type === Card.types.UPGRADE && card.upgradeType === game.phase);
                });

                for (let c = 0; c < relevantCards.length; c++) {
                    card = relevantCards[c];
                    if (card.isPlayable && card.played) {
                        // reset whether card has been played this phase
                        card.played = false;
                        continue;
                    }
                    player.money += card.coinYield;
                    player.points += card.pointYield;

                    if (card.bonusYieldClass !== null) {
                        const bonusCards = player.cards.filter(function (bonusCard) {
                            return bonusCard.type === card.bonusYieldClass ||
                                (bonusCard.type === Card.types.UPGRADE && bonusCard.upgradeType === card.bonusYieldClass);
                        });
                        if(card.bonusYieldType === "money") {
                            Console.log("Got " + bonusCards.length + " bonus money from card " + card.name);
                            player.money += bonusCards.length;
                        } else {
                            Console.log("Got " + bonusCards.length + " bonus points from card " + card.name);
                            player.points += bonusCards.length;
                        }
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
        Console.log("**** Doing game-end calculations... ****");
        for (let p = 0; p < this.players.length; p++) {
            let player = this.players[p];
            Console.log("Player " + player.name + " ended the game with " + player.points + " points");
            let numAristocrats = player.numUniqueAristocrats();
            let aristocratPoints = StaticGameData.scoreAristocrats(numAristocrats);
            Console.log("Player " + player.name + " earned " + aristocratPoints + " points from " + numAristocrats + " aristocrats");
            player.points += aristocratPoints;

            // money scoring
            let moneyPoints = Math.floor(player.money / 10);
            Console.log("Player " + player.name + " earned " + moneyPoints + " points from " + player.money + " coins");
            player.points += moneyPoints;

            // hand penalties
            let handPenalty = player.hand.length * 5;
            Console.log("Player " + player.name + " was penalized " + handPenalty + " points from " + player.hand.length + " cards in hand");
            player.points -= handPenalty;
            Console.log("Final score for player " + player.name + " is " + player.points + " points");
        }
    };

    this.rotateTokens = function () {
        let oldToken, passedToken = null;
        for (let p = 0; p < this.players.length; p++) {
            oldToken = this.players[p].token;
            if (passedToken) {
                this.players[p].token = passedToken;
                Console.log("Token for player " + this.players[p].name + " is now " + passedToken);
            }
            passedToken = oldToken;
        }
        Console.log("Token for player " + this.players[0].name + " is now " + passedToken);
        this.players[0].token = passedToken;
    };

    /**
     * @returns {boolean}
     */
    this.hasNextRound = function() {
        return !this.lastRound;
    };

    /**
     * 1. If this is the last round, print game over and exit
     * 2. Shift tokens between players
     * 3. Call nextPhase
     */
    this.nextRound = function () {
        this.numRounds++;
        if (this.lastRound) {
            this.evalGameEnd();

            let winningPlayer = null;
            let winningPoints = -1;
            let winningPlayerIndex = -1;
            for (let i = 0; i < this.players.length; i++) {
                if (this.players[i].points > winningPoints) {
                    winningPlayer = this.players[i];
                    winningPoints = this.players[i].points;
                    winningPlayerIndex = i;
                }
            }

            Console.log("Game Over! The winner is " + winningPlayer.name + " with " + winningPoints + " points");
            // TODO display this in a nicer way
            alert("Game Over! The winner is " + winningPlayer.name + " with " + winningPoints + " points");

            // send final game state
            const finalGameState = {
                "finalPoints": this.players.map((player) => player.points),
                "winningPlayerIndex": winningPlayerIndex,
                "winningPlayerPoints": winningPoints,
                "numRounds": this.numRounds,
            };
            this.sendFinalGameState(this.gameId, finalGameState);
            this.isGameOver = true;
        } else {
            this.rotateTokens();
            this.nextPhase();
        }
    };

    this.nextPhase = function () {
        let i = StaticGameData.Phases.indexOf(this.phase);
        this.phase = StaticGameData.Phases[(i + 1) % StaticGameData.Phases.length];
        Console.log("Phase is now " + StaticGameData.getPhaseName(this.phase));
        this.preparePhase();
    };

    /**
     *
     * @param {Card} card
     * @param {Array<Card>} collection
     * @returns {boolean}
     */
    this.putCardInHand = function (card, collection) {
        const player = this.getCurrentPlayer();

        if (player.hand.length === player.getMaxHandSize()) {
            Console.log("Hand is full!");
            alert("Hand is full!");
            return false;
        }

        // record the action
        const locationName = this.getLocationFromCollection(collection);
        this.actions.push(new Move(
            Move.actions.PUT_IN_HAND,
            locationName,
            card
        ));

        // remove from collection
        if (collection) {
            let idx = collection.indexOf(card);
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
     * @param  {Card} card
     * @param  {Player} player
     * @param  {Array<Card>} collection
     */
    this.playCard = function (card, player, collection) {
        const currentPlayer = this.players[this.turn];
        if(currentPlayer !== player) {
            Console.log("Cannot play another player's card");
            alert("Cannot play another player's card");
            return false;
        }
        if (!card.isPlayable) {
            Console.log("Card is not playable");
            alert("This card is not playable");
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
                const pile = AI.pickObservationDeck(player, this);
                if (pile && this.decks[pile] && this.decks[pile].length > 0) {
                    const peekCard = this.decks[pile].pop();
                    const result = AI.pickObservationAction(player, this, peekCard);

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
        } else if (card.name === "Pub") {
            // prereq # 1 - player must have money
            // prereq # 2 - card must not have been played during this phase
            // prereq # 3 - it must be the building phase
            if(currentPlayer.money === 0) {
                Console.error("Current player has no money");
                return false;
            }
            if(card.played) {
                if(player.isHuman) {
                    alert("Card has already been played this round.");
                }
                Console.error("Card has been played");
                return false;
            }
            if(this.phase !== Card.types.BUILDING) {
                Console.error("Must be building phase to play this card");
                return false;
            }

            if(player.isHuman) {
                // card set to played inside this function
                $scope.openPubModal(this, card);
            } else {
                Console.error("ERROR: Pub not yet implemented for AI");
                return false;
            }
        } else {
            Console.error("Unknown card being played: " + card.name);
            return false;
        }
    };

    /**
     * Return true iff the player can afford the given card
     * For upgrade cards, return true iff player has at least 1 card which can be upgraded
     * @param {Card} card
     * @param {Player} player
     * @param {Array<Card>} collection
     * @returns {boolean}
     */
    this.playerCanAffordCard = function (card, player, collection) {
        const cost = this.getCardCost(card, collection);
        if (card.type === Card.types.UPGRADE) {
            const cardsToUpgrade = player.cards.filter(function (baseCard) {
                return baseCard.canUpgradeTo(card);
            });
            return cardsToUpgrade.length > 0;
        } else {
            return cost <= player.money;
        }
    };

    /**
     * @returns {Player}
     */
    this.getCurrentPlayer = function () {
        return this.players[this.turn];
    };

    /**
     * @returns {Player}
     */
    this.getHumanPlayer = function() {
        return this.players[this.humanPlayerIndex];
    };

    /**
     * Only works properly if turn rollover hasn't happened yet
     * @param {Array<Card>} collection
     */
    this.getLocationFromCollection = function(collection) {
        const player = this.getCurrentPlayer();
        if(collection === player.hand) {
            return Card.locations.HAND;
        } else if(collection === this.lowerBoard) {
            return Card.locations.LOWER_BOARD;
        } else if(collection === this.upperBoard) {
            return Card.locations.UPPER_BOARD;
        } else {
            // go through the decks because this might be Observatory card
            for(let i = 0; i < StaticGameData.Phases.length; i++) {
                let phase = StaticGameData.Phases[i];
                let deck = this.decks[phase];
                if(collection === deck) {
                    switch(phase) {
                    case Card.types.WORKER:
                        return Card.locations.DECK_WORKER;
                    case Card.types.BUILDING:
                        return Card.locations.DECK_BUILDING;
                    case Card.types.ARISTOCRAT:
                        return Card.locations.DECK_ARISTOCRAT;
                    case Card.types.UPGRADE:
                        return Card.locations.DECK_UPGRADE;
                    }
                }
            }
            throw new Error("Unknown collection: " + collection.toString());
        }
    };

    /**
     * Current player wants to buy selected card
     * @param {Card} card Card object
     * @param {Array} collection Collection to draw from
     * @returns {boolean}
     */
    this.buyCard = function (card, collection) {
        const player = this.getCurrentPlayer();

        const cost = this.getCardCost(card, collection);

        if (card.type === Card.types.UPGRADE) {
            const cardsToUpgrade = player.cards.filter(function (baseCard) {
                return baseCard.canUpgradeTo(card);
            });
            if (cardsToUpgrade.length === 0) {
                alert("no cards to upgrade to this card");
                return false;
            }

            if (player.isHuman) {
                $scope.openUpgradeModal(card, collection, this);
                return;
            } else {
                throw new Error("AI should never pick an upgrade card to buy. AI should return UPGRADE code with upgrade card instead");
            }
        } else {
            if (cost > player.money) {
                Console.log("Player " + player.name + " cannot afford " + card.name + " with calculated cost " + cost);
                if(player.isHuman) {
                    alert("Player " + player.name + " cannot afford " + card.name + " with calculated cost " + cost);
                }
                return false;
            }
        }

        // record this action
        let locationName = this.getLocationFromCollection(collection);
        this.actions.push(new Move(
            Move.actions.BUY,
            locationName,
            card
        ));

        // pay for the card
        player.money -= cost;
        if (player.money < 0) {
            Console.error("ERROR: money for player " + player.name + " has gone negative after buying card " + card.name + " for " + cost + " coins");
            alert("ERROR");
        }

        // add card to player collection
        player.cards.push(card);

        // remove card from previous collection
        if (collection) {
            const i = collection.indexOf(card);
            collection.splice(i, 1);
        }
        Console.log("Player " + player.name + " bought " + card.name + " for " + cost);

        this.sortPlayerCards(player);
        // reset consecutive passes
        this.consecutivePasses = 0;

        // successful buy means next turn
        this.nextTurn();
        return true;
    };

    /**
     *
     * @param {Card} card
     * @param {Player} player
     */
    this.playCardFromHand = function (card, player) {
        if (player !== this.players[this.turn]) {
            Console.log("Can only play cards on your turn");
            return false;
        }

        this.buyCard(card, player.hand);
    };

    /**
     * Assume upper cards from last round moved to lower row
     */
    this.dealCards = function () {
        let card, numCards = (2 * this.players.length) - this.lowerBoard.length;
        for (let i = 0; i < numCards && this.decks[this.phase].length > 0; i++) {
            card = this.decks[this.phase].pop();
            this.upperBoard.push(card);
        }

        // sort these cards based on cost, with the first being the cheapest
        this.upperBoard.sort(function (a, b) {
            return a.cost - b.cost;
        });

        if (this.decks[this.phase].length === 0 && !this.lastRound) {
            Console.log("No more cards in deck " + this.getPhaseName() + " which means this is the last round");
            alert("Warning: " + this.getPhaseName() + " deck is exhausted. This is the last round.");
            this.lastRound = true;
        }
    };

    /**
     *
     * @param {Card.types | null} phase
     * @returns {String}
     */
    this.getPhaseName = function (phase) {
        phase = Number(phase) || this.phase;
        return StaticGameData.getPhaseName(phase);
    };

    /**
     * Return the action that the AI should take
     * @param {Player} currentPlayer
     * @returns {any} An object with at least the following properties:
     *      - move: best move to take
     *      - moveList: the plan for this AI
     */
    this._getRobotAction = function(currentPlayer) {
        const deckSizes = [];
        for (let i = 0; i < StaticGameData.Phases.length; i++) {
            deckSizes.push( this.decks[StaticGameData.Phases[i]].length );
        }
        // create the state out of current game state
        const state = new State(deckSizes, this.upperBoard, this.lowerBoard,
            this.phase, this.players, this.turn, this.consecutivePasses);
        const obj = AI.analyze(state, currentPlayer.name);
        this._printRobotPlan(currentPlayer, obj);
        return obj;
    };

    /**
     * Print the AI's plan to the console
     * @param {Player} currentPlayer
     * @param {any} obj             The output of AI.analyze
     */
    this._printRobotPlan = function(currentPlayer, obj) {
        // print plan
        Console.log("Plan for " + currentPlayer.name + ":");
        for (let i = 0; i < obj.moveList.length; i++) {
            Console.log(`${i + 1}. ${obj.moveList[i].toString()}`);
        }
        Console.log(`${currentPlayer.name} estimates this plan to result in a final score of ${obj.score} points`);
    };

    this.doRobotAction = function () {
        // update UI action
        this.aiIsWorking = true;

        const inner = () => {
            const player = this.getCurrentPlayer();
            if (!player.isHuman) {
                const locationMap = {};
                let obj = this._getRobotAction(player);
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
                    default:
                        throw new Error("Unknown move specified by AI: " + obj.move);
                    }
                } else {
                    Console.log("nothing to be done");
                    this.passTurn();
                }
            } else {
                Console.warn("Cannot call doRobotAction on a human player");
            }
            this.aiIsWorking = false;
        };
        $timeout(inner, 0);
    };

    /**
     *
     * @param {Card.types} phase
     * @returns {boolean}
     */
    this.isCurrentPhase = function (phase) {
        return phase === this.phase;
    };

    this.init();
});

/**
 * Controls the modal which opens on card upgrade
 */
StPeter.controller("ModalInstanceCtrl", function ($scope, $uibModalInstance, baseCards, upgradeCard, costMap) {
    "use strict";
    $scope.upgradableCards = baseCards;
    $scope.upgradeCard = upgradeCard;
    $scope.costMap = costMap;
    $scope.selected = {
        card: $scope.upgradableCards[0]
    };

    $scope.ok = function () {
        $uibModalInstance.close($scope.selected.card);
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss("cancel");
    };

    $scope.getCost = function (card) {
        return $scope.costMap[card.name];
    };

    $scope.getCardString = function (card) {
        return card.name + " (" + $scope.getCost(card) + ")";
    };
});

StPeter.controller("PlayerNameInstanceCtrl", function($scope, $uibModalInstance) {
    $scope.name = "";

    $scope.ok = function() {
        $uibModalInstance.close($scope.name);
    };
});

/**
 * Controls the modal which opens on observatory play
 */
StPeter.controller("ObservatoryModalInstanceCtrl", function ($scope, $uibModalInstance, phases) {
    $scope.phases = phases;
    $scope.selected = {
        deck: $scope.phases[0]
    };

    $scope.ok = function () {
        $uibModalInstance.close($scope.selected.deck);
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss("cancel");
    };
});

/**
 * Controls the modal which opens as the second stage of observatory play
 */
StPeter.controller("PeekingModalInstanceCtrl", function ($scope, $uibModalInstance, peekCard, cardCost, options) {
    $scope.options = options;
    $scope.peekCard = peekCard;
    $scope.cardCost = cardCost;
    $scope.selected = {
        option: $scope.options[0]
    };

    $scope.ok = function () {
        $uibModalInstance.close($scope.selected.option);
    };
});

/**
 * @param {Player} player
 */
StPeter.controller("PubModalInstanceCtrl", function($scope, $uibModalInstance, player) {
    // @type {Player}
    $scope.player = player;
    // @type {Number}
    $scope.selectedMoney = 0;

    /**
     * @returns {Number}
     */
    $scope.getConversionPoints = function() {
        return Math.floor($scope.selectedMoney / 2);
    };

    /**
     * Returns the number of coins to trade
     */
    $scope.ok = function() {
        $uibModalInstance.close($scope.selectedMoney);
    };

    $scope.cancel = function() {
        $uibModalInstance.dismiss("cancel");
    };
});