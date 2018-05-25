const BoardCtrl = function() {
    /**
     * @param {Card} card
     */
    this.buyCard = function(card) {
        return this.onBuyCard({
            card: card,
            collection: this.cards,
        });
    };

    /**
     * @param {Card} card
     */
    this.putCardInHand = function(card) {
        return this.onPutCardInHand({
            card: card,
            collection: this.cards,
        });
    };

    /**
     * @returns {String}
     */
    this.prettyName = function() {
        return this.name[0].toUpperCase() + this.name.substr(1);
    };

    /**
     * @returns {Card.locations}
     */
    this.getBoardType = function() {
        if(this.name === "lower") {
            return Card.locations.LOWER_BOARD;
        } else {
            return Card.locations.UPPER_BOARD;
        }
    }
};

StPeter.component("spbBoard", {
    templateUrl: "js/angular-templates/spb-board.html",
    bindings: {
        // array of card objects
        cards: '<',
        // boolean
        currentPlayerIsHuman: '<',
        // the string "upper" or "lower"
        name: '<',
        // Player
        humanPlayer: '<',
        // callbacks
        onPutCardInHand: '&',
        onBuyCard: '&',
    },
    controller: BoardCtrl,
});
