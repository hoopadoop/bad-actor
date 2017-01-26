// @flow
/* global QUnit */

QUnit.module('bad_actor2')
import BadActor2, {BLOCKED_ERROR, TIME_OUT, DOWN, EXIT, register, unregister, sendMsg, registered} from 'modules/bad_actor2'

function nullf(a?: any): void {}
const nullPattern = {match: '', action: nullf}

/* you can use these to run just one test.. replace test with ttest
QUnit.ttest = QUnit.test
QUnit.test = function() {}
*/

QUnit.test('dies when function ends', (assert) => {
  let hasRun = false
  const actor = new BadActor2(function(pid) {
    hasRun = true
  })
  assert.ok(hasRun, 'must have run the init function')
  assert.ok(actor.DEAD, 'must be dead')
})

QUnit.test('blocks when given RECEIVE function', (assert) => {
  const actor = new BadActor2(function(pid) {
    pid.RECEIVE([{
      match: 'unblock',
      action: nullPattern
    }], nullPattern)
  })
  assert.ok(!actor.DEAD, 'must not be dead')
  assert.ok(actor._blocking(), 'must be blocking')

  actor.sendMsg('unblock')
  assert.ok(actor.DEAD, 'must be dead')
  assert.ok(!actor._blocking(), 'must not be blocking')
})

QUnit.test('simple fail to match', (assert) => {
  var testSate8 = {}
  const actor = new BadActor2((pid) => {
    pid.RECEIVE([{
      match: 'YES',
      action: function() {
        testSate8.didMatch = true
      }}],
                function() {
                  testSate8.continuationWasCalled = true
                })
  })
  actor.sendMsg('NO')
  assert.ok(!testSate8.didMatch, 'testSate8 should have matched YES')
  assert.ok(!testSate8.continuationWasCalled, 'testSate8 should be called')
  assert.ok(!actor.DEAD, 'must not be dead')
  assert.ok(actor._blocking(), 'must be blocking')
})

QUnit.test('calls action on match and continues after unblocking', (assert) => {
  var testSate1 = {}
  const actor = new BadActor2((pid) => {
    pid.RECEIVE([{
      match: 'YES',
      action: function() {
        testSate1.didMatch = true
      }}],
      function() {
        testSate1.continuationWasCalled = true
      })
  })
  actor.sendMsg('YES')
  assert.ok(testSate1.didMatch, 'testSate1 should have matched YES')
  assert.ok(testSate1.continuationWasCalled, 'testSate1continuation should be called')
  assert.ok(actor.DEAD, 'must be dead')
})

QUnit.test('matching more complex messages', (assert) => {
  let itworked = false
  function actorLoop(pid) {
    pid.RECEIVE([{
      match: {self: assert, txt: 'hello'},
      action: (a) => {
        itworked = true
      }
    }],
    nullf)
  }
  const actor = new BadActor2(actorLoop)
  actor.sendMsg({self: assert, txt: 'hello'})
  assert.ok(itworked, 'using underscore we can match more complex objects')
  assert.ok(actor.DEAD, 'must be dead')
})

QUnit.test('matching even more complex messages *', (assert) => {
  let itworked = false
  function actorLoop(pid) {
    pid.RECEIVE([{
      match: {self: assert, data: {type: 'error', txt: '*'}},
      action: (a) => {
        itworked = true
      }
    }],
    nullf)
  }
  const actor = new BadActor2(actorLoop)
  actor.sendMsg({
    self: assert,
    data: {
      type: 'error',
      txt: 'hello'
    }
  })
  assert.ok(itworked, 'using underscore we can match more complex objects')
  assert.ok(actor.DEAD, 'must be dead')
})

QUnit.test('simple out of order match', (assert) => {
  var testSate41 = {}
  const actor = new BadActor2((pid) => {
    pid.RECEIVE([{
      match: 'berlin',
      action: function() {
        testSate41.didMatch = true
      }}],
      function() {
        testSate41.continuationWasCalled = true
        assert.ok(actor._inbox.join() === 'krakov,moscow', 'we should have matched out of order')
        assert.ok(actor._savedMsgs.length === 0, 'we should have matched out of order')
      })
  })
  actor.sendMsg('krakov')
  actor.sendMsg('moscow')
  actor.sendMsg('berlin')

  assert.ok(testSate41.didMatch, 'testSate4_1 should not have matched berlin')
  assert.ok(testSate41.continuationWasCalled, 'testSate4_1 continuation should not be called')
  assert.ok(actor.DEAD, 'must be dead')
})

