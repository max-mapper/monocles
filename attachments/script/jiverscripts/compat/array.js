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

/**
 * Implements Array methods from the ECMAScript 5 standard in browsers that do
 * not support them natively.
 *
 * From JiverScripts
 * http://github.com/jivesoftware/jiverscripts
 */

/**
 * Invokes `fun` on each element of the array in turn.
 *
 * The first argument given to `fun` is a single array element and the second
 * argument is the index of that element in the array.
 *
 * This definition is compatible with the JavaScript 1.6 definition for
 * `Array#forEach` in Spidermonkey.
 *
 * This implementation comes from:
 * https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/forEach
 *
 * @function
 * @param   {Function}  fun     function that will be applied to each array
 * element
 * @param   {Object}    [thisp] context in which `fun` will be invoked - `this`
 * in `fun` will refer to `thisp`
 */
Array.prototype.forEach = Array.prototype.forEach || function(fun /*, thisp*/) {
    var len = this.length >>> 0;
    if (typeof fun != "function") {
        throw new TypeError();
    }

    var thisp = arguments[1];
    for (var i = 0; i < len; i++) {
        if (i in this) {
            fun.call(thisp, this[i], i, this);
        }
    }
};

/**
 * Invokes `fun` on each element of the array and returns a new array of the
 * results of each application.
 *
 * The first argument to `fun` is a single array
 * element and the second argument is the index of that element in the array.
 *
 * This definition is compatible with the JavaScript 1.6 definition for
 * `Array#map` in Spidermonkey and with the definition in the Prototype library.
 *
 * This implementation comes from:
 * https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Array/map
 *
 * @function
 * @param   {Function}  fun     function that will be applied to each array element
 * @param   {Object}    [thisp] context in which `fun` will be invoked - `this`
 * in `fun` will refer to `thisp`
 * @returns {Array} a new array made up of the return values of every invocation of `fun`
 */
Array.prototype.map = Array.prototype.map || function(fun /*, thisp*/) {
    var len = this.length >>> 0;
    if (typeof fun != "function") {
        throw new TypeError();
    }

    var res = new Array(len);
    var thisp = arguments[1];
    for (var i = 0; i < len; i++) {
        if (i in this) {
            res[i] = fun.call(thisp, this[i], i);
        }
    }

    return res;
};

/**
 * Applies `fun` to `initial` and the first element of the array, and then to the
 * result and the second element, and so on.  Returns the result of applying
 * `fun` to the accumulated value and the last element of the array.
 *
 * `fun` is given four arguments:
 * <ol>
 * <li>the result of the previous invocation of `fun`, or the initial value on the first invocation</li>
 * <li>a single array element</li>
 * <li>the index of that element in the array</li>
 * <li>the original array</li>
 * </ol>
 *
 * The 'reduce' algorithm is also known as 'fold' and 'inject'.
 *
 * This definition is *not* compatible with the definitions of `Array#reduce`
 * or `Array#inject` in the Prototype library.  However it is compatible with
 * the JavaScript 1.6 definition of `Array#reduce` in Spidermonkey.
 *
 * This implementation comes from:
 * https://developer.mozilla.org/En/Core_JavaScript_1.5_Reference/Global_Objects/Array/Reduce
 *
 * @function
 * @param   {Function}  fun     function that will be applied to each array element
 * @param   {any}       [initial]   initial value; defaults to the first array element
 * @returns {any}       the return value from the last invocation of `fun`
 */
Array.prototype.reduce = Array.prototype.reduce || function(fun /*, initial*/) {
    var len = this.length >>> 0;
    if (typeof fun != "function") {
        throw new TypeError();
    }

    // no value to return if no initial value and an empty array
    if (len == 0 && arguments.length == 1) {
        throw new TypeError();
    }

    var i = 0;
    if (arguments.length >= 2) {
        var rv = arguments[1];
    } else {
        do {
            if (i in this) {
                rv = this[i++];
                break;
            }

            // if array contains no values, no initial value to return
            if (++i >= len) {
                throw new TypeError();
            }
        } while (true);
    }

    for (; i < len; i++) {
        if (i in this) {
            rv = fun.call(null, rv, this[i], i, this);
        }
    }

    return rv;
};

