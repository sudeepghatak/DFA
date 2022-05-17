(function () {
    'use strict';

    angular
        .module('common.services')
        .factory('peopleResource', [
            'dfaDataService',
            'environmentVariables',
            peopleResource]);

    function peopleResource(dfaDataService, environmentVariables) {

        var list = environmentVariables.holderList.name;
        var query = environmentVariables.holderList.select;
        var selectSingleQuery = environmentVariables.holderList.selectSingle
        var selectActiveQuery = environmentVariables.holderList.selectActive; // dont return deleted items
        var queryForCurrentUser = environmentVariables.holderList.selectByCurrentUser;
        var personItem = {
            '__metadata': {
                type: environmentVariables.holderList.spDataType
            }
        };

        return {
            get: get,
            post: post,
            getUserDfa: getUserDfa,
            getByRole: getByRole,
            getNotifications: getNotifications,
            getAllNotifications: getAllNotifications,
            deleteItem: deleteItem
        };
        
        function get(dfaHolderId) { // role id of 0 is new role
            if (dfaHolderId === 0) {
                return angular.copy(personItem);
            }
            else if (dfaHolderId) { // return a specific item
                return dfaDataService.getFromList(dfaHolderId, list, selectSingleQuery);
            }
            else { // IF dfaHolderId is null, return all items (except items marked as deleted)
                return dfaDataService.getFromList(dfaHolderId, list, selectActiveQuery);
            }
        }

        function getAllNotifications() {
            var allNotificationQuery = environmentVariables.holderList.allNotificationQuery;
            return dfaDataService.getFromList(null, list, allNotificationQuery);
        }

        function getNotifications(currentUserId, currentUserRoleId) {
            var notificationQuery = environmentVariables.holderList.notificationQuery(currentUserId, currentUserRoleId);
            console.log(notificationQuery);
            return dfaDataService.getFromList(null, list, notificationQuery); //test
        }

        function getUserDfa(userId) {
            var query = queryForCurrentUser + userId;
            return dfaDataService.getFromList(null, list, query);
        }

        function getByRole(roleId) {
            var query = environmentVariables.holderList.selectByRole + roleId;
            return dfaDataService.getFromList(null, list, query);
        }

        function post(item) {

            var itemToPost = angular.copy(personItem);

            if (item.Id) {
                itemToPost.Id = item.Id;
            }

            if (item.Name) {
                itemToPost.NameId = item.Name.Id;
            }
            else if (item.NameId) {
                itemToPost.NameId = item.NameId;
            }

            if (item.RoleID) {
                itemToPost.RoleIDId = item.RoleID.Id;
            }
            else if (item.RoleIDId) {
                itemToPost.RoleIDId = item.RoleIDId;
            }

            itemToPost.EmploymentStartDate = item.EmploymentStartDate;
            itemToPost.EmploymentEndDate = item.EmploymentEndDate;
            itemToPost.Contractor = item.Contractor;
            itemToPost.Notes = item.Notes;
            itemToPost.EmailNote = item.EmailNote;

            if (item.ApprovalStage) {
                itemToPost.ApprovalStage = item.ApprovalStage;
            }

            console.log(itemToPost);

            return dfaDataService.postToList(itemToPost.Id, itemToPost, list);
        }

        function deleteItem(id) {
            var itemToDelete = angular.copy(personItem);
            itemToDelete.Id = id;
            itemToDelete.Deleted = true;
            return dfaDataService.postToList(id, itemToDelete, list);
        }

    }

})();