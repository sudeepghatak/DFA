(function () {
    'use strict';

    var dfaApp = angular.module('dfaApp');

    dfaApp.controller('AppLauncherController', ['spUrlInfoService', AppLauncherController]);

    function AppLauncherController(spUrlInfoService) {
        // this is just used to handle the startup, it pulls the SharePoint details from the app url,
        // stores them in cookies and redirects to the index page
    }

})();