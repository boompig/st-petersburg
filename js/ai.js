// @flow

import { allCards, Card } from "./cards";
import { Player } from "./players";
import { aristocratScoringChart, gamePhases } from "./static-game-data";
import { State } from "./game-state";
import { Move } from "./game-action";

/**
 * Helpful polyfills
 */

Array.prototype.min = function () {
    return Math.min.apply(null, this);
};




var AI = {};

/**
 * Generate the state in the next phase if player passes in this phase
 * TODO for now do these things:
 *      - take 8 cards off from next deck
 *      - assume upper board now blank
 *      - score cards from this phase
 *      - move to next phase
 *      - move cards from upper board to lower board
 *      - discard lower board
 */
AI.generateNextPhaseState = function (state: State) {
    var newState = state.clone();
    var player = newState.player;
    var i, card;

    // take 8 cards off next deck
    var currentDeckIndex = State.phases.indexOf(state.phase);
    var nextDeckIndex = (currentDeckIndex + 1) % State.phases.length;
    newState.decks[nextDeckIndex] -= Math.min(8, newState.decks[nextDeckIndex])

    // eval state by adding points and money for each card in player's cards
    // which corresponds to current state
    for (i = 0; i < player.cards.length; i++) {
        card = player.cards[i];
        if (card.canEvalNow(state.phase)) {
            player.points += card.pointYield;
            player.money += card.coinYield;
        }
    }

    // put the whole upper board onto the lower board
    newState.lowerBoard = newState.upperBoard;
    // empty the upper board
    newState.upperBoard = [];

    // move to next phase
    newState.phase = State.phases[nextDeckIndex];

    return newState;
};

/**
 * Generate successors is a generator over objects of the following form:
 *      { state: <State>, move: <Move> }
 */
AI.generateSuccessors = function genSuccessors (state: State) {
    var player = state.player;
    var successors = [];
    var i, card, newState;

    if (state.hasNextPhase()) {
        var nextPhaseState = AI.generateNextPhaseState(state);
        // pass and go to next round
        successors.push({
            "state": nextPhaseState,
            "move": new Move(Move.actions.PASS, null, null)
        });
    }

    for (i = 0; i < player.hand.length; i++) {
        card = player.hand[i];
        if (card.type === Card.types.UPGRADE) {
            for (var j = 0; j < player.cards.length; j++) {
                if (player.canUpgradeCard(player.cards[j], card)) {
                    newState = state.clone();
                    newState.player.hand.splice(i, 1);
                    newState.player.upgradeCard(player.cards[j], card,
                            Card.locations.HAND);
                    var move = new Move(Move.actions.UPGRADE, Card.locations.HAND,
                            card, player.cards[j]);
                    successors.push({
                        "state": newState,
                        "move": move
                    });
                }
            }
        } else {
            // try buy card in hand
            if (player.canAffordCard(card, Card.locations.HAND)) {
                newState = state.clone();
                newState.player.playCardFromHand(card);
                successors.push({
                    "state": newState,
                    "move": new Move(Move.actions.BUY, Card.locations.HAND, card)
                });
            }
        }
    }

    for (i = 0; i < state.upperBoard.length; i++) {
        card = state.upperBoard[i];
        if (card.type === Card.types.UPGRADE) {
            for (var j = 0; j < player.cards.length; j++) {
                if (player.canUpgradeCard(player.cards[j], card)) {
                    newState = state.clone();
                    newState.upperBoard.splice(i, 1);
                    newState.player.upgradeCard(player.cards[j], card,
                            Card.locations.UPPER_BOARD);
                    var move = new Move(Move.actions.UPGRADE, Card.locations.UPPER_BOARD,
                            card, player.cards[j]);
                    successors.push({
                        "state": newState,
                        "move": move
                    });
                }
            }
        } else {
            // try buy card
            if (player.canAffordCard(card, Card.locations.UPPER_BOARD)) {
                newState = state.clone();
                newState.upperBoard.splice(i, 1);
                newState.player.buyCard(card, Card.locations.UPPER_BOARD);
                successors.push({
                    "state": newState,
                    "move": new Move(Move.actions.BUY, Card.locations.UPPER_BOARD, card)
                });
            }
        }
        // try take card into hand
        if (player.canPutCardInHand()) {
            newState = state.clone();
            newState.upperBoard.splice(i, 1);
            newState.player.putCardInHand(card);
            successors.push({
                "state": newState,
                "move": new Move(Move.actions.PUT_IN_HAND, Card.locations.UPPER_BOARD, card)
            });
        }
    }

    for (i = 0; i < state.lowerBoard.length; i++) {
        card = state.lowerBoard[i];
        // try buy card
        if (card.type === Card.types.UPGRADE) {
            for (var j = 0; j < player.cards.length; j++) {
                if (player.canUpgradeCard(player.cards[j], card)) {
                    newState = state.clone();
                    newState.lowerBoard.splice(i, 1);
                    newState.player.upgradeCard(player.cards[j], card,
                            Card.locations.LOWER_BOARD);
                    var move = new Move(Move.actions.UPGRADE, Card.locations.LOWER_BOARD,
                            card, player.cards[j]);
                    successors.push({
                        "state": newState,
                        "move": move
                    });
                }
            }
        } else {
            if (player.canAffordCard(card, Card.locations.LOWER_BOARD)) {
                newState = state.clone();
                newState.lowerBoard.splice(i, 1);
                newState.player.buyCard(card, Card.locations.LOWER_BOARD);
                successors.push({
                    "state": newState,
                    "move": new Move(Move.actions.BUY, Card.locations.LOWER_BOARD, card)
                });
            }
        }
        // try take card into hand
        if (player.canPutCardInHand()) {
            newState = state.clone();
            newState.lowerBoard.splice(i, 1);
            newState.player.putCardInHand(card);
            successors.push({
                "state": newState,
                "move": new Move(Move.actions.PUT_IN_HAND, Card.locations.LOWER_BOARD, card)
            });
        }
    }
    return successors;
};

