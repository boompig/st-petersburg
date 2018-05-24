const spbPlayerCtrl = function() {

    // not sure why I have to do this but this is just a passthrough function
    this.getTokenImageUrl = function() {
        const phaseName = StaticGameData.getPhaseName(this.player.token).toLowerCase();
        return `img/tokens/${phaseName}.png`;
    };

    this.playBoughtCard = function(card) {
        return this.onPlayCard({
            card: card,
            player: this.player,
            collection: this.player.cards,
        });
    };

    this.buyCardFromHand = function(card) {
        return this.onPlayCardFromHand({
            card: card,
            player: this.player,
        });
    };

    this.getCardQuantity = function(cardName) {
        return this.player.cards.filter((card) => {
            return card.name === cardName;
        }).length;
    };
};

StPeter.component("spbPlayer", {
    templateUrl: "js/angular-templates/player.html",
    bindings: {
        player: '<',
        isTurn: '<',
        // callbacks
        onPlayCard: '&',
        onPlayCardFromHand: '&',
    },
    controller: spbPlayerCtrl,
});