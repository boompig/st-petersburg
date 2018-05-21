StPeter.component("spbDeck", {
    templateUrl: "js/angular-templates/spb-deck.html",
    bindings: {
        // string
        phaseName: '<',
        numCards: '<',
        // boolean
        isCurrentPhase: '<',
    },
});