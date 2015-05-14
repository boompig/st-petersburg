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
    new Card("LUMBERJACK", 3, "WORKER", 3, 0, "WORKER", "LUMBERJACK"),
    new Card("GOLD_MINER", 4, "WORKER", 3, 0, "WORKER", "GOLD_MINER"),
    new Card("SHEPHERD", 5, "WORKER", 3, 0, "WORKER", "SHEPHERD"),
    new Card("FUR_TRAPPER", 6, "WORKER", 3, 0, "WORKER", "FUR_TRAPPER"),
    new Card("SHIP_BUILDER", 7, "WORKER", 3, 0, "WORKER", "SHIP_BUILDER"),
    new Card("CZAR_AND_CARPENTER", 8, "WORKER", 3, 0, "WORKER", "CZAR_AND_CARPENTER"),

    new Card("MARKET", 5, "BUILDING", 0, 1, "BUILDING"),
    new Card("CUSTOMS_HOUSE", 8, "BUILDING", 0, 2, "BUILDING"),
    new Card("FIREHOUSE", 11, "BUILDING", 0, 3, "BUILDING"),
    new Card("HOSPITAL", 14, "BUILDING", 0, 4, "BUILDING"),
    new Card("LIBRARY", 17, "BUILDING", 0, 5, "BUILDING"),
    new Card("THEATRE", 20, "BUILDING", 0, 6, "BUILDING"),
    new Card("ACADEMY", 23, "BUILDING", 0, 7, "BUILDING"),
// missing potjomkin's village, pub, warehouse, observatory

    new Card("AUTHOR", 4, "ARISTOCRAT", 1, 0, "ARISTOCRAT"),
    new Card("ADMINISTRATOR", 7, "ARISTOCRAT", 2, 0, "ARISTOCRAT"),
    new Card("WAREHOUSE_MANAGER", 10, "ARISTOCRAT", 3, 0, "ARISTOCRAT"),
    new Card("SECRETARY", 12, "ARISTOCRAT", 4, 0, "ARISTOCRAT"),
    new Card("CONTROLLER", 14, "ARISTOCRAT", 4, 1, "ARISTOCRAT"),
    new Card("JUDGE", 16, "ARISTOCRAT", 5, 2, "ARISTOCRAT"),
    new Card("MISTRESS", 18, "ARISTOCRAT", 6, 3, "ARISTOCRAT"),

// missing carpenter
// missing goldSmelter
    new Card("WEAVING_MILL", 8, "UPGRADE", 6, 0, "WORKER", "SHEPHERD"),
    new Card("FUR_TRADER", 10, "UPGRADE", 3, 2, "WORKER", "FUR_TRAPPER"),
    new Card("WHARF", 12, "UPGRADE", 6, 1, "WORKER", "SHIP_BUILDER"),

// missing marjinski
    new Card("BANK", 13, "UPGRADE", 5, 1, "BUILDING"),
    new Card("PETERHOF", 14, "UPGRADE", 4, 2, "BUILDING"),
    new Card("ST_ISAACS_CATHEDRAL", 15, "UPGRADE", 3, 3, "BUILDING"),
    new Card("CHURCH_OF_THE_RESURRECTION", 16, "UPGRADE", 2, 4, "BUILDING"),
    new Card("HARBOR", 16, "UPGRADE", 5, 2, "BUILDING"),
    new Card("CATHERINES_PALACE", 17, "UPGRADE", 1, 5, "BUILDING"),
    new Card("SMOLNY_CATHEDRAL", 17, "UPGRADE", 4, 3, "BUILDING"),
    new Card("HERMITAGE", 18, "UPGRADE", 3, 4, "BUILDING"),
    new Card("WINTER_PALACE", 19, "UPGRADE", 2, 5, "BUILDING"),

// aristocrats
    new Card("POPE", 6, "UPGRADE", 1, 1, "ARISTOCRAT"),
    new Card("WEAPON_MASTER", 8, "UPGRADE", 4, 0, "ARISTOCRAT"),
    new Card("CHAMBER_MAID", 8, "UPGRADE", 0, 2, "ARISTOCRAT"),
    new Card("BUILDER", 10, "UPGRADE", 5, 0, "ARISTOCRAT"),
    new Card("SENATOR", 12, "UPGRADE", 2, 2, "ARISTOCRAT"),
    new Card("PATRIARCH", 16, "UPGRADE", 0, 4, "ARISTOCRAT"),
    // missing tax man
    new Card("ADMIRAL", 18, "UPGRADE", 3, 3, "ARISTOCRAT"),
    new Card("FOREIGN_MINISTER", 20, "UPGRADE", 2, 4, "ARISTOCRAT"),
    new Card("CZAR", 24, "UPGRADE", 0, 6, "ARISTOCRAT"),
];

function Player (name, token) {
    this.name = name;
    this.points = 0;
    // start with 25 money
    this.money = 25;
    this.cards = [];
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