QUnit.test('cannot double receive', (assert) => {
  const actor = new BadActor2((pid) => {
    pid.RECEIVE([{
      match: 'berlin',
      action: nullf}], nullf)
  })
  var threwBlockedError = false
  try {
    actor.RECEIVE([nullPattern], nullf)
  } catch (e) {
    if (e === BLOCKED_ERROR) threwBlockedError = true
  }
  assert.ok(threwBlockedError, 'dah! failed hokey test suite')
})

QUnit.test('red green callbacks', (assert) => {
  const done = assert.async()
  var res = 'initialvalue'
  function asyncLoop(pid) {
    pid.RECEIVE([{
      match: 'urlLoaded',
      action: () => { res = 'setingaction' }
    }],
    () => {
      assert.ok(res === 'setingaction', 'this shouldnt happen')
      done()
    })
  }
  const asyncOb = new BadActor2(asyncLoop)
  setTimeout(function() {
    asyncOb.sendMsg('urlLoaded')
  })
})

QUnit.test('what happens if you infinte loop?', (assert) => {
  const done = assert.async()
  var testlock = true
  function loop(pid, data) {
    pid.RECEIVE([{
      match: 'doit',
      action: () => {
        testlock = true
        loop(pid, data)
      }}], nullf)
  }
  const actor = new BadActor2(loop)
  var msgSentCount = 0
  var t = setInterval(function() {
    if (testlock === false) return
    testlock = false
    if (msgSentCount === 10) {
      clearInterval(t)
      assert.ok(true, 'placeholder assert')
      done()
    }
    actor.sendMsg('doit')
    msgSentCount++
  }, 1)
})

QUnit.test('simple inner match', (assert) => {
  var testState9 = {}
  const actor = new BadActor2((pid) => {
    pid.RECEIVE([{
      match: 'sandwich',
      action: function() {
        testState9.outerDidMatch = true
        pid.RECEIVE([{
          match: 'beetroot',
          action: function() {
            testState9.innerDidMatch = true
          }}],
          function() {
            testState9.innerContinuationWasCalled = true
          })
      }}],
      function() {
        testState9.outerContinuationWasCalled = true
      })
  })
  actor.sendMsg('beetroot')
  actor.sendMsg('sandwich')
  assert.ok(testState9.outerDidMatch, 'testState9 should have matched sandwich')
  assert.ok(testState9.outerContinuationWasCalled, 'testState9 continuation should be called')
  assert.ok(testState9.innerDidMatch, 'testState9 should have matched beetroot')
  assert.ok(testState9.innerContinuationWasCalled, 'testState9 continuation should be called')
  assert.ok(actor.DEAD, 'must be dead')
  assert.ok(!actor._blocking(), 'must not be blocking')
})

QUnit.test('some recursive shit where we send ourself messages in the middle of a match', (assert) => {
  var testState11 = {results: []}
  const actor = new BadActor2((pid) => {
    pid.RECEIVE([{
      match: 'outer',
      action: function() {
        pid.sendMsg('whaaaa????')
        pid.RECEIVE([{
          match: 'whaaaa????',
          action: () => { testState11.results.push('inner1') }
        }],
        () => { testState11.results.push('inner2') })
      }}],
      () => { testState11.results.push('outer') })
  })
  actor.sendMsg('outer')
  actor.sendMsg('ignored')
  assert.ok(testState11.results.join() === 'inner1,inner2,outer', 'results should be ordered correctly: ' + testState11.results.join())
})

QUnit.test('lets test multiple objects', (assert) => {
  var results = []
  function serverLoop(pid, serverState) {
    pid.RECEIVE([{
      match: {name: 'setClient', data: '*'},
      action: (msg) => {
        serverState.client = msg.data
        serverState.client.sendMsg({name: 'ping', sender: pid})
        serverLoop(pid, serverState)
      }
    }, {
      match: 'pong',
      action: () => {
        results.push('pong')
      }
    }], nullf)
  }
  function clientLoop(pid, clientState) {
    pid.RECEIVE([{
      match: {name: 'ping', sender: '*'},
      action: (msg) => {
        results.push('ping')
        clientState.server = msg.sender
        .sendMsg('pong')
      }}], nullf)
  }
  const serverActor = new BadActor2(serverLoop, {client: null})
  const clientActor = new BadActor2(clientLoop, {server: null})
  serverActor.sendMsg({name: 'setClient', data: clientActor})
  assert.ok(results.join() === 'ping,pong', results.join())
  assert.ok(serverActor.DEAD, 'should have finished')
  assert.ok(clientActor.DEAD, 'should have finished')
})

