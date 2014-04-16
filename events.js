/*global window*/
~function(win) {    
    var hybridEventStr = 'HybridEvent',
        key = hybridEventStr + Date.now(),
        prototypeStr = 'prototype',
        callbacksStr = 'callbacks',
        eventsStr = 'events',
        currentTargetStr = 'currentTarget',
        optionsStr = 'options',
        /**
         * @class PubSub implementation.
         */
        Hub = function(ctx) {
            this[eventsStr] = {};
            this.ctx = ctx;
        },
        getHub = function(ctx) {
            return ctx[key] || (ctx[key] = new Hub(ctx));
        },
        hubProto = Hub[prototypeStr],
        
        /**
         * @class Storage for event callbacks.
         * Contains custom options.
         */
        Emitter = function(name, options) {
            this[callbacksStr] = [];
            this[optionsStr] = options || {};
            this.name = name;
        },
        
        emitterProto = Emitter[prototypeStr],
        identity = function(x) {
            return function() {return x;};
        },
        returnTrue = identity(true),
        returnFalse = identity(false),
        isPropagationStopped = 'isPropagationStopped',
        isImmediatePropagationStopped = 'isImmediatePropagationStopped',
        
        /**
         * @class Event implementation
         */
        Event = function(ctx, data) {
            if(data instanceof Event) { //Update currentTarget
                data[currentTargetStr] = ctx;
                return data;       
            }
            this.target = this[currentTargetStr] = ctx;
            this.data = data;
            this[isPropagationStopped] = returnFalse;
            this[isImmediatePropagationStopped] = returnFalse;
        },
        eventProto = Event[prototypeStr];
    
    eventProto.stopImmediatePropagation = function() {
        this[isPropagationStopped] = this[isImmediatePropagationStopped] = returnTrue;    
    };
    
    eventProto.stopPropagation = function() {
        this[isPropagationStopped] = returnTrue;    
    };

    /**
     * Add callback to the storage.
     * Run setup/add logic.
     */
    emitterProto.add = function(callback, ctx) {
        var emitter = this,
            callbacks = emitter[callbacksStr],
            options = emitter[optionsStr],
            setup = options.setup,
            add = options.add,
            name = emitter.name,
            callbacksNumber = callbacks.length;
        
        callbacks.push(callback);
        
        if(setup && !callbacksNumber) { //There were no callbacks before
            setup.call(ctx, name);    
        }
        if(add) {
            add.call(ctx, name);
        }
        
        return function unbinder() {
            emitter.remove(callback, ctx);    
        };
    };
    
    /**
     * Add or remove callback.
     */
    emitterProto.toggle = function(callback, ctx) {
        return this[~this[callbacksStr].indexOf(callback) ?'remove' : 'add'](callback, ctx);
    };
    
    /**
     * Remove callback from the storage.
     * Run remove/teardown logic.
     */
    emitterProto.remove = function(callback, ctx) {
        var callbacks = this[callbacksStr],
            name = this.name,
            position = callbacks.indexOf(callback),
            options = this[optionsStr],
            remove = options.remove,
            teardown = options.teardown;
        
        if(~position) { //callback is in there
            callbacks.splice(position, 1);
            
            if(remove) { 
                remove.call(ctx, name);
            }
            if(teardown && !callbacks.length) {
                teardown.call(ctx, name);    
            }
        }                
    };
    
    /**
     * Run callbacks.
     */
    emitterProto.fire = function(event) {
        var callbacks = this[callbacksStr],
            len = callbacks.length,
            i = 0,
            propagate = this[optionsStr].propagate,
            ctx = event[currentTargetStr];
        
        if(len) {
            callbacks = callbacks.slice(0); //create a copy;
            
            while(i < len && !event[isImmediatePropagationStopped]()) {
                callbacks[i++].call(ctx, event);    
            }
        }
        
        if(propagate && !event[isPropagationStopped]()) {
            ctx = propagate.call(ctx);
            if(ctx) {
                ctx[this.name](event);
            }
        }
    };
    
    /**
     * Bind|unbind callback for event.
     * * Bind callback if is not already binded.
     * * Unbind otherwise.
     * @param {String} name Event name.
     * @param {Function} callback Function to be called.
     * @param {Object} options Additional event params.
     * @returns {Function} Unbinder function.
     */
    hubProto.sub = function(name, callback, options) {
        var event = this[eventsStr][name];
        
        if(!event) {
            this[eventsStr][name] = event = new Emitter(name, options);    
        }
        
        return event.toggle(callback, this.ctx);
    };
    
    /**
     * Publish event.
     * @param {String} name - Event name.
     * @param {Event} event - Event containing data, context etc
     */
    hubProto.pub = function(name, event) {
        this[eventsStr][name].fire(event);
    };
    
    /**
     * @param {String} name - Event name, required.
     * @param {Object} options - Additional event options. Optional 
     * @returns {Function} Hybrid event function.
     */
    function event(name, options) {
        if(!name) {
            throw new Error('Event name is required');
        }
        
        return function(arg) {
            var hub = getHub(this);
            
            return typeof arg == 'function' ? hub.sub(name, arg, options) : hub.pub(name, new Event(this, arg));
        };
    }
    
    win[hybridEventStr] = event; 
    
}(window);
