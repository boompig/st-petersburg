const StaticGameData = {};

StaticGameData.Phases = [
    Card.types.WORKER,
    Card.types.BUILDING,
    Card.types.ARISTOCRAT,
    Card.types.UPGRADE
];

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