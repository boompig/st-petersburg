import { Card } from "../js/cards.js";

/**
 * A player, as represented in a normal St. Petersburg game
 * No custom modifications have been made to distinguish between AI and human
 *
 * @param {String} name
 * @param {number} token One of Card.types
 * @param {boolean} isHuman
 */
export class Player {
    constructor(name, token, isHuman) {
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
     * @returns {Array<Card>}
     */
    getUniqueCards() {
        const seenCards = new Set();
        const uniqueCards = [];
        for(let card of this.cards) {
            if(!seenCards.has(card.name)) {
                seenCards.add(card.name);
                uniqueCards.push(card);
            }
        }
        return uniqueCards;
    }

    /**
     * @returns {number}
     */
    numUniqueAristocrats() {
        const aristocratNames = this.cards.filter((card) => {
            return (card.type === Card.types.ARISTOCRAT || card.upgradeType === Card.types.ARISTOCRAT);
        }).map((card) => card.name);
        const uniqueNames = new Set(aristocratNames);
        return uniqueNames.size;
    }

    /**
     * TODO very inefficient, try something else
     * @param {String} cardName
     * @returns {boolean}
     */
    hasCard (cardName) {
        const matchingCards = this.cards.filter(function (card) {
            return card.name === cardName;
        });
        return matchingCards.length > 0;
    }

    /**
     * Return true iff this player has a card which makes the given card cheaper to buy
     * By this it means special worker cards
     * @param {Card} card
     * @returns {boolean}
     */
    hasDiscountForCard (card) {
        if (card.type === Card.types.ARISTOCRAT || (card.type === Card.types.UPGRADE && card.upgradeType === Card.types.ARISTOCRAT)) {
            return this.hasCard("Gold Smelter");
        } else if (card.type === Card.types.BUILDING || (card.type === Card.types.UPGRADE && card.upgradeType === Card.types.BUILDING)) {
            return this.hasCard("Carpenter");
        } else {
            return false;
        }
    }

    /**
     * @returns {Player}
     */
    clone () {
        const p = new Player();
        p.hand = this.hand.slice();
        p.cards = this.cards.slice();
        p.points = this.points;
        p.money = this.money;
        return p;
    }

    /**
     * Compute the cost of the card for this player
     * NOTE: cost is not calculated for upgrades
     * @param {Card} card
     * @param {Card.locations} location
     * @returns {number}
     */
    getCardCost (card, location) {
        // compute card cost wrt location
        let cost = card.getCost(location);
        // compute card cost wrt cards already owned with same name
        const similarCards = this.cards.filter(function (otherCard) {
            return otherCard.name === card.name;
        });
        // console.log("Reduce cost by " + similarCards.length + " as player has that many instances of the card already");
        cost -= similarCards.length;

        if(this.hasDiscountForCard(card)) {
            cost--;
            // console.log("Reduce cost by 1, as player has discount card relevant to this card");
        }

        return Math.max(cost, 1);
    }

    /**
     * Return true iff the player can afford the card
     * If the card is an upgrade card, return true iff the player
     * has at least 1 card which can upgrade to this card, and player can pay the difference
     * @param {Card} card
     * @param {Card.types} location
     * @returns {boolean}
     */
    canAffordCard (card, location) {
        if (card.type === Card.types.UPGRADE) {
            const cost = this.getCardCost(card, location);
            const validCards = this.cards.filter(function (baseCard) {
                return baseCard.canUpgradeTo(card);
            });
            let diff;
            for (let i = 0; i < validCards.length; i++) {
                diff = Math.max(1, cost - validCards[i].upgradeCost);
                if (diff <= this.money) {
                    return true;
                }
            }
            return false;
        } else {
            return this.getCardCost(card, location) <= this.money;
        }
    }

    /**
     * @returns {number}
     */
    getMaxHandSize () {
        if (this.hasCard("Warehouse")) {
            return 4;
        } else {
            return 3;
        }
    }

    /**
     * @returns {boolean}
     */
    canPutCardInHand () {
        return this.hand.length < this.getMaxHandSize();
    }

    /**
     *
     * @param {Card} card
     * @param {Card.types} location
     * @returns {boolean}
     */
    buyCard (card, location) {
        if (this.canAffordCard(card, location)) {
            // must calculate cost before adding to list of cards
            this.money -= this.getCardCost(card, location);
            this.cards.push(card);
            return true;
        } else {
            return false;
        }
    }

    /**
     *
     * @param {Card} baseCard
     * @param {Card} upgradeCard
     * @param {Card.locations} location
     * @returns {number}
     */
    getUpgradeCost (baseCard, upgradeCard, location) {
        const cost = this.getCardCost(upgradeCard, location);
        return Math.max(cost - baseCard.upgradeCost, 1);
    }

    /**
     *
     * @param {Card} baseCard
     * @param {Card} upgradeCard
     * @param {Card.locations} location
     * @returns {boolean}
     */
    canUpgradeCard (baseCard, upgradeCard, location) {
        return baseCard.canUpgradeTo(upgradeCard) &&
            this.getUpgradeCost(baseCard, upgradeCard, location) <= this.money;
    }

    /**
     *
     * @param {Card} baseCard
     * @param {Card} upgradeCard
     * @param {Card.locations} location
     * @returns {boolean}
     */
    upgradeCard (baseCard, upgradeCard, location) {
        if (this.canUpgradeCard(baseCard, upgradeCard, location)) {
            const diff = this.getUpgradeCost(baseCard, upgradeCard, location);
            this.money -= diff;
            const idx = this.cards.indexOf(baseCard);
            this.cards.splice(idx, 1, upgradeCard);
            return true;
        } else {
            return false;
        }
    }

    /**
     *
     * @param {Card} card
     */
    putCardInHand (card) {
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
     * @param {Card} card
     */
    playCardFromHand (card) {
        let i = this.hand.indexOf(card);
        if (i >= 0) {
            const result = this.buyCard(card, Card.locations.HAND);
            if (result) {
                this.hand.splice(i, 1);
            }
        } else {
            return false;
        }
    }
}