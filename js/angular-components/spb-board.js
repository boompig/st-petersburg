const BoardCtrl = function() {
    this.buyCard = function(card) {
        return this.onBuyCard({
            card: card,
            collection: this.cards,
        });
    };

    this.putCardInHand = function(card) {
        return this.onPutCardInHand({
            card: card,
            collection: this.cards,
        });
    };

    this.prettyName = function() {
        return this.name[0].toUpperCase() + this.name.substr(1);
    };
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
        // callbacks
        onPutCardInHand: '&',
        onBuyCard: '&',
    },
    controller: BoardCtrl,
});