/**
 * Applies `fun` to `initial` and the last element of the array, and then to
 * the result and the second-to-last element, and so on.  Returns the result of
 * applying `fun` to the accumulated value and the first element of the array.
 *
 * `fun` is given four arguments:
 * <ol>
 * <li>the result of the previous invocation of `fun`, or the initial value on the first invocation</li>
 * <li>a single array element</li>
 * <li>the index of that element in the array</li>
 * <li>the original array</li>
 * </ol>
 *
 * This method behaves identically to Array#reduce except that it performs a
 * right-reduce instead of a left-reduce.
 *
 * This definition is compatible with the JavaScript 1.6 definition of
 * `Array#reduceRight` in Spidermonkey.
 *
 * This implementation comes from:
 * https://developer.mozilla.org/En/Core_JavaScript_1.5_Reference/Global_Objects/Array/Reduce
 *
 * @function
 * @param   {Function}  fun     function that will be applied to each array element
 * @param   {any}       [initial]   initial value; defaults to the last array element
 * @returns {any}       the return value from the last invocation of `fun`
 */
Array.prototype.reduceRight = function(fun /*, initial*/) {
    var len = this.length >>> 0;
    if (typeof fun != "function") {
        throw new TypeError();
    }

    // no value to return if no initial value, empty array
    if (len == 0 && arguments.length == 1) {
        throw new TypeError();
    }

    var i = len - 1;
    if (arguments.length >= 2) {
        var rv = arguments[1];
    } else {
        do {
            if (i in this) {
                var rv = this[i--];
                break;
            }

            // if array contains no values, no initial value to return
            if (--i < 0) {
                throw new TypeError();
            }
        } while (true);
    }

    for (; i >= 0; i--) {
        if (i in this) {
            rv = fun.call(null, rv, this[i], i, this);
        }
    }

    return rv;
};

/**
 * Applies `fun` to each element of the array and returns a new array of all
 * the values for which `fun` returned `true`.
 *
 * The first argument given to `fun` is a single array element and the second
 * argument is the index of that element in the array.
 *
 * This definition is compatible with the JavaScript 1.6 definition for
 * `Array#filter` in Spidermonkey and with the definition in the Prototype library.
 *
 * This implementation comes from:
 * https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Array/filter
 *
 * @function
 * @param   {Function}  fun     predicate function that will be applied to each
 * array element
 * @param   {Object}    [thisp] context in which `fun` will be invoked - `this`
 * in `fun` will refer to `thisp`
 * @returns {Array} a new array containing only the elements for which `fun` return true
 */
Array.prototype.filter = Array.prototype.filter || function(fun /*, thisp*/) {
    var len = this.length >>> 0;
    if (typeof fun != "function") {
        throw new TypeError();
    }

    var res = new Array();
    var thisp = arguments[1];
    for (var i = 0; i < len; i++) {
        if (i in this) {
            var val = this[i]; // in case fun mutates this
            if (fun.call(thisp, val, i)) {
                res.push(val);
            }
        }
    }

    return res;
};

/**
 * Invokes `fun` on each element of the array and returns true if every
 * invocation of `fun` returns true or returns a truthy value.  Otherwise
 * returns false.
 *
 * The first argument given to `fun` is a single array element and the second
 * argument is the index of that element in the array.
 *
 * This definition is compatible with the JavaScript 1.6 definition for
 * `Array#every` in Spidermonkey.
 *
 * This implementation comes from:
 * https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Array/every
 *
 * @function
 * @param   {Function}  fun     predicate function that will be applied to each
 * array element
 * @param   {Object}    [thisp] context in which `fun` will be invoked - `this`
 * in `fun` will refer to `thisp`
 * @returns {Boolean}   true if `fun` returned true for every array element, false otherwise
 */
