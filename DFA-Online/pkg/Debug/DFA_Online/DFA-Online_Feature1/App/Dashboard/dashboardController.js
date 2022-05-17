(function () {
    'use strict';

    angular
        .module('dfaApp')
        .controller('DashboardController', [
            '$anchorScroll',
            '$mdSidenav',
            '$rootScope',
            'emailService',
            'currentDfaHolder',
            'environmentVariables',
            'userIsAdmin',
            'peopleResource',
            'notifications',
            'allDfaHolders',
            'userService',
            DashboardController
        ]);

    function DashboardController($anchorScroll, $mdSidenav, $rootScope, emailService, currentDfaHolder, environmentVariables,
        userIsAdmin, peopleResource, notifications, allDfaHolders, userService) {

        $anchorScroll();

        console.log(notifications);

        //emailService.testEmail();

        var vm = this;

        vm.Title = "Dashboard/Home";
        vm.dashboard = true;
        vm.approvalStage = environmentVariables.approvalStage;

        // Functions
        vm.post = post;
        vm.getDfaString = getDfaString;
        vm.openLeftMenu = openLeftMenu;
        vm.getDurationFromDate = getDurationFromDate;

        // Data
        vm.dfaNumberList = environmentVariables.roleList.dfaNumbers;
        vm.notifications = notifications;
        vm.userIsAdmin = userIsAdmin;
        vm.allDfaHolders = allDfaHolders.data.d.results;

        if (currentDfaHolder.data.d.results.length > 0) {
            vm.currentDfaHolder = currentDfaHolder.data.d.results[0];
            vm.currentUserHasDFA = true;
        }

        var dfaMap = {};
        var dfaMapValues = environmentVariables.dfaMapValues;
        dfaMapValues.forEach(function (item) {
            dfaMap[item.columnName] = item.dfaString;
        });

        var personMap = {};
        vm.allDfaHolders.forEach(function (item) {
            personMap[item.RoleID.ID] = item.Name; //Item.Name.Title
        });

        function getDfaString(value) {
            if (value) {
                return dfaMap[value];
            }
        }

        function openLeftMenu() {
            $mdSidenav('left').toggle();
        }
        
        function getPersonFromRoleID(id) {
            if (id) {
                return personMap[id];
            }
        }

        function getDurationFromDate(startDate, endDate) {
            startDate = moment(startDate);
            endDate = moment(endDate);

            if (startDate === 0) {
                startDate = moment();
            }

            if (startDate && endDate) {
                return moment.preciseDiff(startDate, endDate);
            }
        }
        
        function getCEO() {
            var ceo;

            var length = vm.allDfaHolders.length;

            for (var i = 0; i < length; i++) {
                var person = vm.allDfaHolders[i];
                if (person.RoleID.RoleName === "CEO" || person.RoleID.RoleName === "Chief Executive"
                    || person.RoleID.RoleName === "Chief Executive Officer"
                    || person.RoleID.RoleName === "CE") {
                    console.log("Assigning recipient with the email " + person.Name.EMail);
                    ceo = person.Name;
                    return ceo;
                }
            }

            return ceo;
        }

        function post(stageValue, item, index) {

            try {
                $rootScope.loadingText = "Approving/Declining your request and sending emails!";
                $rootScope.stateIsLoading = true;

                var dfaHolderToPost = angular.copy(item);
                console.log(item);
                //console.log(dfaHolderToPost);
                dfaHolderToPost.ApprovalStage = stageValue;

                var egm = getPersonFromRoleID(item.RoleID.EGMID);
                console.log(egm);

                var emailsToSend = [];

                switch (stageValue) {
                    case environmentVariables.approvalStage.egm:
                        //Check if they're a contractor
                        if (dfaHolderToPost.Contractor === true) {
                            dfaHolderToPost.ApprovalStage = environmentVariables.approvalStage.ceo;

                            var ceo = getCEO();
                            console.log("CEO: " + ceo);
                            emailsToSend.push(function () {
                                emailService.assignRoleCeoEmail(item, ceo, egm).then(function (data) {
                                    console.log(data);
                                    vm.notifications.splice(index, 1);
                                    $rootScope.stateIsLoading = false;
                                }) });
                        }
                        else {
                            dfaHolderToPost.ApprovalStage = environmentVariables.approvalStage.dfa;
                            emailsToSend.push(function () {
                                emailService.assignRoleDfaHolderEmail(item).then(function (data) {
                                    console.log(data);
                                    vm.notifications.splice(index, 1);
                                    $rootScope.stateIsLoading = false;
                                }) });
                        }
                        break;
                    case environmentVariables.approvalStage.ceo:
                        dfaHolderToPost.ApprovalStage = environmentVariables.approvalStage.dfa;
                        emailsToSend.push(function () {
                            emailService.assignRoleDfaHolderEmail(item).then(function (data) {
                                console.log(data);
                                vm.notifications.splice(index, 1);
                                $rootScope.stateIsLoading = false;
                            }) });
                        break;
                    case environmentVariables.approvalStage.dfa:
                        dfaHolderToPost.ApprovalStage = environmentVariables.approvalStage.approved;
                        emailsToSend.push(function () {
                            emailService.assignRoleCompleteEmail(item).then(function (data) {
                                console.log(data);
                                vm.notifications.splice(index, 1);
                                $rootScope.stateIsLoading = false;
                            }) });
                        emailsToSend.push(function () {
                            emailService.sampleSignatureEmail(item).then(function (data) {
                                console.log(data);
                                vm.notifications.splice(index, 1);
                                $rootScope.stateIsLoading = false;
                            }) });
                        break;
                    case environmentVariables.approvalStage.declined:
                        dfaHolderToPost.ApprovalStage = environmentVariables.approvalStage.declined;
                        userService.getCurrentUser().then(function (result) {
                            console.log('Result data is:');
                            console.log(result.data.d.Title);

                            emailsToSend.push(function () {
                                emailService.assignRoleDeclinedEmail(item, result.data.d.Title).then(function (data) {
                                    console.log(data);
                                    vm.notifications.splice(index, 1);
                                    $rootScope.stateIsLoading = false;
                                }) });
                        });

                }

                peopleResource.post(dfaHolderToPost).then(function (data) {
                    console.log(data);
                    emailsToSend.forEach(function (email) {
                        email();
                    });
                    //Hide the item posted, once successful by removing from array
                }, function (err) {
                    console.log(err);
                    $rootScope.loadingText = err.data.error.message;
                });
            }
            catch (err) {
                console.log(err);
                $rootScope.loadingText = err.toString();
            }
            
        }

    }

})();