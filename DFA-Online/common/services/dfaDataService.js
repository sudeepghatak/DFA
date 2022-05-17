// https://blogs.msdn.microsoft.com/uksharepoint/2013/02/22/manipulating-list-items-in-sharepoint-hosted-apps-using-the-rest-api/
(function () {
    'use strict';

    angular
        .module("common.services")
        .factory('dfaDataService', ['$http', 'spUrlInfoService', dfaDataService]);

    function dfaDataService($http, spUrlInfoService) {
        //return $resource("../../_api/web/lists/getbytitle('Testing')/items");  //return roleResource.get().$promise;

        var appUrl = spUrlInfoService.appWebUrl;
        var hostUrl = spUrlInfoService.hostWebUrl;

        return {
            post: post,
            get: get,
            getFromList: getFromList,
            postToList: postToList
        };

        // function for posting to endpoints other than sharepoint lists
        function post(url, data) {
            var digest = spUrlInfoService.formDigest;
            var postUrl = appUrl + url;

            var requestHeaders = {
                "Accept": "application/json;odata=verbose",
                "Content-Type": "application/json;odata=verbose",
                "X-RequestDigest": digest
            };

            return httpCall('POST', postUrl, data, requestHeaders);
        }

        // function for posting to sharepoint lists
        function postToList(id, data, list) { // If there is an id update list item else create list item
            var digest = spUrlInfoService.formDigest;

            var url;
            var requestHeaders = {};
            
            if (id) {
                url = appUrl + "/_api/SP.AppContextSite(@target)/web/lists/getbytitle('" + list + "')/items(" + id + ")?" +
                      "@target='" + hostUrl + "'";
                requestHeaders = {
                    "Accept": "application/json;odata=verbose",
                    "Content-Type": "application/json;odata=verbose",
                    "X-RequestDigest": digest,
                    "X-HTTP-Method": "MERGE",
                    "IF-MATCH": "*" 
                };
            }
            else {
                url = appUrl + "/_api/SP.AppContextSite(@target)/web/lists/getbytitle('" + list + "')/items?" +
                      "@target='" + hostUrl + "'";
                requestHeaders = {
                    "Accept": "application/json;odata=verbose",
                    "Content-Type": "application/json;odata=verbose",
                    "X-RequestDigest": digest
                };
            }

            return httpCall('POST', url, data, requestHeaders);

        }

        function getFromList(id, list, query) { // If there is an id get specific list item else get all list items
            var url;
            if (id) {
                url = appUrl + "/_api/SP.AppContextSite(@target)/web/lists/getbytitle('" + list + "')/items(" + id + ")?" +
                      "@target='" + hostUrl + "'" + query;
            }
            else {
                url = appUrl + "/_api/SP.AppContextSite(@target)/web/lists/getbytitle('" + list + "')/items?" +
                      "@target='" + hostUrl + "'" + query;
            }

            var headers = {
                "Accept": "application/json;odata=verbose",
                "Content-Type": "application/json;odata=verbose"
            };

            return httpCall('GET', url, null, headers);
        }

        function get(endpointUrl, query) {
            var url = appUrl + "/_api/SP.AppContextSite(@target)/web/" + endpointUrl
                + "@target='" + hostUrl + "'";

            if (query) {
                url += query;
            }

            var headers = {
                "Accept": "application/json;odata=verbose",
                "Content-Type": "application/json;odata=verbose"
            };

            return httpCall('GET', url, null, headers);
        }

        function httpCall(method, url, data, headers) {
            return $http({
                method: method,
                url: url,
                data: JSON.stringify(data),
                headers: headers
            });
        }
    }

})();