Array.prototype.every = Array.prototype.every || function(fun /*, thisp*/)  {
    var len = this.length >>> 0;
    if (typeof fun != "function") {
        throw new TypeError();
    }

    var thisp = arguments[1];
    for (var i = 0; i < len; i++) {
        if (i in this &&
            !fun.call(thisp, this[i], i, this)) {
            return false;
        }
    }

    return true;
};

/**
 * Invokes `fun` on each element of the array and returns true if at least one
 * invocation of `fun` returns true or returns a truthy value.  Otherwise
 * returns false.
 *
 * The first argument given to `fun` is a single array element and the second
 * argument is the index of that element in the array.
 *
 * This definition is compatible with the JavaScript 1.6 definition for
 * `Array#every` in Spidermonkey.
 *
 * This implementation comes from:
 * https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Array/some
 *
 * @function
 * @param   {Function}  fun     predicate function that will be applied to each
 * array element
 * @param   {Object}    [thisp] context in which `fun` will be invoked - `this`
 * in `fun` will refer to `thisp`
 * @returns {Boolean}   true if `fun` returned true for some array element, false otherwise
 */
Array.prototype.some = Array.prototype.some || function(fun /*, thisp*/) {
    var i = 0,
        len = this.length >>> 0;

    if (typeof fun != "function") {
        throw new TypeError();
    }

    var thisp = arguments[1];
    for (; i < len; i++) {
        if (i in this &&
            fun.call(thisp, this[i], i, this)) {
            return true;
        }
    }

    return false;
};

/**
 * Compares elements in the array with `searchElement` using strict equality
 * (===).  If any element matches `searchElement` the lowest matching index is
 * returned.  Otherwise -1 is returned.
 *
 * You can optionally restrict the search by passing a `fromIndex` argument.
 *
 * This definition is compatible with the JavaScript 1.6 definition for
 * `Array#indexOf` in Spidermonkey.
 *
 * This implementation comes from:
 * https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Array/indexOf
 *
 * @function
 * @param   {any}       searchElement   element to search for within the array
 * @param   {number}    [fromIndex]     index at which to begin search
 * @returns {number}    the index of the matching element if one is found, -1 otherwise
 */
Array.prototype.indexOf = Array.prototype.indexOf || function(elt /*, from*/) {
    var len = this.length >>> 0;

    var from = Number(arguments[1]) || 0;
    from = (from < 0)
        ? Math.ceil(from)
        : Math.floor(from);
    if (from < 0) {
        from += len;
    }

    for (; from < len; from++) {
        if (from in this &&
            this[from] === elt) {
            return from;
        }
    }
    return -1;
};

/**
 * Compares elements in the array with `searchElement` using strict equality
 * (===).  If any element matches `searchElement` the highest matching index is
 * returned.  Otherwise -1 is returned.
 *
 * You can optionally restrict the search by passing a `fromIndex` argument.
 *
 * This definition is compatible with the JavaScript 1.6 definition for
 * `Array#indexOf` in Spidermonkey.
 *
 * This implementation comes from:
 * https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Array/indexOf
 *
 * @function
 * @param   {any}       searchElement   element to search for within the array
 * @param   {number}    [fromIndex]     index at which to begin search
 * @returns {number}    the index of the matching element if one is found, -1 otherwise
 */
Array.prototype.lastIndexOf = Array.prototype.lastIndexOf || function(elt /*, from*/)  {
    var len = this.length;

    var from = Number(arguments[1]);
    if (isNaN(from)) {
        from = len - 1;
    } else {
        from = (from < 0)
            ? Math.ceil(from)
            : Math.floor(from);
        if (from < 0) {
            from += len;
        } else if (from >= len) {
            from = len - 1;
        }
    }

for (; from > -1; from--) {
    if (from in this &&
        this[from] === elt)
        return from;
    }
    return -1;
};
