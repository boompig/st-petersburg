const StaticGameData = {};

StaticGameData.Phases = [
    Card.types.WORKER,
    Card.types.BUILDING,
    Card.types.ARISTOCRAT,
    Card.types.UPGRADE
];

/**
 * 
 * @param {number} numAristocrats Number of aristocrats this player owns
 */
StaticGameData.scoreAristocrats = function(numAristocrats) {
    numAristocrats = Math.min(numAristocrats, 10);
    return StaticGameData.aristocratScoringChart[numAristocrats];
};

StaticGameData.getPhaseName = function(phase) {
    phase = Number(phase);
    switch (phase) {
        case Card.types.WORKER:
            return "Worker";
        case Card.types.BUILDING:
            return "Building";
        case Card.types.ARISTOCRAT:
            return "Aristocrat";
        case Card.types.UPGRADE:
            return "Upgrade";
        default:
            throw new Error("Unknown phase: " + phase);
    }
};

