/* global angular */

import "../display.js";
import { Card } from "../cards.js";

angular.module("stPeter").component("spbPlayerCard", {
    templateUrl: "js/angular-templates/bought-card.html",
    bindings: {
        card: "<",
        quantity: "<",
    },
});

const spbBoardCardCtrl = function() {

    /**
     * @returns {String}
     */
    this.getBuyTooltipText = function() {
        const cost = this.humanPlayer.getCardCost(this.card, this.location);
        if(this.card.type === Card.types.UPGRADE) {
            return `Raw cost to buy this upgrade card for ${this.humanPlayer.name}: ${cost}. Actual cost depends on the card you choose to upgrade.`;
        } else {
            return `Cost to buy for ${this.humanPlayer.name}: ${cost}`;
        }
    };
};

angular.module("stPeter").component("spbBoardCard", {
    templateUrl: "js/angular-templates/board-card.html",
    bindings: {
        card: "<",
        // location is of type Card.locations
        location: "<",
        // pass in human player so we can calculate the real card cost
        humanPlayer: "<",
    },
    controller: spbBoardCardCtrl,
});