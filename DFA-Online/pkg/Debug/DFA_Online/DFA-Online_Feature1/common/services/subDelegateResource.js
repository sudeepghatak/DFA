(function () {
    'use strict';

    angular
        .module('common.services')
        .factory('subDelegateResource', [
            'dfaDataService',
            'environmentVariables',
            subDelegateResource]);

    function subDelegateResource(dfaDataService, environmentVariables) {

        var list = environmentVariables.subDelegateList.name;
        var query = environmentVariables.subDelegateList.select;
        var selectSingleQuery = environmentVariables.subDelegateList.selectSingle;
        var selectActiveQuery = environmentVariables.subDelegateList.selectActive; // dont return deleted items
        var queryForCurrentUser = environmentVariables.subDelegateList.selectByCurrentUser;
        var subDelegationItem = {
            '__metadata': {
                type: environmentVariables.subDelegateList.spDataType
            }
        };

        return {
            get: get,
            post: post,
            deleteItem: deleteItem,
            getSpecificSubDelegations: getSpecificSubDelegations,
            getUserSubDelegation: getUserSubDelegation,
            getCurrentUserSubDelegations: getCurrentUserSubDelegations,
            getSpecificSubDelegationsByUser: getSpecificSubDelegationsByUser
        };

        function get(subDelegationId) { // role id of 0 is new role

            if (subDelegationId === 0) {
                return angular.copy(subDelegationItem);
            }
            else if (subDelegationId) { // return a specific sub Delegation
                return dfaDataService.getFromList(subDelegationId, list, selectSingleQuery);
            }
            else { // IF subDelegationId is null, return all items (except items marked as deleted)
                return dfaDataService.getFromList(subDelegationId, list, selectActiveQuery);
            }
        }

        function getUserSubDelegation(dfAInitiatorId) {
            var query = queryForCurrentUser + dfAInitiatorId;
            return dfaDataService.getFromList(null, list, query);
        }

        function getCurrentUserSubDelegations(personId) {
            var select = query;

            var currentUserSubDelegationsQuery =
                            environmentVariables
                            .subDelegateList
                            .usersCurrentSubDelegationsQuery(select, personId);

            return dfaDataService.getFromList(null, list, currentUserSubDelegationsQuery);
        }

        function getSpecificSubDelegations(startDate, endDate) {

            if (!endDate) { // if no end date specified, make it equal to start date
                endDate = startDate;
            }

            var select = query;
            var specificSubDelegationsQuery =
                environmentVariables
                .subDelegateList
                .specificSubDelegationsQuery(select, startDate, endDate);

            return dfaDataService.getFromList(null, list, specificSubDelegationsQuery);
        }

        function getSpecificSubDelegationsByUser(startDate, endDate, dfaInitiatorId, itemID) {

            var select = query;
            var specificSubDelegationsQuery =
                environmentVariables
                .subDelegateList
                .specificSubDelegationsQuery(select, startDate, endDate);
            var filterOnSelf = "";

            if (itemID) filterOnSelf = " and ID ne " + itemID;
            specificSubDelegationsQuery += " and DFAInitiatorId eq " + dfaInitiatorId + filterOnSelf;

            return dfaDataService.getFromList(null, list, specificSubDelegationsQuery);
        }

        function post(item) {

            var itemToPost = angular.copy(subDelegationItem);
            console.log(itemToPost);

            if (item.Id) {
                itemToPost.Id = item.Id;
            }

            if (item.DFAAssignee) {
                itemToPost.DFAAssigneeId = item.DFAAssignee.Id;
            }
            else if (item.DFAAssigneeId) {
                itemToPost.DFAAssigneeId = item.DFAAssigneeId;
            }

            if (item.DFAInitiator) {
                itemToPost.DFAInitiatorId = item.DFAInitiator.Id; 
            }
            else if (item.DFAInitiatorId) {
                itemToPost.DFAInitiatorId = item.DFAInitiatorId;
            }

            if (item.acceptedDFAPolicy) {
                itemToPost.acceptedDFAPolicy = item.acceptedDFAPolicy;
            }

            if (item.AwayStartDate) {
                itemToPost.AwayStartDate = item.AwayStartDate;
            }

            if (item.AwayEndDate) {
                itemToPost.AwayEndDate = item.AwayEndDate;
            }

            return dfaDataService.postToList(itemToPost.Id, itemToPost, list);
        }

        function deleteItem(id) {
            var itemToDelete = angular.copy(subDelegationItem);
            itemToDelete.Id = id;
            itemToDelete.Deleted = true;
            return dfaDataService.postToList(id, itemToDelete, list);
        }

    }

})();