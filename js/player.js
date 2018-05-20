// @flow

import { Card } from "./cards";

class Player {
    cards: Array<Card>;
    hand: Array<Card>;
    points: number;
    money: number;
    name: string;
    isHuman: boolean;
    token: (number | null);

    /**
     * A player, as represented in a normal St. Petersburg game
     * No custom modifications have been made to distinguish between AI and human
     */
    constructor(name: string,
        token: number, /* one of Card.types */
        isHuman: boolean) {
        // game state stuff
        this.hand = [];
        this.cards = [];
        this.points = 0;
        // start with 25 money
        this.money = 25;
        this.token = token || null;

        // display stuff
        this.name = name;
        this.isHuman = isHuman;
    }

    /**
     * TODO very inefficient, try something else
     */
    hasCard(cardName: string): boolean {
        var matchingCards = this.cards.filter(function (card) {
            return card.name === cardName;
        });
        return matchingCards.length > 0;
    }

    /**
     * Return true iff this player has a card which makes the given card cheaper to buy
     * By this it means special worker cards
     */
    hasDiscountForCard(card: Card): boolean {
        if (card.type === Card.types.ARISTOCRAT || (card.type === Card.types.UPGRADE && card.upgradeType === Card.types.ARISTOCRAT)) {
            return this.hasCard("Gold Smelter");
        } else if (card.type === Card.types.BUILDING || (card.type === Card.types.UPGRADE && card.upgradeType === Card.types.BUILDING)) {
            return this.hasCard("Carpenter");
        } else {
            return false;
        }
    };

    clone(): Player {
        const p = new Player(
            // used by AI only so this field doesn't matter
            '', // name
            this.token, // token
            false // isHuman
        );
        p.hand = this.hand.slice();
        p.cards = this.cards.slice();
        p.points = this.points;
        p.money = this.money;
        return p;
    }

    /**
     * Compute the cost of the card
     * TODO: cost is not properly calculated for upgrades, and doesn't use discount cards
     */
    getCardCost(card: Card,
        location: number /* one of Card.locations */): number {
        var cost = card.getCost(location);
        for (var i = 0; i < this.cards.length; i++) {
            if (this.cards[i].type === card.type && this.cards[i].index === card.index) {
                cost--;
            }
        }
        return Math.max(cost, 1);
    }

    /**
     * Return true iff the player can afford the card
     * If the card is an upgrade card, return true iff the player
     * has at least 1 card which can upgrade to this card, and player can pay the difference
     */
    canAffordCard(card: Card, location: number): boolean {
        if (card.type === Card.types.UPGRADE) {
            var cost = this.getCardCost(card, location);
            var validCards = this.cards.filter(function (baseCard) {
                return baseCard.canUpgradeTo(card);
            });
            var diff, i;
            for (var i = 0; i < validCards.length; i++) {
                diff = Math.max(1, cost - validCards[i].upgradeCost);
                if (diff <= this.money) {
                    return true;
                }
            }
            return false;
        } else {
            return this.getCardCost(card, location) <= this.money;
        }
    };

    getMaxHandSize(): number {
        if (this.hasCard("Warehouse")) {
            return 4;
        } else {
            return 3;
        }
    }

    canPutCardInHand(): boolean {
        return this.hand.length < this.getMaxHandSize();
    }

    buyCard(card: Card, location: number) {
        if (this.canAffordCard(card, location)) {
            // must calculate cost before adding to list of cards
            this.money -= this.getCardCost(card, location);
            this.cards.push(card);
            return true;
        } else {
            return false;
        }
    }

    getUpgradeCost(baseCard, upgradeCard, location) {
        var cost = this.getCardCost(upgradeCard, location);
        return Math.max(cost - baseCard.upgradeCost, 1);
    };

    canUpgradeCard(baseCard, upgradeCard, location) {
        return baseCard.canUpgradeTo(upgradeCard) &&
            this.getUpgradeCost(baseCard, upgradeCard, location) <= this.money;
    };

	upgradeCard(baseCard, upgradeCard, location) {
        if (this.canUpgradeCard(baseCard, upgradeCard, location)) {
            var diff = this.getUpgradeCost(baseCard, upgradeCard, location);
            this.money -= diff;
            var idx = this.cards.indexOf(baseCard);
            this.cards.splice(idx, 1, upgradeCard);
            return true;
        } else {
            return false;
        }
    }

    	putCardInHand(card) {
            if (this.canPutCardInHand()) {
                this.hand.push(card);
                return true;
            } else {
                return false;
            }
        }

    /**
     * Play the given card from the player's hand
     * Return true if successful, false otherwise
     * On success, remove the card from player's hand
     */
	playCardFromHand(card) {
        var i = this.hand.indexOf(card);
        if (i >= 0) {
            var result = this.buyCard(card, Card.locations.HAND);
            if (result) {
                this.hand.splice(i, 1);
            }
        } else {
            return false;
        }
    }
}

export { Player };
