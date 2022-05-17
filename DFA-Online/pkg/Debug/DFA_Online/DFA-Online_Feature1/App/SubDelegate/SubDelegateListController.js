(function () {
    'use strict';

    angular
        .module('dfaApp')
        .controller('SubDelegateListController', [
            '$state',
            '$anchorScroll',
            'allSubDelegations',
            'allDfaHolders',
            'spUrlInfoService',
            'environmentVariables',
            'userIsAdmin',
            SubDelegateListController
        ]);

    function SubDelegateListController($state, $anchorScroll,
        allSubDelegations, allDfaHolders, spUrlInfoService, environmentVariables, userIsAdmin) {

      $anchorScroll();

        var vm = this;
        vm.Title = "Sub-Delegate List";
        vm.subDelegate = allSubDelegations.data.d.results;
        vm.allDfaHolders = allDfaHolders.data.d.results;
        vm.sharePointLink = spUrlInfoService.hostWebUrl + '/Lists/' + environmentVariables.subDelegateList.listLink;
        vm.userIsAdmin = userIsAdmin;
        vm.filterStartDates = filterStartDates;
        vm.filterEndDates = filterEndDates;
        vm.clearFilters = clearFilters;

      vm.getPersonFromDFAID = getPersonFromDFAID;

      var personMap = {};
      vm.allDfaHolders.forEach(function (item) {
        personMap[item.Id] = item.Name.Title;
      });

      function getPersonFromDFAID(id) {
        if (id) {
          return personMap[id];
        }
      }

      function filterStartDates(item) {
        /**Declarations           */
        //Repeated item in the NG-Repeat
        var itemStartDate = moment(item.AwayStartDate);
        //Retrieving the Start Date Inputs
        var startStartDate = moment(vm.subDelegateStartStartDate);
        var startEndDate = moment(vm.subDelegateStartEndDate);
        //Logic:
        //1. Only execute the filter if the Input is filled in
        //   Then return items within the range which are true. 
        if (vm.subDelegateStartStartDate && vm.subDelegateStartEndDate) {

          if (itemStartDate < startStartDate) return false;
          if (itemStartDate > startEndDate) return false;
        }

        return true;
      }

      function filterEndDates(item) {
        /**Declarations           */
        //Repeated item in the NG-Repeat
        var itemEndDate = moment(item.AwayEndDate);
        //Retrieving the End Date Inputs
        var endStartDate = moment(vm.subDelegateEndStartDate);
        var endEndDate = moment(vm.subDelegateEndEndDate);

        //Logic:
        //1. Only execute the filter if the Input is filled in
        //   Then return items within the range which are true. 
        if (vm.subDelegateEndStartDate && vm.subDelegateEndEndDate) {
          if (itemEndDate < endStartDate) return false;
          if (itemEndDate > endEndDate) return false;
        }

        return true;
      }

      function clearFilters() {
        console.log("hello");
        vm.subDelegateStartStartDate = null;
        vm.subDelegateStartEndDate = null;
        vm.subDelegateEndStartDate = null;
        vm.subDelegateEndEndDate = null;
      }

    }
    
})();