# expert-disco
erlang-style mailbox/msg-passing/green-callbacks for js

i read [joe armstrong's blog post on red vs green callbacks](http://joearms.github.io/2013/04/02/Red-and-Green-Callbacks.html), or javascript vs erlang callbacks, when it appeared on hacker news. i didn't understand it at all and thought the difference he was highlighting was just semantic.

i have many problems with concurrency in single threaded javascript

i was reading about [threads and messaging and inbox and selective retreival of incoming messages in erlang](http://ndpar.blogspot.co.uk/2010/11/erlang-explained-selective-receive.html) ie different priority messages and how it worked

processes are isolated, errors contained

i dont know much about erlang, but it looked similar to [fowler's statemachines](http://www.informit.com/articles/article.aspx?p=1592379) which i like

```
// example state machine config in json for Miss Grant’s secret compartment
// (from martin fowler's blog)

function lockDoor(){...}
function unlockDoor(){...}
function lockPanel(){...}
function unlockPanel(){...}

statemachineConfig = {
  {events: doorClosed', 'drawerOpened', 'lightOn', 'doorOpened', 'panelClosed']},
  {resetEvents: ['doorOpened']},
  {commands: ['unlockPanel', 'lockPanel', 'lockDoor, 'unlockDoor']},
 	
  {state: 'idle', enteractions: ['unlockDoor', 'lockPanel'], transitions: [{doorClosed: 'active'}],
  {state: 'active', transitions: [{drawerOpened: waitingForLight}, {lightOn: waitingForDrawer}]},
  {state: 'waitingForLight', transitions: [{lightOn: 'unlockedPanel'}],
  {state: 'waitingForDrawer', transitions: [{drawerOpened: 'unlockedPanel'}],
  {state: 'unlockedPanel', enteractions: ['unlockPanel', 'lockDoor'], transitions: [{panelClosed: 'idle'}]
}
```
rough translation to erlang (i dont know erlang!)

```
lockDoor() -> ...
unlockDoor() -> ...
lockPanel() -> ...
unlockPanel() -> ...

idle() ->
    unlockDoor()
    lockPanel()
    receive
        doorClosed ->
            active()
    end.
    
active() ->
    receive
        drawerOpened ->
            waitingForLight();
        lightOn ->
            waitingForDrawer()
    end.
    
waitingForLight() ->
    receive
        lightOn ->
            unlockedPanel()
    end.    
    
waitingForDrawer() ->
    receive
        drawerOpened ->
            unlockedPanel()
    end.    
    
unlockedPanel() ->
    unlockPanel()
    lockDoor()
    receive
        panelClosed ->
            idle()
    end.     
```

it doesn't just look similar- it's much better!
no DSL, no StateMachineModel, StatemachineParser, StateMachineCommand, StateMachineEvent etc. this is plain-old-erlang.. objects send (oneway!) messages and objects (selectively!) receive messages. nothing else needed

so, reading red vs green again.. i think i get it now. the control flow in javascript with a callback is messed up..your code continues to execute but jumps to a different place when some event happens.  in erlang it's  more like you've written a state machine to control program flow - but in a way that's both simpler and more powerful than  this kind of configurable statemachine can model.

even though in erlang.. message-passing/selective-receive is how you communicate between threads, could this help in single threaded, concurrent javascript?

some others that i need to evaluate
*  https://github.com/mental/webactors \s\s
*  http://beatniksoftware.com/erjs/ \s\s
*  https://github.com/orph/erjs \s\s
*  https://github.com/bryanjos/processes \s\s


suggestions, comments, feddback, help welcome and appreciated


