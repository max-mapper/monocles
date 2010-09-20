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

/*jslint undef:true laxbreak:true browser:true */
/*global jive */

jive = this.jive || {};
jive.conc = jive.conc || {};

/**
 * This is a mix in that can add methods to any object for emitting events and
 * for registering event listeners.  This can be useful, for example, to create
 * view classes that emit events that a controller class can listen to and
 * handle.  That way view classes can push information to the controller
 * without having to know about the implementation of the controller.
 *
 * jive.conc.observable is a function.  Call it with some object as an argument
 * and it will add methods to that object.  For example:
 *
 *     var MyClass = function(...) { ... };
 *     jive.conc.observable(MyClass.prototype);
 *
 *     var myObj = new MyClass();
 *     myObj.addListener('someChange', function(changedValue) {
 *         alert(changedValue + ' just changed!');
 *     });
 *     myObj.listeners('someChange');  //=> [function(changedValue) { ... }]
 *
 * The events that jive.conc.observable makes possible are completely distinct
 * from DOM events.  These events are triggered on JavaScript objects, not DOM
 * elements.  However as with DOM events, listeners registered via
 * jive.conc.observable will be called asynchronously.  That means that
 * whatever bit of code emits an event will have to return control to the event
 * loop before any event listeners are called.
 *
 * Events may include any number of event parameters, which will be passed as
 * arguments to event listeners.
 *
 * Event listeners will be invoked in the context of the observable object.  So
 * in the body of an event listener `this` will refer to the object that
 * emitted the event.
 *
 * @class
 * @param   {Object}    klass   object to mix observable methods into
 */
jive.conc.observable = function(klass) {
    var skipLateListeners = false;

    /**
     * Returns an array of event listeners (functions) registered on the
     * receiver for the given type of event.  Returns an empty array if no
     * listeners are registered.
     *
     * @methodOf jive.conc.observable#
     * @param {string}  type    listeners for this type of event will be returned
     * @returns {Function[]}    array of event listeners
     */
    klass.listeners = function(type) {
        if (!this._events) {
            this._events = {};
        }
        if (!this._events[type]) {
            this._events[type] = [];
        }
        return this._events[type];
    }

    /**
     * Registers an event listener on the receiver for the given type of event.
     * When that event is emitted by the receiver `listener` will be invoked
     * asynchronously with any event parameters as arguments.
     *
     * @methodOf jive.conc.observable#
     * @param   {string}    type    type of event to listen for
     * @param   {Function}  listener    function to invoke when the given event occurs
     * @returns {jive.conc.observable}  returns the receiver so that this method can be cascaded
     */
    klass.addListener = function(event, listener) {
        // Emit a 'newListener' event.  It is important to emit this event
        // before adding the listener to prevent a 'newListener' listener from
        // being called as soon as it is added.
        skipLateListeners = true;
        this.emit('newListener', event, listener);
        skipLateListeners = false;

        this.listeners(event).push(listener);

        return this;
    }

    /**
     * Un-registers the given listener from the receiver as a listener for the
     * given type of event.  If no `listener` argument is given removes all
     * listeners for the given event type.
     *
     * @methodOf jive.conc.observable#
     * @param   {string}    type    type of event to stop listening for
     * @param   {Function}  [listener]  specific listener to remove
     * @returns {jive.conc.observable}  returns the receiver so that this method can be cascaded
     */
    klass.removeListener = function(event, listener) {
        var listeners = this.listeners(event);
        for (var i = 0; i < listeners.length; i += 1) {
            if (listeners[i] === listener || typeof listener == 'undefined') {
                listeners.splice(i, 1);  // Removes the matching listener from the array.
                i -= 1;  // Compensate for array length changing within the loop.
            }
        }
        return this;
    }

    // Include jive.conc.nextTick for improved event dispatch performance.
    var nextTick = jive.conc.nextTick || function(callback) {
        // Setting the timeout to `0` prevents any unnecessary delay.
        setTimeout(callback, 0);
    };

    /**
     * Emits an event, thus causing any event listeners registered on the
     * receiver for that event to be invoked asynchronously.  Any event
     * parameters that are given will be passed as arguments to event
     * listeners.
     *
     * @methodOf jive.conc.observable#
     * @param   {string}    type    type of event to emit
     * @param   {...any}    [eventParams]   zero or more event parameters to pass as arguments to event listeners
     * @returns {jive.conc.observable}  returns the receiver so that this method can be cascaded
     */
    klass.emit = function(event/*, eventParams */) {
        var eventParams = Array.prototype.slice.call(arguments, 1)
          , listeners = this.listeners(event).slice()  // Create a copy of the listeners array.
          , that = this;

        function execute(listener) {
            // Wrapping callbacks in a `nextTick()` causes callbacks to be run
            // asynchronously.  This means that event listeners will not block
            // the function that emits an event.  It also means that if one
            // listener throws an exception it will not prevent other listeners
            // from running.
            nextTick(function() {
                listener.apply(that, eventParams);
            });
        }

        for (var i = 0; i < listeners.length; i += 1) {
            execute(listeners[i]);
        }

        // Catch any listeners that were added after the event was emitted
        // during synchronous execution.
        if (!skipLateListeners) {
            nextTick(function() {
                var lateListeners = that.listeners(event)
                  , executed;

                for (var i = 0; i < lateListeners.length; i += 1) {
                    executed = false;

                    for (var j = 0; j < listeners.length; j += 1) {
                        if (lateListeners[i] === listeners[j]) {
                            executed = true;
                        }
                    }

                    if (!executed) {
                        execute(lateListeners[i]);
                    }
                }
            });
        }

        return this;
    };

    /**
     * Behaves the same as `emit()` except that this function creates a promise
     * which is passed with the event as an additional event parameter and that
     * is returned by `eventP()`.
     *
     * @methodOf jive.conc.observable#
     * @param   {string}    type    type of event to emit
     * @param   {...any}    [eventParams]   zero or more event parameters to pass as arguments to event listeners
     * @returns {jive.conc.Promise} returns a promise that is also passed with event parameters
     * @requires jive.conc.Promise
     */
    klass.emitP = function(event/*, eventParams */) {
        var args = Array.prototype.slice.call(arguments)
          , promise = new jive.conc.Promise();
        this.emit.apply(this, args.concat(promise));
        return promise;
    }

    /**
     * Listens for an event from emitter and automatically re-emits the same
     * event.  If `newType` is given the event will be re-emitted with
     * that name instead of the original event name.  If `listener` is given it
     * will be registered as an event handler in addition to re-emitting
     * events.
     *
     * Listeners registered for the re-emitted event will run in the context of
     * the receiver of proxyListener, not the original emitter of the event.
     *
     * @methodOf jive.conc.observable#
     * @param   {jive.conc.observable}  emitter event emitting object to proxy events from
     * @param   {string}    type    type of event to listen for
     * @param   {string}    [newType]   type of the event that will be re-emitted
     * @param   {Function}  [listener]  callback function to register as an event listener
     * @returns {jive.conc.observable}  returns the receiver so that this method can be cascaded
     */
    klass.proxyListener = function(obj, event, proxiedEvent, listener) {
        var that = this;

        if (typeof proxiedEvent == 'function') {
            listener = proxiedEvent;
            proxiedEvent = null;
        }
        proxiedEvent = proxiedEvent || event;

        if (listener) {
            obj.addListener(event, listener);
        }

        obj.addListener(event, function(/* eventParams */) {
            var eventParams = Array.prototype.slice.call(arguments);
            eventParams.unshift(proxiedEvent);
            that.emit.apply(that, eventParams);
        });

        return this;
    }
};
