(function () {
    'use strict';

    angular
        .module('dfaApp')
        .controller('DfaHolderListController', [
            '$rootScope',
            '$anchorScroll',
            '$timeout',
            'subDelegateResource',
            'userIsAdmin',
            'allDfaHolders',
            'environmentVariables',
            'roles',
            'subDelegations',
            'spUrlInfoService',
            DfaHolderListController
        ]);

    function DfaHolderListController($rootScope, $anchorScroll, $timeout, subDelegateResource, userIsAdmin, allDfaHolders,
        environmentVariables, roles, subDelegations, spUrlInfoService) {

        $anchorScroll();

        console.log(subDelegations.data.d.results);

        var vm = this;

        // Variables
        vm.Title = "DFA Holders";
        vm.egmFilter;
        vm.dfaFilter;
        vm.approvalStage = environmentVariables.approvalStage;
        vm.dfaAmountFilter;
        var initiatorMap, assigneeMap;
        vm.isThereCostCentre = false;
        vm.subDelegateStartDate = new Date();
        vm.subDelegateEndDate = new Date();
        vm.sharePointLink = spUrlInfoService.hostWebUrl + '/Lists/' + environmentVariables.holderList.name;
        vm.userIsAdmin = userIsAdmin;

        // Functions
        vm.getRoleName = getRoleName;
        vm.getPersonFromRoleID = getPersonFromRoleID;
        vm.getPersonFromDfaId = getPersonFromDfaId;
        vm.getDfaString = getDfaString;
        vm.egmEmptyOrNull = egmEmptyOrNull;
        vm.filterbyDFA = filterbyDFA;
        vm.querySubDelegations = querySubDelegations;
        vm.getInitiatorSubdelegations = getInitiatorSubdelegations;
        vm.getAssigneeSubdelegations = getAssigneeSubdelegations;
        vm.getDurationFromDate = getDurationFromDate;
        vm.showSubDelPerson = showSubDelPerson;

        // Data
        var rolesList = roles.data.d.results;
        vm.userIsAdmin = userIsAdmin;
        vm.dfaNumbers = environmentVariables.roleList.dfaNumbers;
        vm.allDfaHolders = allDfaHolders.data.d.results;
        vm.currentSubDelegations = subDelegations.data.d.results;
        createSubDelegationMaps();

        console.log("Sub delegations");
        console.log(vm.currentSubDelegations);

        /**Hashmap that show(s) which Sub-Delegation the Initiator has given.
         *
         *  This makes the hash map that show what subDelegations the initiators have given and the assignees have received.
         *  
         *  Example:
         *   Hamish has a DFA ID of 1 and is the Initiator.
         *       If the item in subDelegation list has an IntitatorID === 1
         *          then, put that subDelegation item in the array of mapped values to the id of 1.
         *
         *  i.e initiatorMap[1] = [ subDelegationFromHamish1, subDelegationFromHamish2];
         */
        function createSubDelegationMaps() {
            initiatorMap = {};
            assigneeMap = {};

            vm.currentSubDelegations.forEach(function (subDelegation) {
                if (!initiatorMap[subDelegation.DFAInitiator.Id]) {
                    initiatorMap[subDelegation.DFAInitiator.Id] = [];
                    initiatorMap[subDelegation.DFAInitiator.Id].push(subDelegation);
                }
                else {
                    initiatorMap[subDelegation.DFAInitiator.Id].push(subDelegation);
                }

                if (!assigneeMap[subDelegation.DFAAssignee.Id]) {
                    assigneeMap[subDelegation.DFAAssignee.Id] = [];
                    assigneeMap[subDelegation.DFAAssignee.Id].push(subDelegation);
                }
                else {
                    assigneeMap[subDelegation.DFAAssignee.Id].push(subDelegation);
                }
            });

            console.log(initiatorMap);
            console.log(assigneeMap);
        }

        console.log(vm.allDfaHolders);

        var personMap = {};
        var personNameMap = {};
        vm.allDfaHolders.forEach(function (item) {
            personMap[item.RoleID.ID] = item.Name.Title;
            personNameMap[item.Id] = item.Name.Title;

            //Create a property for showing/hiding sections
            item.showPerson = false;

            //Checking if there is a cost centre.
            if (item.RoleID.CostCentre) {
                vm.isThereCostCentre = true;
            }
        });

        var roleMap = {};
        rolesList.forEach(function (item) {
            roleMap[item.Id] = item.RoleName;
        });

        var dfaMap = {};
        var dfaMapValues = environmentVariables.dfaMapValues;
        dfaMapValues.forEach(function (item) {
            dfaMap[item.columnName] = item.dfaString;
        });

        function getDfaString(value) {
            if (value) {
                return dfaMap[value];
            }
        }

        function getPersonFromRoleID(id) {
            if (id) {
                return personMap[id];
            }
        }

        function getPersonFromDfaId(id) {
            if (id) {
                return personNameMap[id];
            }
        }

        function getRoleName(id) {
            if (id) {
                return roleMap[id];
            }
        }

        function getInitiatorSubdelegations(id) {
            if (id) {
                return initiatorMap[id];
            }
        }

        function getAssigneeSubdelegations(id) {
            if (id) {
                return assigneeMap[id];
            }
        }

        function getDurationFromDate(startDate, endDate) {
            startDate = moment(startDate);
            endDate = moment(endDate);

            if (startDate && endDate) {
                return moment.preciseDiff(startDate, endDate);
            }
        }

        function querySubDelegations() {

            if (vm.subDelegateStartDate) {

                $rootScope.loadingText = "Searching...";
                $rootScope.stateIsLoading = true;

                var endDate = null;
                var startDate = moment(vm.subDelegateStartDate).format('YYYY-MM-DD');

                if (vm.subDelegateEndDate) {
                    endDate = moment(vm.subDelegateEndDate).format('YYYY-MM-DD');
                }

                subDelegateResource.getSpecificSubDelegations(startDate, endDate)
                    .then(function (newSubdelegations) {
                        console.log(newSubdelegations.data.d.results);
                        vm.currentSubDelegations = newSubdelegations.data.d.results;
                        createSubDelegationMaps();
                        vm.subDelSearchButton = true;
                        //$rootScope.loadingText = "Complete!";
                        //$rootScope.complete = true;
                        $timeout(function () {
                            $rootScope.stateIsLoading = false; // test
                            $rootScope.complete = false;
                        }, 600);
                    });
            }
        }

        function egmEmptyOrNull(item) {
            //Filter empty values for EGM Dropdown. 
            if (item.RoleID.EGMID) {
                return !(item.RoleID.EGMID === null || item.RoleID.EGMID === "" || item.RoleID.EGMID === 0);
            }
        }


        /*********************************************************
        * Purpose: Allow a user to filter by a specific DFA Value or Amount
        *
        *   Condition 1: If there is a value in DFA Column Dropdown and DFA Amount Input.
        *       then: Filter by that specific value
        *
        *   Condition 2: If ONLY the DFA $ Amount is filled out
        *       then: For each DFA Value, only return if it is > dfa Amount
        *
        *   Else:      Return everything, do not filter. 
        ***********************************************************/
        function filterbyDFA(item) {
            var dfaCol = vm.dfaFilter;
            var dfaAmount = vm.dfaAmountFilter;

            //Condition 1
            if (dfaCol && dfaAmount) {
                return item.RoleID[dfaCol] >= dfaAmount;
            }
            //Condition 2
            if (dfaAmount) {
                var bool = false;
                angular.forEach(item.RoleID, function (roleItems) {
                    if (roleItems >= dfaAmount) bool = true;
                });
                return bool;
            }

            else {
                return true;
            }
        }

        function showSubDelPerson(id, subDelID) {
            //Loop through everytime repeated item
            //Set the current item showPerson = false, essentially hiding the section;
            //Set the subDel item showPerson = true, essential showing the section;
            vm.allDfaHolders.forEach(function (item) {
                if (item.ID === id) item.showPerson = false;
                if (item.ID === subDelID) item.showPerson = true;
            });
        }

        vm.clearFilter = function () {
            vm.egmFilter = undefined;
            vm.dfaFilter = undefined;
            vm.dfaAmountFilter = undefined;
            vm.showWaitingApproval = false;
            vm.subDelegateStartDate = undefined;
            vm.subDelegateEndDate = undefined;
            vm.subDelSearchButton = false;

        };

    }
})();