/**
 * Upgrade type means ARISTOCRAT, WORKER, BUILDING
 * upgrade class is only relevant for workers
 */
function Card (name, cost, type, coin_yield, point_yield, upgrade_type, workerUpgradeClass) {
    this.name = name;
    this.cost = cost;
    this.type = type;
    this.coinYield = coin_yield;
    this.pointYield = point_yield;
    this.upgradeType = upgrade_type;
    this.workerUpgradeClass = workerUpgradeClass || null;
}

/**
 * Return true iff can upgrade current card to the target card.
 */
Card.prototype.canUpgradeTo = function (upgradeCard) {
    if (this.type === "WORKER") {
        return upgradeCard.type === "UPGRADE" &&
            this.upgradeType === upgradeCard.upgradeType &&
            (this.workerUpgradeClass === upgradeCard.workerUpgradeClass ||
             this.workerUpgradeClass === "CZAR_AND_CARPENTER");
    } else {
        return upgradeCard.type === "UPGRADE" && this.upgradeType === upgradeCard.upgradeType;
    }
};

/***** cards ****/

// peasants
var allCards = [
    new Card("Lumberjack", 3, "WORKER", 3, 0, "WORKER", "LUMBERJACK"),
    new Card("Gold Miner", 4, "WORKER", 3, 0, "WORKER", "GOLD_MINER"),
    new Card("Shepherd", 5, "WORKER", 3, 0, "WORKER", "SHEPHERD"),
    new Card("Fur Trapper", 6, "WORKER", 3, 0, "WORKER", "FUR_TRAPPER"),
    new Card("Ship Builder", 7, "WORKER", 3, 0, "WORKER", "SHIP_BUILDER"),
    new Card("Czar and Carpenter", 8, "WORKER", 3, 0, "WORKER", "CZAR_AND_CARPENTER"),

    new Card("Market", 5, "BUILDING", 0, 1, "BUILDING"),
    new Card("Customs_house", 8, "BUILDING", 0, 2, "BUILDING"),
    new Card("Firehouse", 11, "BUILDING", 0, 3, "BUILDING"),
    new Card("Hospital", 14, "BUILDING", 0, 4, "BUILDING"),
    new Card("Library", 17, "BUILDING", 0, 5, "BUILDING"),
    new Card("Theatre", 20, "BUILDING", 0, 6, "BUILDING"),
    new Card("Academy", 23, "BUILDING", 0, 7, "BUILDING"),
// missing potjomkin's village, pub, warehouse, observatory

    new Card("Author", 4, "ARISTOCRAT", 1, 0, "ARISTOCRAT"),
    new Card("Administrator", 7, "ARISTOCRAT", 2, 0, "ARISTOCRAT"),
    new Card("Warehouse Manager", 10, "ARISTOCRAT", 3, 0, "ARISTOCRAT"),
    new Card("Secretary", 12, "ARISTOCRAT", 4, 0, "ARISTOCRAT"),
    new Card("Controller", 14, "ARISTOCRAT", 4, 1, "ARISTOCRAT"),
    new Card("Judge", 16, "ARISTOCRAT", 5, 2, "ARISTOCRAT"),
    new Card("Mistress", 18, "ARISTOCRAT", 6, 3, "ARISTOCRAT"),

// missing carpenter
// missing goldSmelter
    new Card("Weaving Mill", 8, "UPGRADE", 6, 0, "WORKER", "SHEPHERD"),
    new Card("Fur Trader", 10, "UPGRADE", 3, 2, "WORKER", "FUR_TRAPPER"),
    new Card("Wharf", 12, "UPGRADE", 6, 1, "WORKER", "SHIP_BUILDER"),

// missing marjinski
    new Card("Bank", 13, "UPGRADE", 5, 1, "BUILDING"),
    new Card("Peterhof", 14, "UPGRADE", 4, 2, "BUILDING"),
    new Card("St. Isaac's Cathedral", 15, "UPGRADE", 3, 3, "BUILDING"),
    new Card("Church of the Resurrection", 16, "UPGRADE", 2, 4, "BUILDING"),
    new Card("Harbor", 16, "UPGRADE", 5, 2, "BUILDING"),
    new Card("Catherine's Palace", 17, "UPGRADE", 1, 5, "BUILDING"),
    new Card("Smolny Cathedral", 17, "UPGRADE", 4, 3, "BUILDING"),
    new Card("Hermitage", 18, "UPGRADE", 3, 4, "BUILDING"),
    new Card("Winter Palace", 19, "UPGRADE", 2, 5, "BUILDING"),

// aristocrats
    new Card("Pope", 6, "UPGRADE", 1, 1, "ARISTOCRAT"),
    new Card("Weapon_Master", 8, "UPGRADE", 4, 0, "ARISTOCRAT"),
    new Card("Chamber Maid", 8, "UPGRADE", 0, 2, "ARISTOCRAT"),
    new Card("Builder", 10, "UPGRADE", 5, 0, "ARISTOCRAT"),
    new Card("Senator", 12, "UPGRADE", 2, 2, "ARISTOCRAT"),
    new Card("Patriarch", 16, "UPGRADE", 0, 4, "ARISTOCRAT"),
    // missing tax man
    new Card("Admiral", 18, "UPGRADE", 3, 3, "ARISTOCRAT"),
    new Card("Foreign Minister", 20, "UPGRADE", 2, 4, "ARISTOCRAT"),
    new Card("Czar", 24, "UPGRADE", 0, 6, "ARISTOCRAT"),
];

function Player (name, token) {
    this.name = name;
    this.points = 0;
    // start with 25 money
    this.money = 25;
    this.cards = [];
    this.hand = [];
    this.token = token || null;
}

/**** unit tests ***/
var UnitTests = {};
UnitTests.aristocratUpgradeTest = function () {
    // positive
    console.log(author.canUpgradeTo(pope));
    console.log(mistress.canUpgradeTo(czar));

    // negative
    console.log(author.canUpgradeTo(stIsaacs) === false);
    console.log(author.canUpgradeTo(wharf) === false);
    console.log(author.canUpgradeTo(author) === false);
};

UnitTests.workerUpgradeTest = function () {
    // positive
    console.log(shepherd.canUpgradeTo(weavingMill));
    console.log(czarCarpenter.canUpgradeTo(weavingMill));
    console.log(czarCarpenter.canUpgradeTo(furShop));

    // negative
    console.log(furShop.canUpgradeTo(czarCarpenter) === false);
    console.log(lumberjack.canUpgradeTo(wharf) === false);
};

/**
 * Extremely basic unit test runner
 * Runs all methods of UnitTests which has word Test in it
 */
UnitTests.runAll = function () {
    for (var prop in this) {
        if (this.hasOwnProperty(prop) && prop.indexOf("Test") > -1) {
            console.log("*** " + prop + " ***");
            UnitTests[prop]();
        }
    }
};

//UnitTests.runAll();
