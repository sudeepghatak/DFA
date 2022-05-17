(function () {
    'use strict';

    angular
        .module('dfaApp')
        .controller('RoleEditController', [
            '$rootScope',
            '$timeout',
            '$mdDialog',
            '$state',
            '$anchorScroll',
            '$q',
            'role',
            'roles',
            'roleResource',
            'environmentVariables',
            'emailService',
            'allDfaHolders',
            'userService',
            'peopleResource',
            RoleEditController
        ]);

    function RoleEditController($rootScope, $timeout, $mdDialog, $state, $anchorScroll, $q, role, roles, roleResource,
        environmentVariables, emailService, allDfaHolders, userService, peopleResource) {

        $anchorScroll();

        var vm = this;

        // Functions
        vm.post = postRole;
        vm.deleteItem = deleteItem;
        vm.managerChange = managerChange;
        vm.dfaValidCheck = dfaValidCheck;
        vm.getDfaString = getDfaString;

        // Data
        vm.allDfaHolders = allDfaHolders.data.d.results;
        vm.roles = roles.data.d.results;
        vm.dfaNumberList = environmentVariables.roleList.dfaNumbers;

        if (role.data) {
            vm.role = role.data.d;
            vm.role.ManagerID = {
                'Id': vm.role.ManagerID
            };
            vm.role.EGMID = {
                'Id': vm.role.EGMID
            };
        }
        else {
            vm.role = role;
        }

        // dont allow changing the manager to update dfa details as it can overwrite old values
        var shouldChangeManager;
        if (vm.role && vm.role.Id) {
            vm.Title = "Edit Role";
            vm.postButton = "Update Role";
            shouldChangeManager = false;
        }
        else {
            vm.Title = "Create Role";
            vm.postButton = "Create Role";
            shouldChangeManager = true;
        }

        var dfaMap = {};
        var dfaMapValues = environmentVariables.dfaMapValues;
        dfaMapValues.forEach(function (item) {
            dfaMap[item.columnName] = item.dfaString;
        });

        var roleMap = {};
        console.log(vm.roles);
        vm.roles.forEach(function (item) {
            roleMap[item.Id] = item.RoleName; //Item.Name.Title
        });

        function postRole(form) {
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

            var roleToPost = angular.copy(vm.role);
            var egm = getRoleNameFromId(vm.role.EGMID.Id);
            roleResource.post(roleToPost).then(function (data) {
                var promises = [];
                // Email DFA Holders of the Role that was edited
                //if (vm.role.Id) {
                //    peopleResource.getByRole(vm.role.Id).then(function (people) {
                //        var peopleInRole = people.data.d.results;
                //        console.log(peopleInRole); //["0"].Name.EMail
                //        peopleInRole.forEach(function (person) {
                //            promises.push(emailService.notifyRoleHolderEmail(vm.role, egm, person));
                //        });
                //    });
                //}

                $rootScope.loadingText = "Sending out emails!";

                promises.push(emailService.roleCreatedEmail(vm.role, egm));

                return $q.all(promises)
                        .then(function (results) {
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

        //Delete role 
        function deleteItem(ev) {
            var textContent = 'This deletes the Role from the Role List. You can always re-create the role again.';
            var title = 'Are you sure you would like to remove this Role?';


            var managerOrEGM = isRoleAManagerOrEGM(vm.role.Id);
            var hasRole = userHasRole(vm.role.Id);

            var confirm;

            if (managerOrEGM || hasRole) {
                textContent = 'Please contact Systems Accounting for assistance.';
                title = 'This role can not be deleted as it is ';

                if (managerOrEGM && hasRole) title += 'currently assigned to a Person and is a Manager or EGM Role';
                else if (managerOrEGM) title += 'a Manager or EGM Role';
                else if (hasRole) title += 'currently assigned to a Person';

                confirm = $mdDialog.alert()
                    .title(title)
                    .clickOutsideToClose(true)
                    .textContent(textContent)
                    .targetEvent(ev)
                    .ok('Ok');

                $mdDialog.show(confirm);
            }
            else {
                confirm = $mdDialog.confirm()
                  .title(title)
                  .textContent(textContent)
                  .targetEvent(ev)
                  .ok('Yes, delete this Role')
                  .cancel('No thanks');

                $mdDialog.show(confirm).then(function () {

                    $rootScope.loadingText = "Submitting your request...";
                    $rootScope.stateIsLoading = true;

                    roleResource.deleteItem(vm.role.Id).then(function (deleteResponse) {
                        console.log(deleteResponse);
                        $rootScope.loadingText = "Sending out emails!";

                        emailService.removeRoleEmail(vm.role).then(function (data) {

                            $rootScope.loadingText = "Complete!";
                            $rootScope.complete = true;
                            $timeout(function () {
                                $rootScope.stateIsLoading = false;
                                $rootScope.complete = false;
                                $state.go('home');
                            }, 600);

                            console.log('Role data:');
                            console.log(data);
                        });
                    });
                });
            }
        }

        function getRoleNameFromId(id) {
            if (id) {
                return roleMap[id];
            }
        }

        function getDfaString(value) {
            if (value) {
                return dfaMap[value];
            }
        }

        function managerChange(manager) {
            console.log(manager);
            // If the Selected Manager has an EGM
            //      - default the EGM to be managers EGM
            if (manager && manager.EGMID && shouldChangeManager) {
                vm.role.EGMID = { 'Id': manager.EGMID };
                console.log("Manager Reset");
                setMaxDfaValues(manager);
            }
            else if (manager && shouldChangeManager) {
                console.log("Manager Reset Two");
                setMaxDfaValues(manager);
            }
            shouldChangeManager = true;
        }

        function setMaxDfaValues(manager) { // max dfa values are half of the managers DFA values
            vm.dfaNumberList.forEach(function (dfaNumber) {
                vm.role[dfaNumber] = manager[dfaNumber] / 2;
            });
        }

        function dfaValidCheck(dfaNumber) {
            if (vm.role.ManagerID) {
                if (dfaNumber !== "DFA_7") {
                    if (vm.role[dfaNumber] > Math.round(vm.role.ManagerID[dfaNumber] / 2 * 100) / 100) {
                        vm.roleEditForm[dfaNumber].$setValidity('dfaExceed', false);
                    }
                    else {
                        vm.roleEditForm[dfaNumber].$setValidity('dfaExceed', true);
                    }
                }
                else {
                    if (vm.role[dfaNumber] > 5) { // contracts of 5 or less years
                        vm.roleEditForm[dfaNumber].$setValidity('dfaExceed', false);
                    }
                    else {
                        vm.roleEditForm[dfaNumber].$setValidity('dfaExceed', true);
                    }
                }
            }
            return true;
        }

        function isRoleAManagerOrEGM(roleId) {

            var roleIsManagerOrEGM = false;

            var length = vm.roles.length;
            for (var i = 0; i < length; i++) {
                if (roleId === vm.roles[i].EGMID || roleId === vm.roles[i].ManagerID) {
                    roleIsManagerOrEGM = true;
                    break;
                }
            }
            return roleIsManagerOrEGM;
        }

        function userHasRole(roleId) { // check if there is a user with this role

            var userHasRole = false;

            var length = vm.allDfaHolders.length;
            for (var i = 0; i < length; i++) {
                if (roleId === vm.allDfaHolders[i].RoleIDId) {
                    userHasRole = true;
                    break;
                }
            }
            return userHasRole;
        }

    }

})();