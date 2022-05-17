(function () {
    'use strict';

    angular
        .module('dfaApp')
        .controller('DfaHolderEditController', [
            '$rootScope',
            '$timeout',
            '$mdDialog',
            '$state',
            '$anchorScroll',
            '$window',
            'dfaHolder',
            'peopleResource',
            'allDfaHolders',
            'environmentVariables',
            'roles',
            'emailService',
            'sharePointUsers',
            'subDelegateResource',
            DfaHolderEditController
        ]);

    function DfaHolderEditController($rootScope, $timeout, $mdDialog, $state, $anchorScroll, $window, dfaHolder,
        peopleResource, allDfaHolders, environmentVariables, roles, emailService, sharePointUsers, subDelegateResource) {

        $anchorScroll();

        var vm = this;

        vm.peopleSearchText = "";

        // Functions
        vm.post = postDfaHolder;
        vm.deleteItem = deleteItem;
        vm.getPersonFromRoleID = getPersonFromRoleID;
        vm.noDFAValues = noDFAValues; // used to check if a Role has DFA values > 0, hide DFA section if it doesn't
        vm.getRoleName = getRoleName; // used to get the role name from the RoleId
        vm.getDfaString = getDfaString; // used to get the DFA String value name from the DFA id e.g DFA_1
        vm.querySearch = querySearch; // used to populate the employee drop down
        vm.selectedEmployeeChange = selectedEmployeeChange; // if employee has no dfa, set to create new form, otherwise go to existing
        vm.endDateValidation = endDateValidation;
        vm.getPersonFromDfaId = getPersonFromDfaId;
        vm.deleteDelegation = deleteDelegation;

        // Data
        vm.roles = roles.data.d.results;
        vm.allDfaHolders = allDfaHolders.data.d.results;
        vm.dfaNumberList = environmentVariables.roleList.dfaNumbers;
        vm.sharePointUsers = sharePointUsers.data.d.results;


        if (dfaHolder.data) {
            vm.dfaHolder = dfaHolder.data.d;

            vm.originalRole = angular.copy(vm.dfaHolder.RoleID);
            vm.dfaHolder.RoleID = { 'Id': vm.dfaHolder.RoleID.ID };

            if (vm.dfaHolder.EmploymentStartDate) {
                vm.dfaHolder.EmploymentStartDate = new Date(vm.dfaHolder.EmploymentStartDate);
            }
            if (vm.dfaHolder.EmploymentEndDate) {
                vm.dfaHolder.EmploymentEndDate = new Date(vm.dfaHolder.EmploymentEndDate);
            }
        }
        else {
            vm.dfaHolder = dfaHolder;
            //vm.dfaHolder.EmploymentStartDate = new Date();
            vm.minStartDate = new Date();
        }

        if (vm.dfaHolder && vm.dfaHolder.Id) {
            vm.Title = "Edit DFA Holder";
            vm.postButton = "Update DFA Holder";
            vm.showFields = true;
        }
        else {
            vm.Title = "Assign DFA Holder";
            vm.postButton = "Create DFA Holder";
            vm.showFields = false;
        }

        var roleMap = {};
        vm.roles.forEach(function (item) {
            roleMap[item.Id] = item.RoleName;
        });

        var dfaMap = {};
        var dfaMapValues = environmentVariables.dfaMapValues;
        dfaMapValues.forEach(function (item) {
            dfaMap[item.columnName] = item.dfaString;
        });

        var personMap = {};
        var personNameMap = {};
        vm.allDfaHolders.forEach(function (item) {
            personNameMap[item.Id]= item.Name.Title;
            personMap[item.RoleID.ID] = item.Name; //Item.Name.Title
        });

        function getPersonFromDfaId(id) {
            if (id) {
                return personNameMap[id];
            }
        }

        function postDfaHolder(form) {

            if (!form.$valid) {
                angular.forEach(form.$error, function (field) {
                    angular.forEach(field, function (errorField) {
                        errorField.$setDirty();
                    });
                });
                console.log("Form Invalid!");
                return;
            }

            $rootScope.loadingText = "Submitting your request...";
            $rootScope.stateIsLoading = true;

            var dfaHolderToPost = angular.copy(vm.dfaHolder);
            // on create or edit, set stage to awaiting EGM
            dfaHolderToPost.ApprovalStage = environmentVariables.approvalStage.egm;

            var egm = getPersonFromRoleID(vm.dfaHolder.RoleID.EGMID); // get EGM email
            
            peopleResource.post(dfaHolderToPost).then(function (data) {
                var id;
                if (vm.dfaHolder.ID) id = vm.dfaHolder.ID;
                else id = data.data.d.ID;
                $rootScope.loadingText = "Sending out emails!";
                // can pass in id if needed (id)
                emailService.assignRoleEgmEmail(vm.dfaHolder, egm).then(function (data) { // send EGM Email
                    console.log(data);
                    $rootScope.loadingText = "Complete!";
                    $rootScope.complete = true;
                    $timeout(function () {
                        $rootScope.stateIsLoading = false;
                        $rootScope.complete = false;
                        $state.go('home');
                    }, 600);
                });
            });
        }

        function deleteItem(ev) {

          var egm = getPersonFromRoleID(vm.dfaHolder.RoleID.EGMID); // get EGM email

          subDelegateResource.getCurrentUserSubDelegations(vm.dfaHolder.Id).then(function (currentDelegations) {

                var delegations = currentDelegations.data.d.results;
                console.log(delegations);
                if (delegations.length > 0) {
                    vm.errors = "This person has present or upcoming delegations, please delete these if you want continue";
                    vm.existingDelegations = delegations;
                }
                else {
                    var confirm = $mdDialog.confirm()
                          .title('Are you sure you would like to unassign this DFA Holder?')
                          .textContent('This only deletes the user from the DFA Holder list. You can always reassign them again.')
                          .targetEvent(ev)
                          .ok('Yes, unassign')
                          .cancel('No thanks');

                    $mdDialog.show(confirm).then(function () {

                      $rootScope.loadingText = "Submitting your request...";
                      $rootScope.stateIsLoading = true;
                      $rootScope.loadingText = "Sending out emails!";

                      peopleResource.deleteItem(vm.dfaHolder.Id).then(function (deleteResponse) {
                        emailService.assignRoleDeletedEmail(vm.dfaHolder, egm).then(function (data) { // send EGM Email
                          console.log(data);
                          $rootScope.loadingText = "Complete!";
                          $rootScope.complete = true;
                          $timeout(function () {
                            $rootScope.stateIsLoading = false;
                            $rootScope.complete = false;
                            $state.go('home');
                          }, 600);
                        });
                            //console.log(deleteResponse);
                            //$state.go('home');
                        });
                    });
                }
            });
        }

        function getPersonFromRoleID(id) {
            if (id) {
                return personMap[id];
            }
        }

        function querySearch(query) { // populate the employee drop down
            return vm.sharePointUsers.filter(createFilterFor(query));
        }

        function createFilterFor(query) { // filters for employee search box
            var lowercaseQuery = angular.lowercase(query);
            return function filterFn(person) {
                var lowerCasePerson = angular.lowercase(person.Title);
                if (lowerCasePerson.indexOf("_") >= 0 || lowerCasePerson.indexOf("|") >= 0 || lowerCasePerson.indexOf("!") >= 0
                    || lowerCasePerson.indexOf(".") >= 0) {
                    return false;
                }
                else if (person.Title) {
                    return lowerCasePerson.indexOf(lowercaseQuery) >= 0;
                }
                else {
                    return "".indexOf(lowercaseQuery) === 0;
                }
            };

        }

        // used to check if a Role has DFA values > 0, hide DFA section if it doesn't
        function noDFAValues() {

            var noDFAValues = true;

            if (vm.dfaHolder && vm.dfaHolder.RoleID) {
                vm.dfaNumberList.forEach(function (dfaNumber) {
                    if (vm.dfaHolder.RoleID[dfaNumber] > 0) {
                        noDFAValues = false;
                    }
                });
            }
            return noDFAValues;
        }

        // used to get the DFA String value name from the DFA id e.g DFA_1
        function getDfaString(value) {
            if (value) {
                return dfaMap[value];
            }
        }

        // used to get the role name from the RoleId
        function getRoleName(id) {
            if (id) {
                return roleMap[id];
            }
        }

        // if employee has no dfa, set to create new form, otherwise go to existing
        function selectedEmployeeChange(employee) {
            if (employee) {
                vm.showFields = true;
                peopleResource.getUserDfa(employee.Id).then(function (userDfa) {
                    var dfaInfo = userDfa.data.d.results;
                    if (dfaInfo.length === 0) { // this is a new dfa holder
                        vm.Title = "Assign DFA Holder";
                    }
                    else { // existing DFA holder, if length is > 1 then the user has multiple allocations
                        //this probably shouldnt be allowed and not sure what should happen if this is the case
                        console.log('Entering edit form');
                        $state.go('DfaHolderEdit', { "personId": dfaInfo[0].Id });  // go to edit form for first dfa info returned
                    }
                });
            }
        }

        function deleteDelegation(id, initiator, assignee, index) {
            var textContent = '';
            textContent = assignee + ' will no longer be authorised to sign off for ' + initiator;

            var confirm = $mdDialog.confirm()
                  .title('Are you sure you would like to remove this Sub Delegation?')
                  .textContent(textContent)
                  .ok('Yes, do it')
                  .cancel('No thanks');

            $mdDialog.show(confirm).then(function () {
                subDelegateResource.deleteItem(id).then(function (deleteResponse) {
                    console.log(deleteResponse);
                    vm.existingDelegations.splice(index, 1);
                });
            });
        }

        function endDateValidation() {

            if (vm.dfaHolder.EmploymentStartDate && vm.dfaHolder.EmploymentEndDate) {
                var startTime = moment(vm.dfaHolder.EmploymentStartDate);

                var finishTime = moment(vm.dfaHolder.EmploymentEndDate);

                if (moment(finishTime).isSameOrBefore(startTime)) {
                    vm.dfaHolderEditForm.endDateField.$setValidity('endDateBeforeStart', false);
                    return true;
                }
                else {
                    vm.dfaHolderEditForm.endDateField.$setValidity('endDateBeforeStart', true);
                    return false;
                }
            }
            else {
                return false;
            }

        }

    }

})();