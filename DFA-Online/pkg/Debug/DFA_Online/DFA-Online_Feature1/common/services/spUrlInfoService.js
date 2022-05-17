(function () {
    'use strict';

    angular
            .module('common.services')
            .service('spUrlInfoService', [
                '$cookieStore',
                '$window',
                '$location',
                '$timeout',
                '$http',
                'environmentVariables',
                spUrlInfoService
            ]);
                

    function spUrlInfoService($cookieStore, $window, $location, $timeout, $http, environmentVariables) {
        var service = this;
        // host web example: https://genesisenergynz.sharepoint.com/sites/gedev

        // init the service
        init();

        function init() {

            var cookieTest = $cookieStore.get('SPAppWebUrl');

            // if there are values already in cookie
            if (cookieTest !== undefined) {
                loadAppDetailsFromCookie();
                if (!service.formDigest) {
                    refreshSecurityValidation(); // may need to fix this so that the value is ensured to be loaded before calling any posts
                }
                var urlTest = decodeURIComponent($.getQueryStringValue("SPHostUrl"));

                // if values exist on querystring redirect to home page
                if (urlTest !== "undefined") {
                    $window.location.href = $cookieStore.get('SPAppWebUrl') + '/Pages/index.html';
                }
            }
            else { // no values in cookie

                var urlTesting = decodeURIComponent($.getQueryStringValue("SPHostUrl"));

                // if values exist on querystring...
                if (urlTesting !== "undefined") {
                    storeAppDetailsInCookie();
                    loadAppDetailsFromCookie();
                    refreshSecurityValidation();

                    getAppDetailListData().then(function (data) {
                        // if the details havent been loaded to list yet
                        if (data.length === 0) {
                            postToAppListData();
                        }
                        $window.location.href = $cookieStore.get('SPAppWebUrl') + '/Pages/index.html';
                    });
                   
                }
                else { // Loading details from list, should happen when app launcher not fired

                    getAppDetailListData().then(function (data) {
                        if (data[0] !== undefined) {
                            $cookieStore.put('SPAppWebUrl', data[0].AppWebUrl);
                            $cookieStore.put('SPHostUrl', data[0].HostWebUrl);
                            loadAppDetailsFromCookie();
                            refreshSecurityValidation();
                            $window.location.href = $cookieStore.get('SPAppWebUrl') + '/Pages/index.html';
                        }
                        else {
                            // could not get any details from url, list or cookie, redirect to app to
                            // hopefully refire the app launcher
                            $window.location.href = environmentVariables.baseUrl;
                        }

                    });
                }
            }

        }

        // create sharepoint app context by moving params on querystring to an app cookie
        function storeAppDetailsInCookie() {
            var appWebUrl = decodeURIComponent($.getQueryStringValue("SPAppWebUrl"));
            var index = appWebUrl.lastIndexOf("#");
            if (index > 0) {
                appWebUrl = appWebUrl.substr(0, index);
            }
            $cookieStore.put('SPAppWebUrl', appWebUrl);
            var url = decodeURIComponent($.getQueryStringValue("SPHostUrl"));
            $cookieStore.put('SPHostUrl', url);
        }

        function postToAppListData() {

            var listName = 'AppDetailsList';
            var aDigestVal = service.formDigest;

            var url = service.appWebUrl + "/_api/web/lists/getbytitle('" + listName + "')/items";

            var appDetailsInfo = {
                "__metadata": {
                    "type": "SP.Data.AppDetailsListListItem"
                },
                "Title": "AppDetails",
                "HostWebUrl": service.hostWebUrl,
                "AppWebUrl": service.appWebUrl
            };

            $http({
                method: 'POST',
                url: url,
                data: JSON.stringify(appDetailsInfo),
                headers: {
                    "Accept": "application/json;odata=verbose",
                    "Content-Type": "application/json;odata=verbose",
                    "X-RequestDigest": aDigestVal
                }
            })
            .then(function (response) {

            });
        }

        function getAppDetailListData() {

            var listName = 'AppDetailsList';
            var apiUrl = environmentVariables.baseUrl + "/_api/web/lists/getbytitle('" + listName + "')/items?select=Title,HostWebUrl,AppWebUrl&$filter=Title eq 'AppDetails'";

            return $http({
                method: 'GET',
                url: apiUrl,
                headers: {
                    "Accept": "application/json;odata=verbose",
                    "Content-Type": "application/json;odata=verbose"
                }
            })
            .then(function (response) {
                return response.data.d.results;
            }, function (reason) {
                console.log("*****Error getting AppDetailList data");
                console.log(reason);
            });
        }

        // init the sharepoint app context by loding the app's cookie contents
        function loadAppDetailsFromCookie() {
            service.appWebUrl = $cookieStore.get('SPAppWebUrl');
            service.hostWebUrl = $cookieStore.get('SPHostUrl');
        }

        // refresh/setting of security digest
        function refreshSecurityValidation() {

            console.log(service.appWebUrl);

            $http.post(service.appWebUrl + "/_api/contextinfo", {
                data: '',
                headers: {
                    "Accept": "application/json;odata=verbose",
                    "Content-Type": "application/json;odata=verbose"
                }
            }).success(function (data) {
                console.log("******Context info*****");
                console.log(data);
                console.log("***********************");

                var validationRefreshTimeout = data.FormDigestTimeoutSeconds - 10;
                service.formDigest = data.FormDigestValue;

                // repeat this in FormDigestTimeoutSeconds-10
                $timeout(function () {
                    refreshSecurityValidation();
                }, validationRefreshTimeout * 1000);

            }).error(function (err) {
                console.log("Error on retrieving digest value");
                console.log(err);
            });
        }

    }

})();