QUnit.test('simple inner fail 1', (assert) => {
  var testSate6 = {}
  const actor = new BadActor2((pid) => {
    pid.RECEIVE([{
      match: 'sandwich',
      action: function() {
        testSate6.outerDidMatch = true
        pid.RECEIVE([{
          match: 'cabbage',
          action: function() {
            testSate6.innerDidMatch = true
          }}],
          function() {
            testSate6.innerContinuationWasCalled = true
          })
      }}],
      function() {
        testSate6.outerContinuationWasCalled = true
      })
  })
  actor.sendMsg('sandwich')
  actor.sendMsg('beetroot')
  assert.ok(testSate6.outerDidMatch, 'testSate6 should have matched krakov')
  assert.ok(!testSate6.outerContinuationWasCalled, 'testSate6 continuation should not be called')
  assert.ok(!testSate6.innerDidMatch, 'testSate6 should have matched krakov')
  assert.ok(!testSate6.innerContinuationWasCalled, 'testSate6 continuation should be called')
  var threwBlockedError2 = null
  try {
    actor.RECEIVE([nullPattern], nullf)
  } catch (e) {
    if (e === BLOCKED_ERROR) threwBlockedError2 = true
  }
  assert.ok(threwBlockedError2, 'dah! failed hokey test suite')
})

QUnit.test('simple inner fail 2', (assert) => {
  var testSate10 = {}
  const actor = new BadActor2((pid) => {
    pid.RECEIVE([{
      match: 'sandwich',
      action: function() {
        testSate10.outerDidMatch = true
        pid.RECEIVE([{
          match: 'beetroot',
          action: function() {
            testSate10.innerDidMatch = true
          }}],
          function() {
            testSate10.innerContinuationWasCalled = true
          })
      }}],
      function() {
        testSate10.outerContinuationWasCalled = true
      })
  })

  actor.sendMsg('rootoot')
  actor.sendMsg('sandwich')
  assert.ok(testSate10.outerDidMatch, 'testSate10 should have matched krakov')
  assert.ok(!testSate10.outerContinuationWasCalled, 'testSate10 continuation should be called')
  assert.ok(!testSate10.innerDidMatch, 'testSate10 should have matched krakov')
  assert.ok(!testSate10.innerContinuationWasCalled, 'testSate10 continuation should be called')

  actor.sendMsg('beetroot')
  assert.ok(testSate10.innerDidMatch, 'testSate10 should have matched beetroot')
  assert.ok(testSate10.innerContinuationWasCalled, 'testSate10 inner continuation should be called')
  assert.ok(testSate10.outerContinuationWasCalled, 'testSate10 outer continuation should be called')
  assert.ok(actor.DEAD, 'must be dead')
})

QUnit.test('simple timer doesnt fire', (assert) => {
  const done = assert.async()
  const results = []
  const actor = new BadActor2((pid) => {
    pid.RECEIVE([{
      match: 'hello',
      action: function() {
        results.push('helloreceived')
      }}, {
        match: TIME_OUT,
        action: function() {
          results.push('timeoutreceived')
        }}], function() {}, 100)
    setTimeout(() => {
      actor.sendMsg('hello')
    }, 10)
    setTimeout(() => {
      assert.ok(results.length === 1, 'shit')
      assert.ok(results[0] === 'helloreceived', 'looks like timeout was cancelled ok ' + results[0])
      done()
    }, 200)
  })
  assert.ok(!actor.DEAD, 'must not be dead')
  assert.ok(actor._blocking(), 'must be blocking')
})

QUnit.test('normal timeout', (assert) => {
  const done = assert.async()
  const results = []
  const actor = new BadActor2((pid) => {
    pid.RECEIVE([{
      match: TIME_OUT,
      action: function() {
        results.push('timeoutreceived')
      }
    }],
    () => {
      setTimeout(cleanup, 2)
    }, 10)
  })
  function cleanup() {
    assert.ok(results[0] === 'timeoutreceived', 'timeout didnt trigger')
    assert.ok(actor.DEAD, 'must be dead')
    done()
  }
  assert.ok(actor, 'silence warning')
})

