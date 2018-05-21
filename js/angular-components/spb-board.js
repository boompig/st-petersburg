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
    }
};


StPeter.component("spbLowerBoard", {
    templateUrl: "js/angular-templates/spb-lower-board.html",
    bindings: {
        cards: '<',
        currentPlayerIsHuman: '<',
        // callbacks
        onPutCardInHand: '&',
        onBuyCard: '&',
    },
    controller: BoardCtrl,
});

StPeter.component("spbUpperBoard", {
    templateUrl: "js/angular-templates/spb-upper-board.html",
    bindings: {
        cards: '<',
        currentPlayerIsHuman: '<',
        // callbacks
        onPutCardInHand: '&',
        onBuyCard: '&',
    },
    controller: BoardCtrl,
});