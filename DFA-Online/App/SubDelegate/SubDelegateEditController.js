(function () {
    'use strict';

    angular
        .module('dfaApp')
        .controller('SubDelegateEditController', [
            '$rootScope',
            '$timeout',
            '$mdDialog',
            '$state',
            '$anchorScroll',
            'subDelegateResource',
            'environmentVariables',
            'emailService',
            'subDelegation',
            'allDfaHolders',
            'currentUser',
            'currentDfaHolder',
            'userIsAdmin',
            SubDelegateEditController
        ]);

    function SubDelegateEditController($rootScope, $timeout, $mdDialog, $state, $anchorScroll, subDelegateResource,
        environmentVariables, emailService, subDelegation, allDfaHolders, currentUser, currentDfaHolder, userIsAdmin) {

        $anchorScroll();

        // get admin emails from DFA Emails list
        var dfaAdminEmails = emailService.getAdminEmailsArray();

        var vm = this;

        vm.currentDfaHolder = currentDfaHolder.data.d.results;
        console.log(vm.currentDfaHolder);
        if (vm.currentDfaHolder.length > 0) { // check to see if the current user is a dfa holder
            console.log("You are a DFA Holder");
        }
        else {
            console.log("You are NOT a DFA Holder");
        }

        // Functions
        vm.post = post;
        vm.deleteItem = deleteItem;
        vm.getDfaString = getDfaString;
        vm.endDateValidation = endDateValidation;
        vm.removeSelf = removeSelf;
        vm.getPersonFromDfaId = getPersonFromDfaId;

        // Email Accounts
        var sysAccountantEmail = dfaAdminEmails[0].sysAccountantEmail != null ? dfaAdminEmails[0].sysAccountantEmail : "hikmat.noorebad@theta.co.nz";
        var maximRecipient = dfaAdminEmails[0].maximRecipient != null ? dfaAdminEmails[0].maximRecipient : "hikmat.noorebad@theta.co.nz";
        var HrEmail = dfaAdminEmails[0].HrEmail != null ? dfaAdminEmails[0].HrEmail : "hikmat.noorebad@theta.co.nz";
        var accPayabelEmail = dfaAdminEmails[0].accPayabelEmail != null ? dfaAdminEmails[0].accPayabelEmail : "hikmat.noorebad@theta.co.nz";


        //data
        vm.allDfaHolders = allDfaHolders.data.d.results;
        vm.currentUser = currentUser.data.d;
        vm.dfaNumberList = environmentVariables.roleList.dfaNumbers;
        vm.userIsAdmin = userIsAdmin;

        //console.log(vm.currentUser);
        //console.log('*current user above, below is the initiator*');
        //console.log(vm.allDfaHolders);

        if (subDelegation.data) {
            vm.subDelegation = subDelegation.data.d;

            vm.subDelegation.DFAInitiator = { 'Id': vm.subDelegation.DFAInitiator.Id };
            vm.subDelegation.DFAAssignee = { 'Id': vm.subDelegation.DFAAssignee.Id };

            if (vm.subDelegation.AwayStartDate) {
                vm.subDelegation.AwayStartDate = new Date(vm.subDelegation.AwayStartDate);
            }
            if (vm.subDelegation.AwayEndDate) { // test
                vm.subDelegation.AwayEndDate = new Date(vm.subDelegation.AwayEndDate);
            }
        }
        else {
            vm.subDelegation = subDelegation;
            if (vm.currentDfaHolder.length > 0) { // check to see if the current user is a dfa holder
                console.log("You are a DFA Holder");
                console.log(vm.currentDfaHolder[0].Id);
                vm.subDelegation.DFAInitiator = { 'Id': vm.currentDfaHolder[0].Id };
            }
            vm.minStartDate = new Date();
        }

        if (vm.subDelegation && vm.subDelegation.Id) {
            vm.Title = "Edit Sub Delegation";
            vm.postButton = "Update Sub Delegation";
            vm.isExisting = true;
        }
        else {
            vm.Title = "New Sub Delegation";
            vm.postButton = "Create Sub Delegation ";
            vm.isExisting = false;
        }

        var dfaMap = {};
        var dfaMapValues = environmentVariables.dfaMapValues;
        dfaMapValues.forEach(function (item) {
            dfaMap[item.columnName] = item.dfaString;
        });

        var personMap = {};
        //console.log(allDfaHolders);
        vm.allDfaHolders.forEach(function (item) {
            personMap[item.Id] = item.Name.Title;
        });
        //console.log(personMap);

        function getPersonFromDfaId(id) {
            if (id) {
                return personMap[id];
            }
        }

        function deleteItem(ev) {
            var textContent = '';
            if (vm.subDelegation.DFAAssignee.Name) {
                textContent = vm.subDelegation.DFAAssignee.Name.Title + ' will no longer be authorised to sign off for you';
            }

            var confirm = $mdDialog.confirm()
                  .title('Are you sure you would like to remove this Sub Delegation?')
                  .textContent(textContent)
                  .targetEvent(ev)
                  .ok('Yes, do it')
                  .cancel('No thanks');

            $mdDialog.show(confirm).then(function () {
              $rootScope.loadingText = "Submitting your request...";
              $rootScope.stateIsLoading = true;
              subDelegateResource.deleteItem(vm.subDelegation.Id).then(function (deleteResponse) {

                  $rootScope.loadingText = "Sending out emails!";

                  var initiatorManagerEmail = getEmailFromRoleId(vm.subDelegation.DFAInitiator.RoleID.ManagerID); //get initiators manager email
                  var initiatorEgmEmail = getEmailFromRoleId(vm.subDelegation.DFAInitiator.RoleID.EGMID);

                  emailService.subDelegateEmail(initiatorManagerEmail, initiatorEgmEmail, vm.subDelegation, true).then(function (data) {
                    $rootScope.loadingText = "Complete!";
                    $rootScope.complete = true;
                    $timeout(function () {
                      $rootScope.stateIsLoading = false;
                      $rootScope.complete = false;
                      $state.go('home');
                    }, 600);
                  });

                });
            });
        }

        function post(form) {

            if (!form.$valid) {
                angular.forEach(form.$error, function (field) {
                    angular.forEach(field, function (errorField) {
                        errorField.$setDirty();
                    });
                });
                console.log("Form Invalid!");
                return;
            }

            //Check 1: Is there existing Sub-Delegation for the same Time Period
            //If there is then return an errror to the user
            //And prevent the form from submitting. 
            querySubDelegationsByInitiator(vm.subDelegation.AwayStartDate, vm.subDelegation.AwayEndDate,
                vm.subDelegation.DFAInitiator.Id, vm.subDelegation.Id).then(function (subDelegations) {
                  var delegations = subDelegations.data.d.results;

                  //Check 1A: That the delegations returned doen't include itself
                    console.log(delegations);
                    if (delegations.length > 0) {
                        vm.errors = "You have already delegated your DFA during this time, up to bruh:";
                        vm.existingDelegations = delegations;
                    }
                    else {

                        $rootScope.loadingText = "Submitting your request...";
                        $rootScope.stateIsLoading = true;

                        console.log(vm.subDelegation);
                        var subDelegateToPost = angular.copy(vm.subDelegation);
                        var initiatorManagerEmail = getEmailFromRoleId(vm.subDelegation.DFAInitiator.RoleID.ManagerID); //get initiators manager email
                        var initiatorEgmEmail = getEmailFromRoleId(vm.subDelegation.DFAInitiator.RoleID.EGMID);

                        subDelegateResource.post(subDelegateToPost).then(function (data) {
                            $rootScope.loadingText = "Sending out emails!";
                            emailService.subDelegateEmail(initiatorManagerEmail, initiatorEgmEmail, vm.subDelegation, false).then(function (data) {
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
                });
        }

        function querySubDelegationsByInitiator(start, end, initiatorId, itemID) {
            var startDate = moment(start).format('YYYY-MM-DD');
            var endDate = moment(end).format('YYYY-MM-DD');

            return subDelegateResource.getSpecificSubDelegationsByUser(startDate, endDate, initiatorId, itemID);
        }

        function removeSelf(person) {
            if (vm.subDelegation.DFAInitiator.Name && vm.subDelegation.DFAInitiator.Name.Title === person.Name.Title) {
                return false;
            }
            else {
                return true;
            }
        }

        function endDateValidation() {

            if (vm.subDelegation.AwayStartDate && vm.subDelegation.AwayEndDate) {
                var startTime = moment(vm.subDelegation.AwayStartDate);

                var finishTime = moment(vm.subDelegation.AwayEndDate);

                if (moment(finishTime).isBefore(startTime)) {
                    vm.subDelegateForm.endDateField.$setValidity('endDateBeforeStart', false);
                    return true;
                }
                else {
                    vm.subDelegateForm.endDateField.$setValidity('endDateBeforeStart', true);
                    return false;
                }
            }
            else {
                return false;
            }

        }

        function getDfaString(value) {
            if (value) {
                return dfaMap[value];
            }
        }

        vm.calcSubDelDuration = function () {
            var startDate = moment(vm.subDelegation.AwayStartDate);
            var endDate = moment(vm.subDelegation.AwayEndDate);

            var numberofDays = endDate.diff(startDate, 'days');
            vm.totalSubDelDuration = moment.duration(numberofDays, "days").humanize();

            return vm.totalSubDelDuration;
        };

        function getEmailFromRoleId(roleId) {
            var dfaHolderList = vm.allDfaHolders;
            var emailAddress;
            for (var i = 0; i < dfaHolderList.length; i++) {
                if (roleId === dfaHolderList[i].RoleIDId) {
                    emailAddress = dfaHolderList[i].Name.EMail;
                    return emailAddress;
                }
            }
            return emailAddress;
        }

    }

})();