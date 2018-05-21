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
};

StPeter.component("spbPlayer", {
    templateUrl: "js/angular-templates/spb-player.html",
    bindings: {
        player: '<',
        isTurn: '<',
        // callbacks
        onPlayCard: '&',
        onPlayCardFromHand: '&',
    },
    controller: spbPlayerCtrl,
});