/**
 * Upgrade type means ARISTOCRAT, WORKER, BUILDING
 * upgrade class is only relevant for workers
 */
function Card (name, cost, type, coin_yield, point_yield, index, kwargs) {
    this.name = name;
    this.cost = cost;
    this.type = type;
    this.coinYield = coin_yield;
    this.pointYield = point_yield;
    this.upgradeType = type;
    this.index = index;

    // have default settings, can be reset via kwargs
    this.workerUpgradeClass = null;
    this.upgradeCost = this.cost;
    this.bonusYieldClass = null;
	this.bonusYieldType = null;
    this.discountClass = null;
    this.isPlayable = false;
    // true iff this card has been played this round, does not apply to non-playable cards
    this.played = false;

    if (kwargs) {
        for (var property in kwargs) {
            if (this.hasOwnProperty(property)) {
                console.log("Set " + property + " to value " + kwargs[property] + " for card " + name);
                this[property] = kwargs[property];
            }
        }
    }
}

Card.types = {
    WORKER: 1,
    BUILDING: 2,
    ARISTOCRAT: 3,
    UPGRADE: 4
};

Card.locations = {
    HAND: 1,
    UPPER_BOARD: 2,
    LOWER_BOARD: 3,
};

Card.prototype.hash = function () {
    return this.type * 100 + this.index;
};

/**
 * TODO do not use this
 * Return the cost of the card, before factoring in other cards of same type,
 * as well as discount cards
 */
Card.prototype.getCost = function (location) {
    if (location === Card.locations.LOWER_BOARD) {
        return Math.max(this.cost - 1, 1);
    } else {
        return this.cost;
    }
};

Card.prototype.canEvalNow = function (phase) {
    return this.upgradeType === phase;
};

/**
 * Return true iff can upgrade current card to the target card.
 */
Card.prototype.canUpgradeTo = function (upgradeCard) {
    if (this.type === Card.types.WORKER) {
        return upgradeCard.type === Card.types.UPGRADE &&
            this.upgradeType === upgradeCard.upgradeType &&
            (this.workerUpgradeClass === upgradeCard.workerUpgradeClass ||
             this.workerUpgradeClass === "CZAR_AND_CARPENTER");
    } else {
        return upgradeCard.type === Card.types.UPGRADE && this.type !== Card.types.UPGRADE && this.upgradeType === upgradeCard.upgradeType;
    }
};

/***** cards ****/

