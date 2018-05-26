/* global angular */

import "../display.js";

angular.module("stPeter").directive("spbCard", function () {
    return {
        templateUrl: "js/angular-templates/spb-card.html",
    };
});