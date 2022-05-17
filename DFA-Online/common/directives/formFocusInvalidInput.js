(function () {
    'use strict';

    angular
            .module("dfaApp")
            .directive('formFocusInvalidInput', [formFocusInvalidInput]);

    function formFocusInvalidInput() {
        return {
            restrict: 'A',
            link: function (scope, elem) {

                elem.bind('keydown', function (event) { // stop enter button submitting form
                    if (13 === event.which) { // if enter key is pressed
                        event.preventDefault(); // Doesn't work at all
                        window.stop(); // Works in all browsers but IE...
                        document.execCommand('Stop'); // Works in IE
                    }
                });

                // set up event handler on the form element
                elem.on('submit', function () {
                    // find the first invalid element
                    var firstInvalid = elem[0].querySelector('.ng-invalid');

                    // if we find one, set focus
                    if (firstInvalid) {
                        console.log("Form focus");
                        console.log(firstInvalid);
                        firstInvalid.focus();
                    }
                });
            }
        };
    }

})();