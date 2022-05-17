(function () {
    'use strict';

    angular
        .module('common.services')
        .factory('roleResource', [
            'dfaDataService',
            'environmentVariables',
            roleResource]);

    function roleResource(dfaDataService, environmentVariables) {

        var list = environmentVariables.roleList.name;
        var query = environmentVariables.roleList.select;
        var selectSingleQuery = environmentVariables.roleList.selectSingle
        var selectActiveQuery = environmentVariables.roleList.selectActive; // dont return deleted items
        var roleItem = {
            '__metadata': {
                type: environmentVariables.roleList.spDataType
            }
        };

        return {
            get: get,
            post: post,
            deleteItem: deleteItem
        };

        function get(roleId) { 

            if (roleId === 0) { // role id of 0 is new role
                return angular.copy(roleItem);
            } 
            else if (roleId) { // return a specific role
                return dfaDataService.getFromList(roleId, list, selectSingleQuery);
            }
            else { // IF roleId is null, return all items (except items marked as deleted)
                return dfaDataService.getFromList(roleId, list, selectActiveQuery);
            }
        }

        function post(itemToPost) {

            if (itemToPost.ManagerID) {
                itemToPost.ManagerID = itemToPost.ManagerID.Id;
            }

            if (itemToPost.EGMID) {
                itemToPost.EGMID = itemToPost.EGMID.Id;
            }

            return dfaDataService.postToList(itemToPost.Id, itemToPost, list);
        }

        function deleteItem(id) {
            var itemToDelete = angular.copy(roleItem);
            itemToDelete.Id = id;
            itemToDelete.Deleted = true;
            return dfaDataService.postToList(id, itemToDelete, list);
        }
        
    }

})();