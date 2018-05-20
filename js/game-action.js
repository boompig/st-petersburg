// @flow

class Move {
    action: number;
    card: Card;
    location: number;
    baseCard: (Card | null);

    constructor(action: number, /* one of Move.actions */
        location: number, /* one of Card.locations */
        card: Card,
        baseCard: (Card | null)) {
        this.action = action;
        this.location = location;
        this.card = card;
        // this is only set for the UPGRADE action
        this.baseCard = baseCard || null;
    }

    getActionName(): string {
        switch (this.action) {
            case Move.actions.PASS:
                return "PASS";
            case Move.actions.BUY:
                return "BUY";
            case Move.actions.PUT_IN_HAND:
                return "PUT_IN_HAND";
            case Move.actions.UPGRADE:
                return "UPGRADE";
            default:
                throw new Error("Unknown action " + this.action);
        }
    }

    getLocationName(): string {
        switch (this.location) {
            case Card.locations.HAND:
                return "HAND";
            case Card.locations.UPPER_BOARD:
                return "UPPER_BOARD";
            case Card.locations.LOWER_BOARD:
                return "LOWER_BOARD";
            default:
                throw new Error("Unknown location: " + this.location);
        }
    }

    toString(): string {
        if (this.baseCard) {
            return "Move (action=" + this.getActionName() + 
                ", location=" + this.getLocationName() +
                ", card=" + this.card.name +
                ", baseCard=" + this.baseCard.name + ")";
        } else if (this.card && this.location) {
            return "Move (action=" + this.getActionName() + 
                ", location=" + this.getLocationName() +
                ", card=" + this.card.name + ")";
        } else {
            return "Move (action=" + this.getActionName() + ")";
        }
    }

    equals(otherMove: Move): boolean {
        return this.action === otherMove.action &&
                this.location === otherMove.location &&
                ((this.card === null && otherMove.card === null) ||
                 (this.card.name === otherMove.card.name)) &&
                ((this.baseCard === null && otherMove.baseCard === null) ||
                 (this.baseCard === otherMove.baseCard));
    }
}

Move.actions = {
    PASS: 1,
    BUY: 2,
    PUT_IN_HAND: 3,
    UPGRADE: 4
};

export { Move };