// peasants
var allCards = [
    new Card("Lumberjack", 3, Card.types.WORKER, 3, 0, 1, {"workerUpgradeClass": "LUMBERJACK"}),
    new Card("Gold Miner", 4, Card.types.WORKER, 3, 0, 2, {"workerUpgradeClass": "GOLD_MINER"}),
    new Card("Shepherd", 5, Card.types.WORKER, 3, 0, 3, {"workerUpgradeClass": "SHEPHERD"}),
    new Card("Fur Trapper", 6, Card.types.WORKER, 3, 0, 4, {"workerUpgradeClass": "FUR_TRAPPER"}),
    new Card("Ship Builder", 7, Card.types.WORKER, 3, 0, 5, {"workerUpgradeClass": "SHIP_BUILDER"}),
    new Card("Czar and Carpenter", 8, Card.types.WORKER, 3, 0, 6, {"workerUpgradeClass": "CZAR_AND_CARPENTER"}),

    new Card("Market", 5, Card.types.BUILDING, 0, 1, 1),
    new Card("Customs House", 8, Card.types.BUILDING, 0, 2, 2),
    new Card("Firehouse", 11, Card.types.BUILDING, 0, 3, 3),
    new Card("Hospital", 14, Card.types.BUILDING, 0, 4, 4),
    new Card("Library", 17, Card.types.BUILDING, 0, 5, 5),
    new Card("Theatre", 20, Card.types.BUILDING, 0, 6, 6),
    new Card("Academy", 23, Card.types.BUILDING, 0, 7, 7),
    // referenced by name in code, beware of changing it
    new Card("Warehouse", 2, Card.types.BUILDING, 0, 0, 8),
    new Card("Potjomkin's Village", 2, Card.types.BUILDING, 0, 0, 9, {"upgradeCost": 6}),
    // TODO for now pub does nothing (not implemented)
    new Card("Pub", 1, Card.types.BUILDING, 0, 0, 10),
    // referenced by name in code, beware of changing it
    new Card("Observatory", 6, Card.types.BUILDING, 0, 1, 11, { "isPlayable": true }),

    new Card("Author", 4, Card.types.ARISTOCRAT, 1, 0, 1),
    new Card("Administrator", 7, Card.types.ARISTOCRAT, 2, 0, 2),
    new Card("Warehouse Manager", 10, Card.types.ARISTOCRAT, 3, 0, 3),
    new Card("Secretary", 12, Card.types.ARISTOCRAT, 4, 0, 4),
    new Card("Controller", 14, Card.types.ARISTOCRAT, 4, 1, 5),
    new Card("Judge", 16, Card.types.ARISTOCRAT, 5, 2, 6),
    new Card("Mistress of Ceremonies", 18, Card.types.ARISTOCRAT, 6, 3, 7),

    // referenced by name in code, beware of changing it
    new Card("Carpenter", 4, Card.types.UPGRADE, 3, 0, 1,
        {"upgradeType": Card.types.WORKER, "workerUpgradeClass": "LUMBERJACK", "discountClass": Card.types.BUILDING}),
    // referenced by name in code, beware of changing it
    new Card("Gold Smelter", 6, Card.types.UPGRADE, 3, 0, 2,
        {"upgradeType": Card.types.WORKER, "workerUpgradeClass": "GOLD_MINER", "discountClass": Card.types.ARISTOCRAT}),
    new Card("Weaving Mill", 8, Card.types.UPGRADE, 6, 0, 3,
        {"upgradeType": Card.types.WORKER, "workerUpgradeClass": "SHEPHERD"}),
    new Card("Fur Trader", 10, Card.types.UPGRADE, 3, 2, 4,
        {"upgradeType": Card.types.WORKER, "workerUpgradeClass": "FUR_TRAPPER"}),
    new Card("Wharf", 12, Card.types.UPGRADE, 6, 1, 5,
        {"upgradeType": Card.types.WORKER, "workerUpgradeClass": "SHIP_BUILDER"}),

    new Card("Mariinskij Theatre", 10, Card.types.UPGRADE, 0, 0, 6,
        {"upgradeType": Card.types.BUILDING, "bonusYieldClass": Card.types.ARISTOCRAT, "bonusYieldType": "money"}),
    new Card("Bank", 13, Card.types.UPGRADE, 5, 1, 7,
        {"upgradeType": Card.types.BUILDING}),
    new Card("Peterhof", 14, Card.types.UPGRADE, 4, 2, 8,
        {"upgradeType": Card.types.BUILDING}),
    new Card("St. Isaac's Cathedral", 15, Card.types.UPGRADE, 3, 3, 9,
        {"upgradeType": Card.types.BUILDING}),
    new Card("Church of the Resurrection", 16, Card.types.UPGRADE, 2, 4, 10,
        {"upgradeType": Card.types.BUILDING}),
    new Card("Harbor", 16, Card.types.UPGRADE, 5, 2, 11,
        {"upgradeType": Card.types.BUILDING}),
    new Card("Catherine's Palace", 17, Card.types.UPGRADE, 1, 5, 12,
        {"upgradeType": Card.types.BUILDING}),
    new Card("Smolny Cathedral", 17, Card.types.UPGRADE, 4, 3, 13,
        {"upgradeType": Card.types.BUILDING}),
    new Card("Hermitage", 18, Card.types.UPGRADE, 3, 4, 14,
        {"upgradeType": Card.types.BUILDING}),
    new Card("Winter Palace", 19, Card.types.UPGRADE, 2, 5, 15,
        {"upgradeType": Card.types.BUILDING}),

    new Card("Pope", 6, Card.types.UPGRADE, 1, 1, 16,
        {"upgradeType": Card.types.ARISTOCRAT}),
    new Card("Weapon Master", 8, Card.types.UPGRADE, 4, 0, 17,
        {"upgradeType": Card.types.ARISTOCRAT}),
    new Card("Chamber Maid", 8, Card.types.UPGRADE, 0, 2, 18,
        {"upgradeType": Card.types.ARISTOCRAT}),
    new Card("Builder", 10, Card.types.UPGRADE, 5, 0, 19,
        {"upgradeType": Card.types.ARISTOCRAT}),
    new Card("Senator", 12, Card.types.UPGRADE, 2, 2, 20,
        {"upgradeType": Card.types.ARISTOCRAT}),
    new Card("Patriarch", 16, Card.types.UPGRADE, 0, 4, 21,
        {"upgradeType": Card.types.ARISTOCRAT}),
    new Card("Tax Man", 17, Card.types.UPGRADE, 0, 0, 22,
        {"upgradeType": Card.types.ARISTOCRAT, "bonusYieldClass": Card.types.WORKER, "bonusYieldType": "money"}),
    new Card("Admiral", 18, Card.types.UPGRADE, 3, 3, 23,
        {"upgradeType": Card.types.ARISTOCRAT}),
    new Card("Foreign Minister", 20, Card.types.UPGRADE, 2, 4, 24,
        {"upgradeType": Card.types.ARISTOCRAT}),
    new Card("Czar", 24, Card.types.UPGRADE, 0, 6, 25,
        {"upgradeType": Card.types.ARISTOCRAT}),
];