QUnit.test('immediate timeout', (assert) => {
  const results = []
  const actor = new BadActor2((pid) => {
    pid.RECEIVE([{
      match: TIME_OUT,
      action: function() {
        results.push('timeoutreceived')
      }}],
      function() {
        setTimeout(cleanup, 2)
      }, 0)
  })
  function cleanup() {
    assert.ok(results[0] === 'timeoutreceived', 'timeout didnt trigger')
    assert.ok(actor.DEAD, 'must be dead')
  }
  assert.ok(actor, 'silence warning')
})

QUnit.test('inner normal timeout', (assert) => {
  const done = assert.async()
  const results = []
  const actor = new BadActor2((pid) => {
    pid.RECEIVE([{
      match: 'go deep',
      action: function() {
        results.push('go deep')
        pid.RECEIVE([{
          match: TIME_OUT,
          action: function() {
            results.push('inner timeoutreceived')
          }}],
          function() {
            setTimeout(cleanup, 2)
          }, 10)
      }}],
      () => {
        results.push('continue')
      })
  })
  function cleanup() {
    assert.ok(results.join() === 'go deep,inner timeoutreceived,continue', results.join())
    assert.ok(actor.DEAD, 'must be dead')
    done()
  }
  actor.sendMsg('go deep')
})

// empty the whole mailbox, then timeout zero is called
// SHIT AGAIN I AM NOT UNDERSTANDING HOW ZERO WORKS IN RECURSIVE FLUSH - ok timeout zero doesnt match if something else does! (only the last matches)
QUnit.test('empty mailbox with star match', (assert) => {
  const results = []
  function emptyMailbox(pid: BadActor2, l: string) {
    pid.RECEIVE([
      {match: '*', action: (a) => { results.push('*'); emptyMailbox(pid, a) }},
      {match: TIME_OUT, action: () => { results.push('timeoutreceived:' + l) }}],
      () => { results.push('continue inner:' + l) }, 0)
  }
  function actorLoop(pid: BadActor2) {
    pid.RECEIVE([
      {match: 'unblock', action: () => { emptyMailbox(pid, 'init') }}
    ], () => { results.push('continue outer') })
  }
  const actor = new BadActor2(actorLoop)
  actor.sendMsg('one')
  actor.sendMsg('two')
  actor.sendMsg('three')
  actor.sendMsg('unblock')
  assert.ok(results.join() === '*,*,*,timeoutreceived:three,continue inner:three,continue inner:two,continue inner:one,continue inner:init,continue outer', results.join())
  assert.ok(actor.DEAD, 'must be dead')
})

// i don't know what this was meant to test but it doesn't do anything useful anymore
QUnit.test('ugh timeout zero is messed up with nested receive', (assert) => {
  const done = assert.async()
  const results = []
  function dogLoop(pid) {
    pid.sendMsg('stroke1')
    setTimeout(() => { pid.sendMsg('stroke2') }, 100)
    setTimeout(() => { pid.sendMsg('stroke3') }, 150)
    pid.RECEIVE([{
      match: 'stroke1',
      action: () => {
        results.push('one')
        pid.RECEIVE([{
          match: 'stroke2',
          action: () => {
            results.push('two')
            pid.RECEIVE([{
              match: 'stroke3',
              action: () => {
                results.push('three')
              }}], nullf)
          }}], nullf)
      }}, {
        match: TIME_OUT,
        action: () => { results.push('timeoutreceived') }
      }],
     () => {
       results.push('complete')
     }, 0)
  }
  const dog = new BadActor2(dogLoop)

  const expected = 'one,two,three,complete'
  setTimeout(() => {
    assert.ok(results.join() === expected, ': ' + results.join())
    assert.ok(dog.DEAD, 'must be dead')
    done()
  }, 500)
})

/*
  i don't know why but i thought immediate timeout wasn't cancelled when a match happened but that's clearly wrong
QUnit.test('test immediate timeout isnt cancelled', (assert) => {
  const done = assert.async()
  const results = []
  const actor = new BadActor2((pid) => {
    pid.RECEIVE([{
      match: 'hello',
      action: () => {
        results.push('hello')
      }}, {
        match: TIME_OUT,
        action: () => { results.push('timeoutreceived') }
      }],
      () => {
        assert.ok(results.join() === 'hello,timeoutreceived', 'timeout was cancelled')
        done()
      }, 0)
  })
  actor.sendMsg('hello')
})
*/

