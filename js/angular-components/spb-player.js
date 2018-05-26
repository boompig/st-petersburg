/* global angular */

import "../display.js";
import { StaticGameData } from "../static-data.js";

const spbPlayerCtrl = function() {

    /**
     * not sure why I have to do this but this is just a passthrough function
     * @returns {String};
     */
    this.getTokenImageUrl = function() {
        const phaseName = StaticGameData.getPhaseName(this.player.token).toLowerCase();
        return `img/tokens/${phaseName}.png`;
    };

    /**
     *
     * @param {Card} card
     */
    this.playBoughtCard = function(card) {
        return this.onPlayCard({
            card: card,
            player: this.player,
            collection: this.player.cards,
        });
    };

    /**
     *
     * @param {Card} card
     */
    this.buyCardFromHand = function(card) {
        return this.onPlayCardFromHand({
            card: card,
            player: this.player,
        });
    };

    /**
     *
     * @param {String} cardName
     */
    this.getCardQuantity = function(cardName) {
        return this.player.cards.filter((card) => {
            return card.name === cardName;
        }).length;
    };
};

angular.module("stPeter").component("spbPlayer", {
    templateUrl: "js/angular-templates/player.html",
    bindings: {
        player: "<",
        isTurn: "<",
        // callbacks
        onPlayCard: "&",
        onPlayCardFromHand: "&",
    },
    controller: spbPlayerCtrl,
});