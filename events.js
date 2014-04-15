/*global window*/
~function(win) {
    /**
     * @class PubSub implementation.
     */
    var Hub = function(ctx) {
            this.$events = {};
            this.ctx = ctx;
        },
        
        key = 'HybridEventHub' + Date.now(),
        
        getHub = function(ctx) {
            return ctx[key] || (ctx[key] = new Hub(ctx));
        },
        hubProto = Hub.prototype,
        
        /**
         * @class Storage for event callbacks.
         * Contains custom options.
         */
        Emitter = function(name, options) {
            this.$callbacks = [];
            this.$options = options || {};
            this.$name = name;
        },
        
        emitterProto = Emitter.prototype,
        
        /**
         * @class Event implementation
         */
        Event = function(ctx, data) {
            this.target = ctx;
            this.data = data;    
        };
    
    /**
     * Add callback to the storage.
     * Run setup/add logic.
     */
    emitterProto.add = function(callback, ctx) {
        var emitter = this,
            callbacks = emitter.$callbacks,
            options = emitter.$options,
            setup = options.setup,
            add = options.add,
            name = emitter.$name,
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
        return this[~this.$callbacks.indexOf(callback) ?'remove' : 'add'](callback, ctx);
    };
    
    /**
     * Remove callback from the storage.
     * Run remove/teardown logic.
     */
    emitterProto.remove = function(callback, ctx) {
        var callbacks = this.$callbacks,
            name = this.$name,
            position = callbacks.indexOf(callback),
            options = this.$options,
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
        var callbacks = this.$callbacks;
        
        if(callbacks.length) {
            callbacks = callbacks.slice(0); //create a copy;
            
            callbacks.forEach(function(cb) {
                cb.call(event.target, event);    
            });    
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
        var event = this.$events[name];
        
        if(!event) {
            this.$events[name] = event = new Emitter(name, options);    
        }
        
        return event.toggle(callback, this.ctx);
    };
    
    /**
     * Publish event.
     * @param {String} name - Event name.
     * @param {Event} event - Event containing data, context etc
     */
    hubProto.pub = function(name, event) {
        this.$events[name].fire(event);
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
            
            if(typeof arg == 'function') { //bind|unbind mode
                return hub.sub(name, arg, options);        
            }
            else { //trigger mode
                hub.pub(name, new Event(this, arg));    
            }
        };
    }
    
    win.HybridEvent = event; 
    
}(window);
