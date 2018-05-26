/* global angular */

import "../display.js";

angular.module("stPeter").component("spbDeck", {
    templateUrl: "js/angular-templates/spb-deck.html",
    bindings: {
        // string
        phaseName: "<",
        // number
        numCards: "<",
        // boolean
        isCurrentPhase: "<",
    },
});