AI.numTurnsLeftInGame = function (state: State) {
    var minDeck = state.decks.min();
    return Math.ceil(minDeck / 8);
};

AI.nextPhase = function (phase: number /* one of Card.types */) {
    var idx = State.phases.indexOf(phase);
    return State.phases[(idx + 1) % State.phases.length];
};

AI.countAristocrats = function (player) {
    var n = 0;
    var counted = new Set();
    for (var i = 0; i < player.cards.length; i++) {
        if (player.cards[i].type === Card.types.ARISTOCRAT &&
            !counted.has(player.cards[i].hash())) {
            n++;
            counted.add(player.cards[i].hash());
        }
    }
    return Math.min(n, 10);
};

AI.estimateEvalState = function (state) {
    var player = state.player;
    if (player.cards.length === 0 && player.hand.length === 0 &&
        state.upperBoard.length === 0 && state.lowerBoard.length === 0) {
        return player.money / 10;
    } else if (state.upperBoard.length === 0 && state.lowerBoard.length === 0) {
        var currentPoints = player.points;
        // add up the points that I have in hand + cards
        var potentialPoints = 0;
        var numArr = 0;
        for (var i = 0; i < player.hand.length; i++) {
            potentialPoints += player.hand[i].pointYield;
            if (player.hand[i].type === Card.types.ARISTOCRAT)
                numArr++;
        }
        for (var i = 0; i < player.cards.length; i++) {
            potentialPoints += player.cards[i].pointYield;
            if (player.cards[i].type === Card.types.ARISTOCRAT)
                numArr++;
        }
        numArr = Math.min(numArr, 10);
        potentialPoints *= (AI.numTurnsLeftInGame(state) + 1);
        return currentPoints + potentialPoints + player.money / 10 +
            aristocratScoringChart[numArr];
    } else {
        return 5000;
    }
};

AI.isTerminalState = function (state) {
    return (! state.hasNextPhase());
};

