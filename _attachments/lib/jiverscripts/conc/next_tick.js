/*
 * Copyright 2010 Jive Software
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*jslint undef:true browser:true */
/*extern jive */

jive = this.jive || {};
/**
 * Namespace grouping together classes and functions dealing with events and
 * asynchronous execution.
 *
 * @namespace
 * @name jive.conc
 */
jive.conc = jive.conc || {};

/**
 * Invokes the given function asynchrously with the smallest delay possible.
 * Using this function is similar to calling `setTimeout()` with a delay of
 * zero milliseconds - except that `nextTick()` should invoke callbacks with a
 * much shorter delay than `setTimeout()` does.
 *
 * This code is adapted from [David Baron's example][1].
 *
 * [1]: http://dbaron.org/log/20100309-faster-timeouts  "Faster Timeouts"
 *
 * @function
 * @param   {Function}  fn  function to invoke asynchronously
 */
jive.conc.nextTick = (function() {
    // For browsers that support it, the postMessage API is the lowest-latency
    // option for running code asynchronously.
    if (window.postMessage && window.addEventListener) {
        return (function() {
            var timeouts = [],
                messageName = "next-tick-message";

            // Like setTimeout, but only takes a function argument.  There's
            // no time argument (always zero) and no arguments (you have to
            // use a closure).
            function nextTick(fn) {
                timeouts.push(fn);
                window.postMessage(messageName, "*");
            }

            function handleMessage(event) {
                if (event.source == window && event.data == messageName) {
                    event.stopPropagation();
                    if (timeouts.length > 0) {
                        var fn = timeouts.shift();
                        fn();
                    }
                }
            }

            window.addEventListener("message", handleMessage, true);

            return nextTick;
        })();

    // For browsers that do not support postMessage fall back to setTimeout.
    } else {
        return function(fn) {
            setTimeout(fn, 0);
        };
    }
})();
