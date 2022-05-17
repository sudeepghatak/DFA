(function () {
    'use strict';

    angular
            .module("dfaApp")
            .directive('format', [
                '$filter',
                format
            ]);

    function format($filter) {
        return {
            require: '?ngModel',
            link: function (scope, elem, attrs, ctrl) {
                if (!ctrl) return;

                ctrl.$formatters.unshift(function (a) {
                    return $filter('currency')(ctrl.$modelValue, '', 2);
                });

                elem.bind('blur', function (event) {
                    var plainNumber = elem.val().replace(/[^\d|\-+|\.+]/g, '');
                    elem.val($filter(attrs.format)(plainNumber, '', 2));
                });
            }
        };
    }

})();