// @flow

import { Card } from "./cards.js";

export const StaticGameData = {};

StaticGameData.Phases = Object.freeze([
    Card.types.WORKER,
    Card.types.BUILDING,
    Card.types.ARISTOCRAT,
    Card.types.UPGRADE
]);

StaticGameData.aristocratScoringChart = Object.freeze({
    0: 0,
    1: 1,
    2: 3,
    3: 6,
    4: 10,
    5: 15,
    6: 21,
    7: 28,
    8: 36,
    9: 45,
    10: 55
});

/**
 *
 * @param {number} numAristocrats Number of aristocrats this player owns
 * @returns {number}
 */
StaticGameData.scoreAristocrats = function(numAristocrats) {
    numAristocrats = Math.min(numAristocrats, 10);
    return StaticGameData.aristocratScoringChart[numAristocrats];
};

/**
 *
 * @param {Card.types} phase
 * @returns {String}
 */
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