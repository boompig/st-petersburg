// @flow

import { Card } from "./cards";
import { Player } from "./player";

/**
 * The game state which I plan to pass to the AI
 */
class State {
    upperBoard: Array<Card>;
    lowerBoard: Array<Card>;
    decks: Array<Array<Card>>;
    phase: number;
    player: Player;

    constructor(decks: Array<Array<Card>>,
        upperBoard: Array<Card>,
        lowerBoard: Array<Card>,
        phase: number, /* one of Card.types */
        player: Player) {
        // game state
        this.decks = decks;

        this.upperBoard = upperBoard;
        this.lowerBoard = lowerBoard;

        this.phase = phase;

        // player state
        this.player = player;
    }

    getPhaseName(): string {
        switch (this.phase) {
            case Card.types.WORKER:
                return "WORKER";
            case Card.types.BUILDING:
                return "BUILDING";
            case Card.types.ARISTOCRAT:
                return "ARISTOCRAT";
            case Card.types.UPGRADE:
                return "UPGRADE";
            default:
                throw new Error("Unknown phase: " + this.phase);
        }
    }

    toString(): string {
        var cardNames = [];
        for (var i = 0; i < this.player.cards.length; i++) {
            cardNames.push(this.player.cards[i].name);
        }
        var handNames = [];
        for (var i = 0; i < this.player.hand.length; i++) {
            handNames.push(this.player.hand[i].name);
        }
        var upperCards = [];
        for (var i = 0; i < this.upperBoard.length; i++) {
            upperCards.push(this.upperBoard[i].name);
        }
        var lowerCards = [];
        for (var i = 0; i < this.lowerBoard.length; i++) {
            lowerCards.push(this.lowerBoard[i].name);
        }

        return "State(phase=" + this.getPhaseName() + "," +
            "decks=[" + this.decks.join(", ") + "]," +
            "upperBoard=[" + upperCards.join(", ") + "]," +
            "lowerBoard=[" + lowerCards.join(", ") + "]," +
            "cards=[" + cardNames.join(", ") + "]," +
            "hand=[" + handNames.join(", ") + "]," +
            "points=" + this.player.points + ")";
    }

    clone(): State {
        var deck = this.decks.slice();
        var lowerBoard = this.lowerBoard.slice();
        var upperBoard = this.upperBoard.slice();
        var player = this.player.clone();
        var phase = this.phase;
        return new State(deck, upperBoard, lowerBoard, phase, player);
    }

    hasNextPhase(): boolean {
        return this.phase !== Card.types.UPGRADE || this.hasNextRound();
    }

    /**
     * Return true iff state can deal a next round
     */
    hasNextRound(): boolean {
        return this.decks.min() > 0;
    }
}

export { State };