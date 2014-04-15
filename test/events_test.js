module('Hybrid events');

test('HybridEvent is defined', function() {
    ok(HybridEvent, 'is defined');
    equal(typeof HybridEvent, 'function', 'and is a function');
});

test('Event creation', function() {
    expect(9);
    throws(function() {
        var myEvent = HybridEvent();
    }, 'should throw without name');
    
    var myEvent = HybridEvent('some');
    
    ok(myEvent, 'event is created');
    
    equal(typeof myEvent, 'function', 'event is actually a function');
    
    var holder = {event: myEvent},
        called = 0,
        callback = function(ev) {
            if(!called) {
                called = 1;
                ok(true, 'called');
                ok(ev, 'got event');
                equal(this, holder, 'this is a holder');
                equal(ev.data, data, 'ev.data is specified');
                equal(ev.target, holder, 'ev.target set to be a holder');
            } 
            else {
                ok(false, 'should not be called twice');
            }
        };
    
    var unbinder = holder.event(callback);
    equal(typeof unbinder, 'function', 'got another function back');
    
    var data = {some: 'data'};
    
    holder.event(data);
    
    unbinder();
    
    holder.event(data);
    holder.event(data);
    
});

test('multiple events', function() {
    expect(2);
    var holder = {itHappens: HybridEvent('itHappens')},
        cb1 = function bindsCb3unbindsCb2() {
            ok(true, 'called');
            holder.itHappens(cb3); //should not be called this time
            holder.itHappens(cb2); //should be called this time
        },
        cb2 = function shouldBeCalled() {
            ok(true, 'cb2 should be called');
        },
        cb3 = function shouldNeverBeCalled() {
            ok(false, 'cb3 should not called');    
        };
    
    holder.itHappens(cb1);
    holder.itHappens(cb2);
    
    holder.itHappens();     
});

test('custom options', function() {
    expect(10);
    var called = {
            add: 0,
            remove: 0
        },
        options = {
            setup: function() {
                if(called.setup) {
                    ok(false, 'setup should only be called once');
                }
                else {
                    called.setup = 1;
                    ok(true, 'setup called');
                }
            },
            
            add: function() {
                called.add = called.add || 0;
                called.add++;
                ok(true, 'add called');
            },
            
            teardown: function() {
                if(called.teardown) {
                    ok(false, 'teardown should only be called once');
                }
                else {
                    called.teardown = 1;
                    ok(true, 'teardown called');
                }
            },
            remove: function() {
                called.remove++;
                ok(true, 'remove called');
            }
        },
        holder = {
            some: HybridEvent("some", options)
        };
    
    var cb1 = function(){
        ok(true, 'cb1 called');
    },
        cb2 = function() {
            ok(true, 'cb2 called');    
        };
    
    var unbinder1 = holder.some(cb1),
        unbinder2 = holder.some(cb2);
    
    holder.some();
    
    equal(called.add, 2, 'add was called 2 times');
    
    unbinder1();
    holder.some(cb2);
    equal(called.remove, 2, 'remove was called 2 times');
    
});

test('event stop immediate propagation', function() {
   var obj = { 
       event: HybridEvent('event')
   },
        cb1 = function(event) {
            ok(!event.isPropagationStopped(), 'propagation is not stopped');
            ok(!event.isImmediatePropagationStopped(), 'immediate propagation is not stopped');
            event.stopImmediatePropagation();
            ok(event.isPropagationStopped(), 'propagation is stopped');
            ok(event.isImmediatePropagationStopped(), 'immediate propagation is not stopped');
       },
       cb2 = function(event) {
            ok(false, 'should never be called');       
       };
    
    obj.event(cb1);
    obj.event(cb2);
    
    obj.event();       
});

test('event propagate', function() {
    expect(5);
    var event = HybridEvent('event', {
            propagate: function() {
                return this.parent;
            }
        }),
        obj = {
            event: event,
            parent: {
                event: event,
                parent: {
                    event: event,
                }
            }
        };
    
    var cb1 = function(event) {
        ok(!event.isPropagationStopped(), 'event propagation is not stopped'); 
    };
    
    var cb2 = function(event) {
        ok(!event.isPropagationStopped(), 'event propagation is not stopped');
        event.stopPropagation();
        ok(event.isPropagationStopped(), 'propagation is stopped');
    };
    
    var cb21 = function(event) {
        ok(event.isPropagationStopped(), 'propagation is stopped');
        ok(!event.isImmediatePropagationStopped(), 'still running immediate propagation');
    };
    
    var cb3 = function(event) {
        ok(false, 'should never be called');    
    };
    
    obj.event(cb1);
    obj.parent.event(cb2);
    obj.parent.event(cb21);
    obj.parent.parent.event(cb3);
    
    obj.event({data: 42});
});

