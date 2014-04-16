hybrid-events
=============

Hybrid events for plain javascript objects.
What is hybrid event?
---------------------

Hybrid event is a function that acts as:

* Binder if argument is a function.
* Trigger otherwise.

Event definition
----------------

To define new event you need to call `HybridEvent` with an event name. For example

```javaacript
var event = HybridEvent('itHappens');
```

This will define an event name `itHappens` without any additional logic.

Event parameters
----------------

One can speciefy additional options for event to implement custom setup/teardown and bubbling logic.

```javascript
var verySpecialEvent = HybridEvent('specialEvent', {
    setup: function(name){
        //custom setup logic called when the first callback was added
    },
    
    add: function(name) {
        //custom logic on every callback added
    },
    
    remove: function(name) {
        //custom logic on every callback removed
    },
    
    teardown: function(name) {
        //custom teardown logic called when all callbacks were removed
    },
    
    propagate: function() {
        //lookup parent for current event target.
    }
});
```


