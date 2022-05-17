(function () {
    'use strict';

    angular
            .module('common.services')
            .factory('emailService', [
                'dfaDataService',
                'spUrlInfoService',
                'environmentVariables',
                '$compile',
                '$http',
                '$templateRequest',
                '$timeout',
                '$rootScope',
                emailService]);

    function emailService(dfaDataService, spUrlInfoService, environmentVariables,
      $compile, $http, $templateRequest, $timeout, $rootScope) {

        var sendEmailPostUrl = "/_api/SP.Utilities.Utility.SendEmail";
        var dashboardURL = spUrlInfoService.hostWebUrl + '/' + environmentVariables.appName;

        var adminEmailsArray = [];

        getAdminEmails(environmentVariables.environment);

        var vm = this;

        //GetListItems("DFAAdmin", "DFA Emails");
        //Emails
        var testingEmailAddress = adminEmailsArray[0].testingEmail != null ? adminEmailsArray[0].testingEmail : "Leanne.Bradley@genesisenergy.co.nz";
        vm.email = {};
        vm.email.dfaAdminEmail = adminEmailsArray[0].dfaAdminEmail != null ? adminEmailsArray[0].dfaAdminEmail : "Leanne.Bradley@genesisenergy.co.nz";
        vm.email.sysAccountantEmail = adminEmailsArray[0].sysAccountantEmail != null ? adminEmailsArray[0].sysAccountantEmail : "Leanne.Bradley@genesisenergy.co.nz";
        vm.email.maximEmail = adminEmailsArray[0].maximEmail != null ? adminEmailsArray[0].maximEmail : "Leanne.Bradley@genesisenergy.co.nz";
        vm.email.accPayabelEmail = adminEmailsArray[0].accPayabelEmail != null ? adminEmailsArray[0].accPayabelEmail : "Leanne.Bradley@genesisenergy.co.nz";
        vm.email.testingEmailAddress = testingEmailAddress;



        return {
            testEmail: testEmail,
            roleCreatedEmail: roleCreatedEmail, // createRoleEmail
            removeRoleEmail: removeRoleEmail, // deleteEmail
            notifyRoleHolderEmail: notifyRoleHolderEmail,
            assignRoleEgmEmail: assignRoleEgmEmail,
            assignRoleCeoEmail: assignRoleCeoEmail,
            assignRoleDfaHolderEmail: assignRoleDfaHolderEmail,
            assignRoleCompleteEmail: assignRoleCompleteEmail, //approveNotification
            assignRoleDeclinedEmail: assignRoleDeclinedEmail, // declineHR
            assignRoleDeletedEmail: assignRoleDeletedEmail,
            subDelegateEmail: subDelegateEmail,
            sampleSignatureEmail: sampleSignatureEmail,
            getAdminEmailsArray: getAdminEmailsArray
        };

        function testEmail() {
            // test email, html template
            var testEmailTemplateUrl = "../common/emailTemplates/testEmailTemplate.html";
            var testEmailSubject = "A new test email has been created";
            var recipients = [
              'joshua.salmon@genesisenergy.co.nz',
              'hamish.parbhu@genesisenergy.co.nz'];

            // data corresponding to fields needed for email template
            var scope = $rootScope.$new();
            scope.data = {
                roleName: "Sample Title",
                egm: "EGM NAME",
                manager: "Manger NAME"
            };

            return generateEmailHtml(testEmailTemplateUrl, scope).then(function (emailBody) {
                console.log(emailBody);
                var emailRequest = generateEmailRequest(emailBody, recipients, testEmailSubject);
                return dfaDataService.post(sendEmailPostUrl, emailRequest);
            });
        }

        function roleCreatedEmail(role, egm) { //createRoleEmail

            var roleCreatedEmailTemplateUrl = "../common/emailTemplates/roleCreatedEmailTemplate.html";
            var roleEmailSubject = "DFA Online - New role has been created";
            var emailHeader = "Role Created";
            var roleEmailDescription = role.RoleName + " was just added to DFA Online";

            if (role.Id) {
                roleEmailSubject = "DFA Online - Role has been edited";
                emailHeader = "Role Updated";
                roleEmailDescription = role.RoleName + " was just updated on DFA Online";
            }

            var recipients = [
              vm.email.maximEmail,
              vm.email.sysAccountantEmail
              //,vm.email.testingEmailAddress

            ];

            // data corresponding to fields needed for email template
            var scope = $rootScope.$new();
            scope.data = {
                descriptionOfEmail: roleEmailDescription,
                emailHeader: emailHeader,
                roleName: role.RoleName,
                egmRoleName: egm,
                managerRoleName: role.ManagerID.RoleName,
                dashboardURL: dashboardURL,
                CostCentre: role.CostCentre,
                dfaList: buildDfaList(role)
            };

            return generateEmailHtml(roleCreatedEmailTemplateUrl, scope).then(function (emailBody) {
                console.log(emailBody);
                var emailRequest = generateEmailRequest(emailBody, recipients, roleEmailSubject);
                return dfaDataService.post(sendEmailPostUrl, emailRequest);
            });
        }

        function notifyRoleHolderEmail(role, egm, person) {

            var roleCreatedEmailTemplateUrl = "../common/emailTemplates/roleCreatedEmailTemplate.html";
            var roleEmailSubject = "DFA Online - Your role has been updated";
            var emailHeader = "Role Updated";
            var roleEmailDescription = role.RoleName + " was just updated on  DFA Online";

            var recipients = [
              person.Name.EMail
              //,vm.email.testingEmailAddress
            ];

            // data corresponding to fields needed for email template
            var scope = $rootScope.$new();
            scope.data = {
                descriptionOfEmail: roleEmailDescription,
                emailHeader: emailHeader,
                roleName: role.RoleName,
                egmRoleName: egm,
                managerRoleName: role.ManagerID.RoleName,
                personName: person.Name.Title,
                CostCentre: role.CostCentre,
                dashboardURL: dashboardURL,
                dfaList: buildDfaList(role)
            };

            return generateEmailHtml(roleCreatedEmailTemplateUrl, scope).then(function (emailBody) {
                console.log(emailBody);
                var emailRequest = generateEmailRequest(emailBody, recipients, roleEmailSubject);
                return dfaDataService.post(sendEmailPostUrl, emailRequest);
            });
        }

        function removeRoleEmail(role) { // deleteEmail

            var roleRemovedEmailTemplateUrl = "../common/emailTemplates/roleDeletedEmail.html";
            var roleRemovedEmailSubject = "DFA Online: A role has been removed";
            var recipients = [
              vm.email.maximEmail,
              vm.email.sysAccountantEmail
              //,vm.email.testingEmailAddress
            ];

            // data corresponding to fields needed for email template
            var scope = $rootScope.$new();
            scope.data = {
                descriptionOfEmail: role.RoleName + " was just removed from DFA Online",
                emailHeader: "Role Removed",
                roleName: role.RoleName,
                managerRoleName: role.ManagerID.RoleName,
                egmRoleName: role.EGMID.RoleName,
                dfaList: buildDfaList(role)
            };

            return generateEmailHtml(roleRemovedEmailTemplateUrl, scope).then(function (emailBody) {
                console.log(emailBody);
                var emailRequest = generateEmailRequest(emailBody, recipients, roleRemovedEmailSubject);
                return dfaDataService.post(sendEmailPostUrl, emailRequest);
            });
        }

        //Send EGM first email notification that a new role has been assigned
        function assignRoleEgmEmail(dfaHolder, egm) { // assignRoleEGM

            var egmEmailAddress;
            if (!egm) {
                egm = {};
                egm.Title = 'DFA Admin';
                egmEmailAddress = vm.email.dfaAdminEmail;
            }
            else {
                egmEmailAddress = egm.EMail;
            }

            var assignRoleEgmEmailTemplateUrl = "../common/emailTemplates/assignRoleCeoEgmEmailTemplate.html";
            var assignRoleEgmEmailSubject = "Genesis Energy Limited - Delegations of Authority";
            var recipients = [
              egmEmailAddress
              //,vm.email.testingEmailAddress
            ];

            console.log(dfaHolder);

            // data corresponding to fields needed for email template
            var scope = $rootScope.$new();
            scope.data = {
                recepientName: egm.Title,
                personName: dfaHolder.Name.Title,
                descriptionOfEmail: dfaHolder.RoleID.RoleName + " has been assigned to " + dfaHolder.Name.Title,
                emailHeader: "Awaiting your Approval (EGM)",
                roleName: dfaHolder.RoleID.RoleName,
                notes: dfaHolder.Notes,
                emailNote: dfaHolder.EmailNote,
                dashboardURL: dashboardURL,
                startDate: dfaHolder.EmploymentStartDate,
                endDate: dfaHolder.EmploymentEndDate,
                dfaList: buildDfaList(dfaHolder.RoleID)
            }; //NOTE: These are temporary for the period of " + convertDate(dfaHolder.EmploymentStartDate) + " to " + convertDate(dfaHolder.EmploymentEndDate) + " <br><br>

            return generateEmailHtml(assignRoleEgmEmailTemplateUrl, scope).then(function (emailBody) {
                console.log(emailBody);
                var emailRequest = generateEmailRequest(emailBody, recipients, assignRoleEgmEmailSubject);
                return dfaDataService.post(sendEmailPostUrl, emailRequest);
            });
        }

        //in the event of an assign role, where the assignee is a contractor, send a notification to the CEO to approve of this assignment
        function assignRoleCeoEmail(dfaHolder, ceo, egm) { //  assignRoleCEO

            var ceoEmailAddress;
            if (!ceo) {
                ceo = {};
                ceo.Title = 'DFA Admin';
                ceoEmailAddress = vm.email.dfaAdminEmail; //this should be admin email.
            }
            else {
                ceoEmailAddress = ceo.EMail;
            }

            var assignRoleCeoEmailTemplateUrl = "../common/emailTemplates/assignRoleCeoEgmEmailTemplate.html";
            var assignRoleCeoEmailSubject = "Genesis Energy Limited - Delegations of Authority";
            var recipients = [
              ceoEmailAddress
              //,vm.email.testingEmailAddress
            ];

            // data corresponding to fields needed for email template
            var scope = $rootScope.$new();
            scope.data = {
                recepientName: ceo.Title,
                personName: dfaHolder.Name.Title,
                egmName: egm.Title,
                descriptionOfEmail: dfaHolder.RoleID.RoleName + " has been assigned to " + dfaHolder.Name.Title,
                emailHeader: "Awaiting your Approval (CEO)",
                roleName: dfaHolder.RoleID.RoleName,
                notes: dfaHolder.Notes,
                emailNote: dfaHolder.EmailNote,
                dashboardURL: dashboardURL,
                startDate: dfaHolder.EmploymentStartDate,
                endDate: dfaHolder.EmploymentEndDate,
                contractor: dfaHolder.Contractor,
                dfaList: buildDfaList(dfaHolder.RoleID)
            };

            return generateEmailHtml(assignRoleCeoEmailTemplateUrl, scope).then(function (emailBody) {
                console.log(emailBody);
                var emailRequest = generateEmailRequest(emailBody, recipients, assignRoleCeoEmailSubject);
                return dfaDataService.post(sendEmailPostUrl, emailRequest);
            });

        }

        //Send email to the DFA holder so they may accept the DFA assigned to them
        function assignRoleDfaHolderEmail(dfaHolder) { //  assignRoleDFA

            var assignRoleDfaHolderEmailTemplateUrl = "../common/emailTemplates/assignRoleDfaHolderEmailTemplate.html";
            var assignRoleDfaHolderEmailSubject = "Genesis Energy Limited - Delegations of Authority";
            var recipients = [
              dfaHolder.Name.EMail
              //,vm.email.testingEmailAddress
            ];

            var scope = $rootScope.$new();
            scope.data = {
                descriptionOfEmail: dfaHolder.RoleID.RoleName + " has been assigned to you",
                emailHeader: "Awaiting your Approval (DFA Holder)",
                roleName: dfaHolder.RoleID.RoleName,
                notes: dfaHolder.Notes,
                emailNote: dfaHolder.EmailNote,
                dashboardURL: dashboardURL,
                startDate: dfaHolder.EmploymentStartDate,
                endDate: dfaHolder.EmploymentEndDate,
                personName: dfaHolder.Name.Title,
                dfaList: buildDfaList(dfaHolder.RoleID)
            };

            return generateEmailHtml(assignRoleDfaHolderEmailTemplateUrl, scope).then(function (emailBody) {
                console.log(emailBody);
                var emailRequest = generateEmailRequest(emailBody, recipients, assignRoleDfaHolderEmailSubject);
                return dfaDataService.post(sendEmailPostUrl, emailRequest);
            });
        }

        function assignRoleCompleteEmail(dfaHolder) { // approveNotification

            var assignRoleCompleteEmailTemplateUrl = "../common/emailTemplates/assignRoleCompleteEmailTemplate.html";
            var assignRoleCompleteEmailSubject = "DFA Online - Role Assigned Accepted by all parties";
            var recipients = [
              vm.email.accPayabelEmail,
              vm.email.maximEmail,
              vm.email.sysAccountantEmail
              //,vm.email.testingEmailAddress
            ];

            var scope = $rootScope.$new();
            scope.data = {
                descriptionOfEmail: dfaHolder.RoleID.RoleName + " has been assigned to a person",
                emailHeader: "Approval Complete",
                roleName: dfaHolder.RoleID.RoleName,
                notes: dfaHolder.Notes,
                dashboardURL: dashboardURL,
                startDate: dfaHolder.EmploymentStartDate,
                endDate: dfaHolder.EmploymentEndDate,
                dfaList: buildDfaList(dfaHolder.RoleID),
                personName: dfaHolder.Name.Title, // these arent being used in current template
                contractor: dfaHolder.Contractor // these arent being used in current template
            };

            return generateEmailHtml(assignRoleCompleteEmailTemplateUrl, scope).then(function (emailBody) {
                console.log(emailBody);
                var emailRequest = generateEmailRequest(emailBody, recipients, assignRoleCompleteEmailSubject);
                return dfaDataService.post(sendEmailPostUrl, emailRequest);
            });
        }

        function assignRoleDeclinedEmail(dfaHolder, declinee) { //  declineHR

            var assignRoleDeclinedEmailTemplateUrl = "../common/emailTemplates/assignRoleDeclinedEmailTemplate.html";
            var assignRoleDeclinedEmailSubject = "DFA Online - DFA Allocations have been declined";
            var recipients = [
              dfaHolder.Name.EMail,
              vm.email.sysAccountantEmail
              //,vm.email.testingEmailAddress
            ];

            console.log(dfaHolder);
            if (dfaHolder.EmploymentStartDate || dfaHolder.EmploymentEndDate) {
              var employmentStartDate = moment(dfaHolder.EmploymentStartDate).format("DD/MM/YYYY");
              var employmentEndDate = moment(dfaHolder.EmploymentEndDate).format("DD/MM/YYYY");
            }
            else{
              employmentStartDate = false;
              employmentEndDate = false;
            }

            var scope = $rootScope.$new();
            scope.data = {
                descriptionOfEmail: dfaHolder.RoleID.RoleName + " has been assigned to a person",
                emailHeader: "Approval Declined",
                roleName: dfaHolder.RoleID.RoleName,
                notes: dfaHolder.Notes,
                emailNote: dfaHolder.EmailNote,
                dashboardURL: dashboardURL,
                startDate: employmentStartDate,
                endDate: employmentEndDate,
                dfaList: buildDfaList(dfaHolder.RoleID),
                personName: dfaHolder.Name.Title,
                contractor: dfaHolder.Contractor,
                declinee: declinee
            };

            return generateEmailHtml(assignRoleDeclinedEmailTemplateUrl, scope).then(function (emailBody) {
                console.log(emailBody);
                var emailRequest = generateEmailRequest(emailBody, recipients, assignRoleDeclinedEmailSubject);
                return dfaDataService.post(sendEmailPostUrl, emailRequest);
            });
        }

        function assignRoleDeletedEmail(dfaHolder, egm) {


            var assignRoleDeletedEmailTemplateUrl = "../common/emailTemplates/assignRoleDeletedEmailTemplate.html";
            var assignRoleDeletedEmailSubject = "DFA Online - DFA Allocations have been Removed";

            if (egm) {
                var egmEmailAddress = egm.EMail;
            }
            else if (!egm) { // if no recipient, then no EGM is set up, send to an admin instead
              egmEmailAddress = vm.email.dfaAdminEmail; //this should be admin email.
            }

            var recipients = [
              dfaHolder.Name.EMail,
              vm.email.sysAccountantEmail,
              vm.email.maximEmail,
              egmEmailAddress
              //,vm.email.testingEmailAddress
            ];

            console.log(dfaHolder);

            var scope = $rootScope.$new();
            scope.data = {
                descriptionOfEmail: dfaHolder.Name.Title + " no longer holds any Delegations of Authority.",
                emailHeader: "DFA Holder Removed",
                personName: dfaHolder.Name.Title,
                roleName: dfaHolder.RoleID.RoleName
                //notes: dfaHolder.Notes,
                //dashboardURL: dashboardURL,
                //startDate: moment(dfaHolder.EmploymentStartDate).format("DD/MM/YYYY"),
                //endDate: moment(dfaHolder.EmploymentEndDate).format("DD/MM/YYYY"),
                //dfaList: buildDfaList(dfaHolder.RoleID),
                //contractor: dfaHolder.Contractor,
                //declinee: declinee
            };

            return generateEmailHtml(assignRoleDeletedEmailTemplateUrl, scope).then(function (emailBody) {
                console.log(emailBody);
                var emailRequest = generateEmailRequest(emailBody, recipients, assignRoleDeletedEmailSubject);
                return dfaDataService.post(sendEmailPostUrl, emailRequest);
            });
        }


        function sampleSignatureEmail(person) {

            var sampleSignatureEmailTemplateUrl = "../common/emailTemplates/sampleSignatureEmailTemplate.html";
            var sampleSignatureEmailSubject = "DFA Online - Sample signature required";
            var recipients = [
              person.Name.EMail
              //,vm.email.testingEmailAddress
            ];

            var scope = $rootScope.$new();
            scope.data = {
                descriptionOfEmail: "Finance requires a record of your signature for your DFA allocation",
                personName: person.Name.Title
            };

            return generateEmailHtml(sampleSignatureEmailTemplateUrl, scope).then(function (emailBody) {
                console.log(emailBody);
                var emailRequest = generateEmailRequest(emailBody, recipients, sampleSignatureEmailSubject);
                return dfaDataService.post(sendEmailPostUrl, emailRequest);
            });
        }

        function subDelegateEmail(subDelegatorManagerEmail, subDelegatorEgmEmail, subDelegation, deletedEmail) {

            var subDelegator = subDelegation.DFAInitiator.Name.Title;
            var subDelegatee = subDelegation.DFAAssignee.Name.Title;
            var startDate = moment(subDelegation.AwayStartDate).format("DD/MM/YYYY");
            var endDate = moment(subDelegation.AwayEndDate).format("DD/MM/YYYY");

            var subDelegateEmailTemplateUrl = "../common/emailTemplates/subDelegateEmailTemplate.html";
            var subDelegateEmailSubject = "" + subDelegator
              + " - Temporary Sub-Delegation to " + subDelegatee
              + " for the period " + startDate + " to " + endDate;

            console.log(subDelegatorEgmEmail);
            console.log(subDelegatorManagerEmail);

            if (!subDelegatorManagerEmail) { // if the subdelegator doesnt have a manager
                // this should potentially only happen if CEO is sub delegating...
                subDelegatorManagerEmail = adminEmailsArray[0].subDelegatorManagerEmail != null ? adminEmailsArray[0].subDelegatorManagerEmail : 'joshua.salmon@genesisenergy.co.nz';
            }

            if (!subDelegatorEgmEmail) { // if the subdelegator doesnt have an EGM
                // this should potentially only happen if EGM or CEO is sub delegating...
                subDelegatorEgmEmail = adminEmailsArray[0].subDelegatorEgmEmail != null ? adminEmailsArray[0].subDelegatorEgmEmail : 'joshua.salmon@genesisenergy.co.nz';
            }


            var recipients = [
              subDelegatorManagerEmail,
              subDelegatorEgmEmail,
              subDelegation.DFAAssignee.Name.EMail,
              subDelegation.DFAInitiator.Name.EMail, // does sub delegator need an email??
              vm.email.sysAccountantEmail,
              vm.email.maximEmail,
              vm.email.accPayabelEmail
              //,vm.email.testingEmailAddress
            ];

            if (deletedEmail === true) {
              var descriptionOfEmail = " sub-delegation has been deleted";
              var emailHeader = "Deleted Sub-Delegation";
            }
            else {
               descriptionOfEmail = " has Sub-Delegated their DFA";
               emailHeader  = "Temporary Sub-Delegation";
            }

            var scope = $rootScope.$new();
            scope.data = {
              descriptionOfEmail: subDelegator + descriptionOfEmail ,
              emailHeader: emailHeader,
              subDelegator: subDelegator,
              subDelegatee: subDelegatee,
              startDate: startDate,
              endDate: endDate,
              deletedEmail: deletedEmail
            };

            return generateEmailHtml(subDelegateEmailTemplateUrl, scope).then(function (emailBody) {
                console.log(emailBody);
                var emailRequest = generateEmailRequest(emailBody, recipients, subDelegateEmailSubject);
                return dfaDataService.post(sendEmailPostUrl, emailRequest);
            });
        }

        //Builds the DFA Section in the email for New Roles
        function buildDfaList(role) {
            var dfaList = [];
            var dfaMapValues = environmentVariables.dfaMapValues;

            var length = dfaMapValues.length;
            for (var i = 0; i < length; i++) {
                if (role[dfaMapValues[i].columnName] > 0 ) {
                    var dfaItem = {};

                    
                        dfaItem.string = dfaMapValues[i].dfaString;
                        dfaItem.amount = role[dfaMapValues[i].columnName].toLocaleString();
                    

                    dfaList.push(dfaItem);
                }
            }
            console.log(dfaList);

            return dfaList;
        }

        // takes a html template and scope data (contains dynamic variables of email)
        // compiles it and returns the raw html for the email
        function generateEmailHtml(templateUrl, scope) {
            return $templateRequest(templateUrl).then(function (rawHtml) {
                var compiledHtml = $compile(rawHtml)(scope);
                return $timeout(function () {
                    var finalHtml = compiledHtml[0].outerHTML;
                    return finalHtml;
                });
            });
        }

        // generates the post body for the create email request
        // parameters: email body html, array of recipients (email addresses) and the subject string
        function generateEmailRequest(emailBody, recipients, subject) {
            var data = {
                'properties': {
                    '__metadata': {
                        'type': 'SP.Utilities.EmailProperties'
                    },
                    'Body': emailBody,
                    'From': "DFA Online (DEV)",
                    'To': {
                        'results': recipients
                    },
                    'Subject': subject
                }
            };

            return data;
        }

        // get admin emails from DFA emails list 
        // emails are retrieved per environment
        function getAdminEmails(environment) {
            var appUrl = spUrlInfoService.appWebUrl;
            var hostUrl = spUrlInfoService.hostWebUrl;
            // list name
            var dfaEmailList = "DFA Emails";
            // query list columns filtered by environment
            var query = "&$select=Title,testingEmail,dfaAdminEmail,sysAccountantEmail,maximEmail,accPayableEmail,hrEmail,subDelegateManagerEmail,subDelegateEGMEmail&$filter=Title eq '" + environment + "'";

            var url = appUrl + "/_api/SP.AppContextSite(@target)/web/lists/getbytitle('" + dfaEmailList + "')/items?" +
                              "@target='" + hostUrl + "'" + query;
            console.log("Admin Emails List URL - " + url);
            $.ajax({
                url: url,
                headers: {
                    Accept: "application/json;odata=verbose",
                    "Content-Type": "application/json;odata=verbose",
                },
                async: false,
                success: function (data) {
                    var items;
                    var results;
                    if (data != null) {
                        items = data.d;
                        if (items != null) {
                            results = items.results
                            adminEmailsArray.push({
                                "Title": results[0].Title,
                                "testingEmail": results[0].testingEmail,
                                "dfaAdminEmail": results[0].dfaAdminEmail,
                                "sysAccountantEmail": results[0].sysAccountantEmail,
                                "maximEmail": results[0].maximEmail,
                                "accPayableEmail": results[0].accPayableEmail,
                                "hrEmail": results[0].hrEmail,
                                "subDelegateManagerEmail": results[0].subDelegateManagerEmail,
                                "subDelegateEGMEmail": results[0].subDelegateEGMEmail
                            });

                            return adminEmailsArray;
                        }
                    }
                },
                error: function (data) {
                    console.log("An error occurred");
                }
            });
        }

        // return array to be used else where
        function getAdminEmailsArray() {
            return adminEmailsArray;
        }

    }


})();