QUnit.test('initial test of an error', (assert) => {
  const results = []
  const actor = new BadActor2((pid) => {
    pid.RECEIVE([{
      match: 'hello',
      action: () => { throw new Error('please be caught') }
    }, {
      match: 'this should just be swallowed',
      action: () => { results.push('derp') }
    }], () => {
      results.push('berp')
    })
  })
  actor.sendMsg('hello')
  assert.ok(actor.DEAD, 'the error should kill the linked actor')
  actor.sendMsg('this should just be swallowed')
  assert.ok(results.length === 0, 'phew im glad we got here')
})

QUnit.test('check normal timeout and crashes in action', (assert) => {
  const done = assert.async()
  const results = []
  const actor = new BadActor2((pid) => {
    pid.RECEIVE([{
      match: TIME_OUT,
      action: () => {
        results.push('this should happen')
        throw new Error('i cant javascript')
      }
    }],
    () => { results.push('this shouldnt happen') }, 1)
  })
  setTimeout(function() {
    assert.ok(actor.DEAD, 'hm')
    assert.ok(results.length === 1, 'after shouldnt happen' + results.length)
    assert.ok(results[0] === 'this should happen', 'after shouldnt happen')
    done()
  }, 10)
})

QUnit.test('check normal timeout and crashes in after', (assert) => {
  const done = assert.async()
  const results = []
  const actor = new BadActor2((pid) => {
    pid.RECEIVE([{
      match: TIME_OUT,
      action: () => {
        results.push('timeoutreceived')
      }
    }],
    () => { throw new Error('i cant javascript') }, 1)
  })
  setTimeout(function() {
    assert.ok(actor.DEAD, 'hm')
    assert.ok(results[0] === 'timeoutreceived', 'timeout didnt trigger')
    done()
  }, 10)
})

QUnit.test('check immediate timeout and crashes in action', (assert) => {
  const done = assert.async()
  const results = []
  const actor = new BadActor2((pid) => {
    pid.RECEIVE([{
      match: TIME_OUT,
      action: () => { throw new Error('i cant javascript') }
    }],
    () => { results.push('this shouldnt happen') }, 0)
  })
  setTimeout(function() {
    assert.ok(actor.DEAD, 'hm')
    assert.ok(results.length === 0, 'after shouldnt happen')
    done()
  }, 10)
})

QUnit.test('check immediate timeout and crashes in after', (assert) => {
  const done = assert.async()
  const results = []
  const actor = new BadActor2((pid) => {
    pid.RECEIVE([{
      match: TIME_OUT,
      action: () => { results.push('timeoutreceived') }
    }],
    () => { throw new Error('i cant javascript') }, 0)
  })
  setTimeout(function() {
    assert.ok(actor.DEAD, 'hm')
    assert.ok(results[0] === 'timeoutreceived', 'timeout didnt trigger')
    done()
  }, 10)
})

// i really misunderstood immediate timeout, these tests are useless now but i still feel i cant have been that wrong and ill need to change it back again
/*
QUnit.test('test unwinding the stack a pid high up the stack has immediate timeout and it crashes in the timeout action', (assert) => {
  const done = assert.async()
  const results = []
  const actor = new BadActor2((pid) => {
    pid.sendMsg('ping')
    pid.sendMsg('pong')
    pid.RECEIVE([
      {
        match: 'ping',
        action: () => {
          results.push('ping')
          pid.RECEIVE([{
            match: 'pong',
            action: () => {
              results.push('pong')
            }
          }], nullf)
        }
      }, {
        match: TIME_OUT,
        action: () => {
          throw new Error('i should throw when unwinding')
        }
      }],
      () => { debugger; results.push('continue') }, 0)
  })
  setTimeout(function() {
    assert.ok(actor.DEAD, 'hm')
    assert.ok(results.join() === 'ping,pong,continue', ': ' + results.join())
    done()
  }, 10)
})
*/

// todo: test linking and monitoring when an object dies naturally. ie reason

