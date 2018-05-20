import { Card } from "./cards";

const aristocratScoringChart = {
    "0": 0,
    "1": 1,
    "2": 3,
    "3": 6,
    "4": 10,
    "5": 15,
    "6": 21,
    "7": 28,
    "8": 36,
    "9": 45,
    "10": 55
};

const gamePhases = [
    Card.types.WORKER,
    Card.types.BUILDING,
    Card.types.ARISTOCRAT,
    Card.types.UPGRADE
];

export { aristocratScoringChart, gamePhases };