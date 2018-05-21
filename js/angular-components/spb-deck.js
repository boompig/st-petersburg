StPeter.component("spbDeck", {
    templateUrl: "js/angular-templates/spb-deck.html",
    bindings: {
        // string
        phaseName: '<',
        // number
        numCards: '<',
        // boolean
        isCurrentPhase: '<',
    },
});