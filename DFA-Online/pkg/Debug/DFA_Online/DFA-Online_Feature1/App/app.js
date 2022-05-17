(function () {
    'use strict';

    angular
        .module('dfaApp', ['common.services', 'ui.router', 'ngMaterial', 'angular.filter'])
        .run(function ($rootScope) { // catch all errors and log to consol
            $rootScope.$on("$stateChangeError", console.log.bind(console));
            $rootScope.$on('$stateChangeStart', function () {
                $rootScope.loadingText = "Loading...";
                $rootScope.stateIsLoading = true;
            });
            $rootScope.$on('$stateChangeSuccess', function () {
                $rootScope.stateIsLoading = false;
            });
        })
        .config(function ($mdDateLocaleProvider) {

            $mdDateLocaleProvider.formatDate = function (date) {
                if (date) return moment(date).format('DD/MM/YYYY');
                else return "";
            };

            $mdDateLocaleProvider.parseDate = function (dateString) {
                var m = moment(dateString, "DD-MM-YYYY", true);
                return m.isValid() ? m.toDate() : new Date(NaN);
            };

        })

        .config(["$stateProvider", "$urlRouterProvider",
        function ($stateProvider, $urlRouterProvider) {
            $urlRouterProvider.otherwise("/");

            $stateProvider
                .state("home", {
                    url: "/",
                    templateUrl: "../App/Dashboard/dashboardView.html",
                    controller: "DashboardController as vm",
                    resolve: {
                        currentUser: function (userService) {
                            return userService.getCurrentUser();
                        },

                        currentDfaHolder: function (currentUser, peopleResource) {
                            var currentUserId = currentUser.data.d.Id;
                            return peopleResource.getUserDfa(currentUserId);
                        },

                        allDfaHolders: function (peopleResource) {
                            return peopleResource.get(null); //returning all items 
                        },

                        userIsAdmin: function (currentUser, userService) {
                            return userService.getAdminUsers().then(function (users) {
                                var userIsAdmin = false;
                                var userName = currentUser.data.d.Title;
                                var adminUsers = users.data.d.results;
                                adminUsers.forEach(function (user) {
                                    if (user.Title === userName) {
                                        userIsAdmin = true;
                                    }
                                });
                                return userIsAdmin;
                            });
                        },

                        notifications: function (userIsAdmin, currentDfaHolder, peopleResource) {
                            var currentUserRoleId, currentUserRoleName, currentUserId;
                            var dfaHolder = currentDfaHolder.data.d;

                            if (userIsAdmin) {
                                console.log("Admin");
                                return peopleResource.getAllNotifications().then(function (notifications) {
                                    console.log(notifications);
                                    return notifications.data.d.results;
                                });
                            }
                            else if (dfaHolder.results.length > 0) { // check to see if the current user is a dfa holder
                                currentUserRoleId = dfaHolder.results[0].RoleIDId;
                                currentUserRoleName = dfaHolder.results[0].RoleID.RoleName;
                                currentUserId = dfaHolder.results[0].Name.Id;
                            }
                            else {
                                return []; // no notifictions if the current user is not a dfa holder
                            }
                            // the .then function is needed to ensure only the CEO sees Approval stage "CEO" notifications
                            return peopleResource.getNotifications(currentUserId, currentUserRoleId).then(function (notifications) {
                                var allNotifications = notifications.data.d.results;
                                var returnedNotifications = []; // array of notifications to return
                                if (allNotifications.length > 0) {
                                    allNotifications.forEach(function (notification) {
                                        if (notification.ApprovalStage !== "Awaiting CEO") { // return all non CEO notifications
                                            returnedNotifications.push(notification);
                                        }
                                        else if (notification.ApprovalStage === "Awaiting CEO" && currentUserRoleName === "CEO"
                                            || notification.ApprovalStage === "Awaiting CEO" && currentUserRoleName === "Chief Executive Officer"
                                            || notification.ApprovalStage === "Awaiting CEO" && currentUserRoleName === "Chief Executive"
                                            || currentUserRoleName === "CE") {
                                            // if current User is CEO
                                            returnedNotifications.push(notification);
                                        }
                                        // otherwise do not include notification
                                    });
                                    return returnedNotifications;
                                }
                                else {
                                    return returnedNotifications;
                                }
                            });
                        }
                    }
                })
                .state("roleList", {
                    url: "/roles",
                    templateUrl: "../App/Roles/roleListView.html",
                    controller: "RoleListController as vm",
                    resolve: {
                        roles: function (roleResource) {
                            return roleResource.get(null); // passing in null returns all items
                        },
                        currentUser: function (userService) {
                            return userService.getCurrentUser();
                        },
                        userIsAdmin: function (currentUser, userService) {
                            return userService.getAdminUsers().then(function (users) {
                                var userIsAdmin = false;
                                var userName = currentUser.data.d.Title;
                                var adminUsers = users.data.d.results;
                                adminUsers.forEach(function (user) {
                                    if (user.Title === userName) {
                                        userIsAdmin = true;
                                    }
                                });
                                return userIsAdmin;
                            });
                        }
                    }
                }).state("roleEdit", {
                    url: "/roles/edit/:roleId",
                    templateUrl: "../App/Roles/roleEditView.html",
                    controller: "RoleEditController as vm",
                    resolve: {
                        allDfaHolders: function (peopleResource) {
                            return peopleResource.get(null); //returning all items 
                        },
                        role: function ($stateParams, roleResource) {
                            var roleId = $stateParams.roleId;
                            return roleResource.get(Number(roleId));
                        },
                        roles: function (roleResource) {
                            return roleResource.get(null); // passing in null returns all items
                        }
                    }
                }).state("DfaHolderList", {
                    url: "/dfaHolder",
                    templateUrl: "../App/Person/DfaHolderListView.html",
                    controller: "DfaHolderListController as vm",
                    resolve: {
                        currentUser: function (userService) {
                            return userService.getCurrentUser();
                        },
                        userIsAdmin: function (currentUser, userService) {
                            return userService.getAdminUsers().then(function (users) {
                                var userIsAdmin = false;
                                var userName = currentUser.data.d.Title;
                                var adminUsers = users.data.d.results;
                                adminUsers.forEach(function (user) {
                                    if (user.Title === userName) {
                                        userIsAdmin = true;
                                    }
                                });
                                return userIsAdmin;
                            });
                        },
                        allDfaHolders: function (peopleResource) {
                            return peopleResource.get(null); //returning all items 
                        },
                        roles: function (roleResource) {
                            return roleResource.get(null); // passing in null returns all items
                        },
                        subDelegations: function (subDelegateResource) {
                            var startDate = moment().format('YYYY-MM-DD');
                            return subDelegateResource.getSpecificSubDelegations(startDate, null);
                        }
                    }
                }).state("DfaHolderEdit", {
                    url: "/dfaHolder/edit/:personId",
                    templateUrl: "../App/Person/DfaHolderEditView.html",
                    controller: "DfaHolderEditController as vm",
                    resolve: {
                        dfaHolder: function ($stateParams, peopleResource) {
                            var personId = $stateParams.personId;
                            // get an existing dfa holders details, if no Id is provided it will be a new dfa holder
                            return peopleResource.get(Number(personId));
                        },
                        allDfaHolders: function (peopleResource) {
                            return peopleResource.get(null); // passing in null returns all items in table
                        },
                        roles: function (roleResource) {
                            return roleResource.get(null); // passing in null returns all items in table
                        },
                        sharePointUsers: function (userService) {
                            return userService.getAllUsers();
                        }
                    }
                }).state("subDelegateList", {
                    url: "/subDelegations",
                    templateUrl: "../App/SubDelegate/subDelegateListView.html",
                    controller: "SubDelegateListController as vm",
                    resolve: {
                        allSubDelegations: function (subDelegateResource) {
                            return subDelegateResource.get(null);
                        },
                        allDfaHolders: function (peopleResource) {
                            return peopleResource.get(null); // passing in null returns all items in table
                        },
                        currentUser: function (userService) {
                            return userService.getCurrentUser();
                        },
                        userIsAdmin: function (currentUser, userService) {
                            return userService.getAdminUsers().then(function (users) {
                                var userIsAdmin = false;
                                var userName = currentUser.data.d.Title;
                                var adminUsers = users.data.d.results;
                                adminUsers.forEach(function (user) {
                                    if (user.Title === userName) {
                                        userIsAdmin = true;
                                    }
                                });
                                return userIsAdmin;
                            });
                        }
                    }
                })
                .state("mySubDelegateList", {
                    url: "/subDelegations/mine",
                    templateUrl: "../App/SubDelegate/subDelegateListView.html",
                    controller: "SubDelegateListController as vm",
                    resolve: {
                        currentUser: function (userService) {
                            return userService.getCurrentUser();
                        },
                        userIsAdmin: function (currentUser, userService) {
                            return userService.getAdminUsers().then(function (users) {
                                var userIsAdmin = false;
                                var userName = currentUser.data.d.Title;
                                var adminUsers = users.data.d.results;
                                adminUsers.forEach(function (user) {
                                    if (user.Title === userName) {
                                        userIsAdmin = true;
                                    }
                                });
                                return userIsAdmin;
                            });
                        },
                        currentDfaHolder: function (currentUser, peopleResource) {
                            var currentUserId = currentUser.data.d.Id;
                            return peopleResource.getUserDfa(currentUserId);
                        },
                        allSubDelegations: function (currentDfaHolder, subDelegateResource) {
                            var dfAInitiatorId = currentDfaHolder.data.d.results[0].Id;
                            return subDelegateResource.getUserSubDelegation(dfAInitiatorId);
                        },
                        allDfaHolders: function (peopleResource) {
                            return peopleResource.get(null); // passing in null returns all items in table
                        }
                    }
                })
                .state("subDelegateEdit", {
                    url: "/subDelegate/edit/:subDelegationId",
                    templateUrl: "../App/SubDelegate/subDelegateEditForm.html",
                    controller: "SubDelegateEditController as vm",
                    resolve: {
                        subDelegation: function ($stateParams, subDelegateResource) {
                            var subDelegationId = $stateParams.subDelegationId;
                            // get an existing sub delegation, if no Id is provided it will be a new subDelegation
                            return subDelegateResource.get(Number(subDelegationId));
                        },
                        allDfaHolders: function (peopleResource) {
                            return peopleResource.get(null); //return all items
                        },
                        currentUser: function (userService) {
                            return userService.getCurrentUser();
                        },
                        currentDfaHolder: function (currentUser, peopleResource) {
                            var currentUserId = currentUser.data.d.Id;
                            return peopleResource.getUserDfa(currentUserId);
                        },
                        userIsAdmin: function (currentUser, userService) {
                            return userService.getAdminUsers().then(function (users) {
                                var userIsAdmin = false;
                                var userName = currentUser.data.d.Title;
                                var adminUsers = users.data.d.results;
                                adminUsers.forEach(function (user) {
                                    if (user.Title === userName) {
                                        userIsAdmin = true;
                                    }
                                });
                                return userIsAdmin;
                            });
                        }
                    }
                });
        }]);

})();