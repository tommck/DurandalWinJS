define(['durandal/viewEngine'], function (viewEngine) {
    "use strict";
    return {
        install: function() {
            var parser = viewEngine.parseMarkup;
            viewEngine.parseMarkup = function(markup) {
                // wrap existing parser in an "unsafe" call
                return MSApp.execUnsafeLocalFunction(function() {
                    return parser(markup);
                });
            };
        }
    };
});
