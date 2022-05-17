(function () {
    'use strict';

    angular
        .module('common.services')
        .factory('userService', [
            'dfaDataService',
            'environmentVariables',
            userService]);

    function userService(dfaDataService, environmentVariables) {

        var adminUserGroupName = environmentVariables.userGroup.admin.name;
        var adminUserGroupId = environmentVariables.userGroup.admin.id;

        return {
            getCurrentUser: getCurrentUser,
            getAdminUsers: getAdminUsers,
            //getAdminUserById: getAdminUserById,
            getUserById: getUserById,
            getAllUsers: getAllUsers
        };

        function getUserById(userId) {
            return dfaDataService.get("getuserbyid(" + userId + ")?");
        }

        function getAdminUsers() {
            return dfaDataService.get("sitegroups(" + adminUserGroupId + ")/users?");
        }

        function getAllUsers() {
            // filter out users that do not have email adresses, these are usually ad groups or service accounts
            return dfaDataService.get("siteusers?", "&$select=Id,Title,Email&$orderby=Title&$filter=Email ne ''");
        }

        //function getAdminUserById(id) {
        //    return dfaDataService.get("sitegroups(" + adminUserGroupId + ")/users/getbyid(" + 10 + ")?");
        //}

        function getCurrentUser() {
            return dfaDataService.get("currentuser?");
        }

    }

})();