/**
 * Return the number of points the player would get if the game ended right now
 * TODO for now do these things:
 *      - score all the phases which have not been scored
 *      - take off points for cards in hand
 *      - 1 full point for each 10 money (but just dividing by 10 to give bias to more money)
 * TODO does not count aristocrats
 */
AI.evalState = function (initialState: State) {
    var state = initialState;
    // evaluate all phases until upgrade
    while (state.phase !== Card.types.UPGRADE) {
        state = AI.generateNextPhaseState(state);
    }

    var player = state.player;
    var p = player.points;
    var numArr = AI.countAristocrats(player);
    return p - (player.hand.length * 5) + (player.money / 10) + aristocratScoringChart[numArr];
};

AI.hashState = function (state: State) {
    var hash = [];
    // game state
    hash.push( state.decks.join(",") );
    hash.push( "T" + state.phase );

    // player state
    var player = state.player;
    // hash points
    hash.push( "P" + player.points );
    hash.push( "C" + player.money );
    var cardNames = [];
    for (var i = 0; i < player.cards.length; i++) {
        cardNames.push(player.cards[i].name);
        //cardNames.push(player.cards[i].hash());
    }
    cardNames.sort();
    hash.push( cardNames.join("") );
    var handNames = [];
    for (var i = 0; i < player.hand.length; i++) {
        handNames.push(player.hand[i].name);
        //handNames.push(player.hand[i].hash());
    }
    handNames.sort();
    hash.push( "H" + handNames.join("") );
    return hash.join("");
};

interface IAnalyzeReturn {
    score: number;
    move: Move;
    moveList: Array<Move>;
    numNodes: number;
}

AI.BFS = function (startState: State): IAnalyzeReturn {
    "use strict";
    var open = [{ "state": startState, "moveList": [] }];
    var obj, moveList, state, newMoveList, score, hashState;
    var bestScore = 0;
    var bestMoveList = null;
    var visited = new Set();

    while (open.length > 0) {
        obj = open.splice(0, 1)[0];
        moveList = obj.moveList;
        state = obj.state;
        if (AI.isTerminalState(state)) {
            // stop
            score = AI.evalState(state);
            if (score > bestScore) {
                bestScore = score;
                bestMoveList = moveList;
            }
        }
        // good, expand the state into successors
        var successors = AI.generateSuccessors(state);
        for (var i = 0; i < successors.length; i++) {
            hashState = AI.hashState(successors[i].state);
            if (AI.estimateEvalState(successors[i].state) <= bestScore) {
                // you suck, don't add to open
            } else if (visited.has(hashState)) {
                // already visited
            } else {
                visited.add(hashState);
                newMoveList = moveList.slice();
                newMoveList.push(successors[i].move);
                open.push({
                    "state": successors[i].state,
                    "moveList": newMoveList
                });
            }
        }
    }

    if (bestMoveList === null) {
        bestMoveList = [ new Move(Move.actions.PASS,
            Card.locations.HAND, // assign something, easier than dealing with null checks everywhere
            allCards[0] // assign something, easier than dealing with null checks everywhere
            ) ];
    }
    return {
        "score": bestScore,
        "move": bestMoveList[0],
        "moveList": bestMoveList,
        "numNodes": visited.size,
    };
};

/**
 * Return the best move
 */
AI.analyze = function (state: State): IAnalyzeReturn {
    return AI.BFS(state);
};

AI.pickObservationDeck = function(player: Player) {
    return null;
};

AI.pickObservationAction = function(player: Player, card: Card) {
    return null;
};

AI.pickUpgradeCard = function (player: Player,
    card: Card) {
    // TODO this should take as a parameter the AI's computed plan,
    // since this is always called after the AI has initiated the plan
    var validCards = [];
    // TODO for now pick a card to upgrade
    for (var i = 0; i < player.cards.length; i++) {
        if (player.cards[i].canUpgradeTo(card)) {
            validCards.push( player.cards[i] );
        }
    }

    if (validCards.length === 0) {
        return null;
    } else {
        return validCards[Math.floor(Math.random() * validCards.length)];
    }
};

export { State, Player, AI, Move };

