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

/*extern jive */

jive = this.jive || {};
jive.conc = jive.conc || {};

/**
 * A promise - an instance of jive.conc.Promise - is an object that represents
 * the eventual outcome of an asynchronous operation.  This function takes an
 * object that has promises as property values and returns a new promise.  Once
 * all of the promises on the given object are fulfilled `synchronize()` emits
 * success passing a copy of the original object with the success event with
 * any promise property values replaced with the outcomes of those promises.
 *
 * If any of the promises on the given object emits an error the same error
 * will be re-emitted by `synchronize()`.
 *
 * @function
 * @param   {Object|Array}  obj object referencing multiple promises
 * @returns {jive.conc.Promise} returns a promise that is fulfilled when all of the referenced promises have been fulfilled
 * @requires jive.conc.observable
 * @requires jive.conc.Promise
 */
jive.conc.synchronize = (function() {
    function isArray(o) {
        return Object.prototype.toString.call(o) === "[object Array]";
    }
    
    function isPromise(prop) {
        return prop.addCallback && prop.addErrback && prop.addCancelback;
    }

    return function(obj) {
        var outcome, k,
            toBeFulfilled = 0,
            promise = new jive.conc.Promise();
    
        function addCallbacks(name, prop) {
            prop.addCallback(function(val) {
                outcome[name] = val;
                toBeFulfilled -= 1;
    
                // Emit success when all promises are fulfilled.
                if (toBeFulfilled < 1) {
                    promise.emitSuccess(outcome);
                }

            }).addErrback(function(/* args */) {
                promise.emitError.apply(promise, arguments);

            }).addCancelback(function(/* args */) {
                promise.cancel.apply(promise, arguments);
            });
    
            toBeFulfilled += 1;
        }
    
        // Create a copy of the given object.  Handle synchronizing both arrays
        // and objects.
        outcome = isArray(obj) ? [] : {};
    
        for (k in obj) {
            if (obj.hasOwnProperty(k)) {
                if (isPromise(obj[k])) {
                    addCallbacks(k, obj[k]);
                } else {
                    outcome[k] = obj[k];
                }
            }
        }
    
        return promise;
    };
})();
