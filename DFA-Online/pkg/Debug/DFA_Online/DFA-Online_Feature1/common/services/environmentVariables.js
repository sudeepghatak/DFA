(function () {
    'use strict';

    angular
        .module("common.services")
        .service('environmentVariables', ['$window', environmentVariables]);

    function environmentVariables($window) {

        var service = this;

        service.environment = "PROD";
        service.appName = "DFA-Online"; // if you change app name - update this

        service.approvalStage = {};
        service.approvalStage.pending = "Pending";
        service.approvalStage.dfa = "Awaiting Acceptance";
        service.approvalStage.egm = "Awaiting EGM";
        service.approvalStage.ceo = "Awaiting CEO";
        service.approvalStage.approved = "Approved";
        service.approvalStage.declined = "Declined";

        service.userGroup = {};
        service.userGroup.admin = {};
        service.userGroup.admin.name = "DFA Admin Users";
        //service.userGroup.admin.id = 133;/// gedev group
        //service.userGroup.admin.id = 209; // dev group
        //service.userGroup.admin.id = 199; // uat group
        service.userGroup.admin.id = 12; // PROD group

        //Set up for Role Table
        service.roleList = {};
        service.roleList.name = "Role%20Table";
        service.roleList.spDataType = "SP.Data.Role_x0020_TableListItem";
        //service.roleList.dfaNumbers = dfaNumbers(25);
        //Change the order of the DFA1 and DFA2
        var changeDFANum = dfaNumbers(26);
        /*changeDFANum[0] = changeDFANum.splice(1, 1, changeDFANum[0])[0];
        changeDFANum[4] = changeDFANum.splice(6, 1, changeDFANum[4])[0]; // change DFA9 and DFA5 order
        changeDFANum[5] = changeDFANum.splice(6, 1, changeDFANum[5])[0]; // change DFA8 and DFA6 order
        changeDFANum.splice(2, 0, changeDFANum.splice(-1)[0]); // move last item DFA_26 to position 3*/
        service.roleList.dfaNumbers = changeDFANum;

        service.roleList.select = "&$select=Id,RoleName,ManagerID,EGMID,CostCentre,"
            + service.roleList.dfaNumbers.toString() + "&$top=1000";
        service.roleList.selectSingle = "&$select=Id,RoleName,ManagerID,EGMID,CostCentre,"
            + service.roleList.dfaNumbers.toString();
        service.roleList.selectActive = service.roleList.select + "&$orderby=RoleName&$filter=Deleted ne 1"; // where deleted is not true &$orderby=Name/Title
        //Set up for Dfa Holder Table

        //https://sharepoint.stackexchange.com/questions/171288/rest-expand-people-column

        service.holderList = {};
        service.holderList.name = "DFA%20Holder%20Table";
        service.holderList.spDataType = "SP.Data.DFA_x0020_Holder_x0020_TableListItem";
        //service.holderList.dfaNumbersForHolder = dfaNumbersForHolder(25);

        //Change the order of the DFA1 and DFA2 
        var changeDFAHolderNum = dfaNumbersForHolder(27);
       /* changeDFAHolderNum[0] = changeDFAHolderNum.splice(1, 1, changeDFAHolderNum[0])[0];
        changeDFAHolderNum[4] = changeDFAHolderNum.splice(6, 1, changeDFAHolderNum[4])[0];
        changeDFAHolderNum[5] = changeDFAHolderNum.splice(6, 1, changeDFAHolderNum[5])[0];
        changeDFAHolderNum.splice(2, 0, changeDFAHolderNum.splice(-1)[0]); // move last item DFA_26 to position 3*/
        service.holderList.dfaNumbersForHolder = changeDFAHolderNum;

        service.holderList.select = "&$Select=RoleIDId,Title,ID,Modified,Name/Title,Name/Id,Name/EMail,Name/FirstName,Name/Department,"
            + "Name/JobTitle,Name/WorkPhone,EmploymentStartDate,EmploymentEndDate,Contractor,"
            + "RoleID/Title,RoleID/ID,RoleID/RoleName,RoleID/ManagerID,RoleID/EGMID,RoleID/CostCentre,Notes,EmailNote,ApprovalStage,"
            + service.holderList.dfaNumbersForHolder.toString() + "&$expand=Name,RoleID" + "&$top=1000";
        service.holderList.selectSingle = "&$Select=RoleIDId,Title,ID,Modified,Name/Title,Name/Id,Name/EMail,Name/FirstName,Name/Department,"
            + "Name/JobTitle,Name/WorkPhone,EmploymentStartDate,EmploymentEndDate,Contractor,"
            + "RoleID/Title,RoleID/ID,RoleID/RoleName,RoleID/ManagerID,RoleID/EGMID,RoleID/CostCentre,Notes,EmailNote,ApprovalStage,"
            + service.holderList.dfaNumbersForHolder.toString() + "&$expand=Name,RoleID";
        service.holderList.selectActive = service.holderList.select + "&$orderby=Name/Title&$filter=Deleted ne 1"; // where deleted is not true
        service.holderList.selectByCurrentUser = service.holderList.select + "&$filter=Deleted ne 1 and NameId eq ";
        service.holderList.selectByRole = "&$Select=Name/Title,Name/Id,Name/EMail,Name/FirstName"
            + "&$expand=Name&$filter=Deleted ne 1 and RoleIDId eq ";
        service.holderList.notificationQuery = notificationQuery;
        service.holderList.allNotificationQuery =
            "&$Select=ID,Modified,ApprovalStage,EmploymentEndDate,EmploymentStartDate,Contractor,Notes,Name/Title,Name/EMail,NameId,RoleIDId,RoleID/ID,RoleID/RoleName,RoleID/CostCentre,RoleID/ManagerID,RoleID/EGMID"
                + ',' + service.holderList.dfaNumbersForHolder.toString()
                + "&$expand=Name/Title,RoleID"
                + "&$filter=Deleted ne 1 and (ApprovalStage%20eq%20'" + service.approvalStage.dfa + "'"
                + "%20or%20ApprovalStage%20eq%20'" + service.approvalStage.ceo + "'"
                + "%20or%20ApprovalStage%20eq%20'" + service.approvalStage.egm + "')" + "&$top=1000";
                            
        //Set up for Sub-Delegate Table
        service.subDelegateList = {};
        service.subDelegateList.name = "Sub-Delegation%20Table";
        service.subDelegateList.listLink = "SubDelegation%20Table";
        service.subDelegateList.spDataType = "SP.Data.SubDelegation_x0020_TableListItem";
        service.subDelegateList.select = "&$select=Id,AwayStartDate,AwayEndDate,acceptedDFAPolicy,DFAInitiator/Id,DFAInitiator/EmploymentStartDate,DFAAssignee/Id" 
            + "&$expand=DFAInitiator,DFAAssignee" + "&$top=1000";
        service.subDelegateList.selectSingle = "&$select=Id,AwayStartDate,AwayEndDate,acceptedDFAPolicy,DFAInitiator/Id,DFAInitiator/EmploymentStartDate,DFAAssignee/Id" 
            + "&$expand=DFAInitiator,DFAAssignee";
        service.subDelegateList.selectByCurrentUser = service.subDelegateList.select + "&$filter=Deleted ne 1 and DFAInitiatorId eq ";
        service.subDelegateList.selectActive = service.subDelegateList.select + "&$filter=Deleted ne 1"; // where deleted is not true
        service.subDelegateList.specificSubDelegationsQuery = specificSubDelegationsQuery;
        service.subDelegateList.usersCurrentSubDelegationsQuery = usersCurrentSubDelegationsQuery;

        service.baseUrl = getBaseUrlFromWindow();

        service.dfaMapValues = [
            { "columnName": "DFA_1", "dfaString": "Capital Expenditure (\"Capex\")" },
            { "columnName": "DFA_2", "dfaString": "Revenue Expenditure (\"Opex\")" },
            { "columnName": "DFA_3", "dfaString": "Electricity, Gas, LPG, Coal and Oil Purchase or Sale Contracts (Total Value)" },
            { "columnName": "DFA_4", "dfaString": "Electricity distribution agreements/contracts, and gas transmission and distribution agreements/contracts (per year)" },
            { "columnName": "DFA_5", "dfaString": "Individual employment agreements or contract (with third party) for head count roles needing an ATR (per year)" },
            { "columnName": "DFA_8", "dfaString": "Third Party contracts for goods and services including consultants (but not including head count consultants, see Row 7 above)" },
            { "columnName": "DFA_9", "dfaString": "Approval of purchase requisitions and invoices for:\n • Electricity & Gas Transmission and Distribution (Lines Companies), \n • Metering Field Services and Meter Leasing, \n • Sale & Purchase of Electricity and Ancillary Services, \n • Sale & Purchase of Gas, LPG and Coal and associated fuel transport and storage costs (including coal trucking, shipping, stevedores, Tauranga shed costs & Liquigas LPG costs)" },
            { "columnName": "DFA_10", "dfaString": "Kupe Join Venture Annual Production Work Programme" },
            { "columnName": "DFA_11", "dfaString": "Foreign Exchange Transactions (face value per contract)" },
            //{ "columnName": "DFA_12", "dfaString": "Foreign Exchange Transactions for USD Revenues (face value per contract)" },
            { "columnName": "DFA_13", "dfaString": "Interest Rate and Inflation Rate Transactions up to 10 years (face value per contract)" },
            { "columnName": "DFA_14", "dfaString": "Crude Oil Price Financial Instruments (face value per contract)" },
            { "columnName": "DFA_15", "dfaString": "Other Commodity Price Financial Instruments approved under the Treasury Management Policy (face value per contract) USD" },
            { "columnName": "DFA_16", "dfaString": "Electricity and Gas derivatives.  Carbon derivatives and spot purchase or sale contracts.   (face value per contract - refer application guidance re definition of face value)" },
            { "columnName": "DFA_17", "dfaString": "Asset disposals (based on the higher of estimated fair market value or the absolute value of the expected gain/loss on disposal),  and asset impairments (excluding generation asset revaluation adjustments)" },
            { "columnName": "DFA_18", "dfaString": "Mass Market (residential and small commercial) tariff changes (electricty LPG and gas) subject to report to Chief Executive prior to implementation" },
            { "columnName": "DFA_19", "dfaString": "Debtor write-offs and customer account adjustments" },
            { "columnName": "DFA_20", "dfaString": "Payment of all corporate taxes" },
            { "columnName": "DFA_21", "dfaString": "Interest payments on loans and bonds" },
            //{ "columnName": "DFA_22", "dfaString": "Dividend payments subsequent to Board Declaration" },
            { "columnName": "DFA_23", "dfaString": "Margin Calls on Futures Clearing Accounts" },
            { "columnName": "DFA_24", "dfaString": "Prudential deposits for Electricity Markets" },
            { "columnName": "DFA_25", "dfaString": "Intercompany Payments/Loans outside Guaranteeing Group" },
            { "columnName": "DFA_26", "dfaString": "Approval of Project business cases" }, // Add new field
            { "columnName": "DFA_27", "dfaString": "Land and Property agreements for Sale & Purchases, Leases, Licences to Occupy, Options." }, // Add new field
            { "columnName": "DFA_28", "dfaString": "Coal and LPG derivatives (face value per contract (USD)  refer application guidance re definition of face value)" } // Add new field
        ];


        
        /* Notification filter
         * 
         * Where Approval Stage eq 'DFA' AND Current User ID equals NameID in DFA Table
         * 
         * OR Where Approval Stage eq 'CEO' AND CurrentUser RoleName eq 'CEO' 
         * - potential to break may need another way of identifying CEO (for if CEO RoleName Changes)
         *  the AND CurrentUser RoleName eq 'CEO' cant be done in the query so is done in app.js 
         * 
         * OR Where Approval Stage eq 'EGM' AND CurrentUser Role ID eq RoleID/EGMID
         * 
         */
        function notificationQuery(currentUserId, currentUserRoleId) {
            var query = "&$Select=ID,Modified,ApprovalStage,EmploymentEndDate,EmploymentStartDate,Contractor,Notes,Name/Title,Name/EMail,NameId,RoleIDId,RoleID/ID,RoleID/RoleName,RoleID/CostCentre,RoleID/ManagerID,RoleID/EGMID,Author/Title,Author/EMail,Author/LastName"
                + ',' + service.holderList.dfaNumbersForHolder.toString() 
                + "&$expand=Name/Title,Author/Title,Author/EMail,Author/LastName,RoleID&$filter=Deleted ne 1 and ApprovalStage%20eq%20'" + service.approvalStage.dfa + "'%20and%20NameId%20eq%20" + currentUserId
                + "%20or%20ApprovalStage%20eq%20'" + service.approvalStage.ceo + "'";

            if (currentUserRoleId) { // dont actually know if the if statement is needed
                // was just in case currentUserRoleId could be null/undefined
                query += "%20or%20ApprovalStage%20eq%20'" + service.approvalStage.egm + "'%20and%20RoleID/EGMID%20eq%20" + currentUserRoleId;
            }

            query += "&$top=1000";

            return query;
        }

        /*
            To Filter Dates in SharePoint you must include
            datetime 'YYYY-MM-DD THH:MM:SS'
            For example: &$filter = dateColumn eq datetime '2017-05-24T12:00:00'
            If you use moment.js ISO timeformat SharePoint doesn't like that because it is missing T.
        */
        function specificSubDelegationsQuery(select, startDate, endDate) {
            var query = select;

            //var startDate = moment().format('YYYY-MM-DD');
            var filter = "&$filter=(AwayStartDate le datetime" + "'" + endDate + "T00:00:00'"
            + " and AwayEndDate ge datetime" + "'" + startDate + "T00:00:00') and Deleted ne 1";

            return query + filter;
        }

        function usersCurrentSubDelegationsQuery(select, personId) {
            var query = select;

            var today = moment().format('YYYY-MM-DD');

            var filter = "&$orderBy=AwayStartDate&$filter=(AwayEndDate ge datetime" + "'" + today + "T00:00:00' and Deleted ne 1" +
            "and DFAInitiatorId eq " + personId + ") or " +
            "(AwayEndDate ge datetime" + "'" + today + "T00:00:00' and Deleted ne 1 " +
            "and DFAAssigneeId eq " + personId + ")";

            return query + filter;
        }

        //used to grab all dfa values from Role table
        function dfaNumbers(lastNumber) {
            var dfaNumbers = [];
            
            dfaNumbers.push("DFA_2");
            dfaNumbers.push("DFA_1");
            dfaNumbers.push("DFA_26");
            dfaNumbers.push("DFA_3");
            dfaNumbers.push("DFA_4");
            dfaNumbers.push("DFA_9");
            dfaNumbers.push("DFA_5");
            dfaNumbers.push("DFA_8");
            dfaNumbers.push("DFA_27");
            dfaNumbers.push("DFA_10");
            dfaNumbers.push("DFA_11");
            dfaNumbers.push("DFA_13");
            dfaNumbers.push("DFA_14");
            dfaNumbers.push("DFA_15");
            dfaNumbers.push("DFA_16");
            dfaNumbers.push("DFA_28");
            dfaNumbers.push("DFA_17");
            dfaNumbers.push("DFA_18");
            dfaNumbers.push("DFA_19");
            dfaNumbers.push("DFA_20");
            dfaNumbers.push("DFA_21");
            dfaNumbers.push("DFA_23");
            dfaNumbers.push("DFA_24");
            dfaNumbers.push("DFA_25");

            
           
            return dfaNumbers;
        }
        //used to grab all dfa values to Person table from Role table
        function dfaNumbersForHolder(lastNumber) {
            var dfaNumbersForHolders = [];
            dfaNumbersForHolders.push("RoleID/DFA_2");
            dfaNumbersForHolders.push("RoleID/DFA_1");
            dfaNumbersForHolders.push("RoleID/DFA_26");
            dfaNumbersForHolders.push("RoleID/DFA_3");
            dfaNumbersForHolders.push("RoleID/DFA_4");
            dfaNumbersForHolders.push("RoleID/DFA_9");
            dfaNumbersForHolders.push("RoleID/DFA_5");
            dfaNumbersForHolders.push("RoleID/DFA_8");
            dfaNumbersForHolders.push("RoleID/DFA_27");
            dfaNumbersForHolders.push("RoleID/DFA_10");
            dfaNumbersForHolders.push("RoleID/DFA_11");
            dfaNumbersForHolders.push("RoleID/DFA_13");
            dfaNumbersForHolders.push("RoleID/DFA_14");
            dfaNumbersForHolders.push("RoleID/DFA_15");
            dfaNumbersForHolders.push("RoleID/DFA_16");
            dfaNumbersForHolders.push("RoleID/DFA_28");
            dfaNumbersForHolders.push("RoleID/DFA_17");
            dfaNumbersForHolders.push("RoleID/DFA_18");
            dfaNumbersForHolders.push("RoleID/DFA_19");
            dfaNumbersForHolders.push("RoleID/DFA_20");
            dfaNumbersForHolders.push("RoleID/DFA_21");
            dfaNumbersForHolders.push("RoleID/DFA_23");
            dfaNumbersForHolders.push("RoleID/DFA_24");
            dfaNumbersForHolders.push("RoleID/DFA_25");

            
            return dfaNumbersForHolders;
        }



        // setting url to value returned from here puts sharepoint params back on query string
        function getBaseUrlFromWindow() {

            var windowUrl = $window.location.href;

            var lowerUrl = windowUrl.toLowerCase();

            var theSubStr = service.appName.toLowerCase();

            var theIndex = lowerUrl.indexOf(theSubStr);

            var baseUrl = lowerUrl.substr(0, theIndex + theSubStr.length);

            return baseUrl;
        }
    }

})();