// good link and monitor reference http://marcelog.github.io/articles/erlang_link_vs_monitor_difference.html
QUnit.test('test simple link - forward', (assert) => {
  // remember links are two way
  const done = assert.async()
  const actor1 = new BadActor2((pid) => {
    pid.RECEIVE([{
      match: 'simulate_error',
      action: () => {
        throw new Error('derp')
      }}], nullf)
  })
  const actor2 = new BadActor2((pid) => {
    pid.RECEIVE([{
      match: 'block',
      action: nullf
    }], nullf)
  })
  actor2.link(actor1)
  actor1.sendMsg('simulate_error')
  assert.ok(actor2.DEAD, 'the error should kill the linked actor')
  done()
})

QUnit.test('test simple link - backwards', (assert) => {
  const done = assert.async()
  const actor1 = new BadActor2((pid) => {
    pid.RECEIVE([{
      match: 'unblock', action: nullf
    }], nullf)
  })
  const actor2 = new BadActor2((pid) => {
    pid.RECEIVE([{
      match: 'simulate_error',
      action: () => {
        throw new Error('derp')
      }}], nullf)
  })
  actor2.link(actor1)
  actor2.sendMsg('simulate_error')
  assert.ok(actor1.DEAD, 'the error should kill the linked actor')
  done()
})

QUnit.test('test simple link - trap exit', (assert) => {
  const done = assert.async()
  const actor1 = new BadActor2((pid) => {
    pid.RECEIVE([{
      match: 'simulate_error',
      action: () => {
        throw new Error('derp')
      }}], nullf)
  })
  const actor2 = new BadActor2((pid) => {
    pid.RECEIVE([{
      match: EXIT,
      action: () => {
        assert.ok(!actor2.DEAD, 'actor2 should trap the exit')
        done()
      }}], nullf)
  })
  actor2.trapExit(true)
  actor2.link(actor1)
  actor1.sendMsg('simulate_error')
})

QUnit.test('test simple monitor', (assert) => {
  // monitors are one way
  const done = assert.async()
  const results = []
  const actor1 = new BadActor2((pid) => {
    pid.RECEIVE([{
      match: 'simulate_error',
      action: () => {
        throw new Error('derp')
      }}], nullf)
  })
  const actor2 = new BadActor2((pid) => {
    pid.RECEIVE([{
      match: DOWN,
      action: () => {
        results.push('todo: we need to send the object and the error')
      }}], nullf)
  })
  actor2.monitor(actor1)
  actor1.sendMsg('simulate_error')

  setTimeout(function() {
    assert.ok(results.length === 1, 'we should have received the DOWN')
    assert.ok(results[0] === 'todo: we need to send the object and the error', 'we should have received the DOWN')
    done()
  }, 10)
})

QUnit.test('basic register name', (assert) => {
  const results = []
  const actorLoop = (pid) => {
    pid.RECEIVE([{match: 'hello', action: () => { results.push('ok'); actorLoop(pid) }}], nullf)
  }
  const actor = new BadActor2(actorLoop)
  register('server', actor)
  sendMsg('server', 'hello')
  assert.ok(results.length === 1, 'sent msg to name')
  unregister('server')
  assert.ok(registered().length === 0, 'you need to clean up')
})

QUnit.test('basic register name error casses', (assert) => {
  const actor1 = new BadActor2((pid) => {
    pid.RECEIVE([{match: 'unblock', action: nullf}], nullf)
  })
  const actor2 = new BadActor2((pid) => {
    pid.RECEIVE([{match: 'unblock', action: nullf}], nullf)
  })
  register('server', actor1)
  assert.throws(() => {
    register('server', actor2)
  },
 //               /another actor/,
                'cant register two actors to same name')
  assert.throws(() => {
    unregister('server2', actor1)
  },
  //            /cant unregister/,
                'cant unregister a something not registered')
  assert.throws(() => {
    sendMsg('server2', 'hello')
  },
  //            /description/,
                'cant message a name not registered')
  assert.ok(registered()[0] === 'server', 'server should be registered')
  unregister('server')
  assert.ok(registered().length === 0, 'you need to clean up')
})

QUnit.test('test name is unregistered when actor dies', (assert) => {
  const actor = new BadActor2((pid) => {
    pid.RECEIVE([{
      match: 'simulate_error',
      action: () => {
        throw new Error('derp')
      }}], nullf)
  })
  register('server', actor)
  sendMsg('server', 'simulate_error')
  assert.ok(actor.DEAD, 'must be dead')
  assert.ok(registered().length === 0, 'actor should be unregistered when it dies')
})

// todo
// actor needs to die and unregister its name when it reaches the end
// thinking about it now is the actor stuff any use without otp ?
// todo: we need exit normal etc
