(function () {
    'use strict';

    angular
        .module('dfaApp')
        .controller('RoleListController', [
            '$anchorScroll',
            'roles',
            'environmentVariables',
            'spUrlInfoService',
            'userIsAdmin',
            RoleListController
        ]);

    function RoleListController($anchorScroll, roles, environmentVariables, spUrlInfoService, userIsAdmin) {

        $anchorScroll();

        var vm = this;

        vm.Title = "Role List";

        vm.roles = roles.data.d.results;
        vm.getRoleName = getRoleName;
        console.log(vm.roles);
        vm.sharePointLink = spUrlInfoService.hostWebUrl + '/Lists/' + environmentVariables.roleList.name;
        vm.userIsAdmin = userIsAdmin;

        var roleMap = {};
        vm.roles.forEach(function (item) {
            roleMap[item.Id] = item.RoleName;
        });

        function getRoleName(id) {
            if (id) {
                return roleMap[id];
            }
        }

        var dfaMap = {};
        var dfaMapValues = environmentVariables.dfaMapValues;
        dfaMapValues.forEach(function (item) {
            dfaMap[item.columnName] = item.dfaString;
        });

        //Purpose: Add each DFA Value into an Object with the DFA String. 
        //I just realised this wasn't even necessary -_- ng-repeat (key, value) sigh...'
        angular.forEach(vm.roles, function (item) {
            //Add an Array to each item
            item.dfaValueObject = [];

            //Then add each item.DFA_[value] to the Object.
            for (var i = 1; i < 27; i++) {
                var obj = {
                    dfaValue: item['DFA_' + i],
                    dfaString: dfaMap['DFA_' + i],
                    dfaKey: 'DFA_' + i
                    //,dfaString: environmentVariables.service.dfaMapValues[i].columnName
                };

         
                item.dfaValueObject.push(obj);
            }
            //Change the order of the DFA1 and DFA2
            var changeDFANum = item.dfaValueObject;
            changeDFANum[0] = changeDFANum.splice(1, 1, changeDFANum[0])[0];
            changeDFANum[4] = changeDFANum.splice(8, 1, changeDFANum[4])[0]; // change DFA9 and DFA5 order
            changeDFANum[7] = changeDFANum.splice(8, 1, changeDFANum[7])[0]; // change DFA8 and DFA5 order
            changeDFANum.splice(2, 0, changeDFANum.splice(-1)[0]); // move last item DFA_26 to position 3
            item.dfaValueObject = changeDFANum;
      
        }); 

    }

})();