/* global QUnit */
// @flow
QUnit.module('bad_actor2')
import BadActor2, {BLOCKED_ERROR, TIME_OUT, DOWN, EXIT} from 'modules/bad_actor2'

function nullf(): void {}
const nullPattern = {match: '', action: nullf}

/* you can use these to run just one test.. replace test with ttest
QUnit.ttest = QUnit.test
QUnit.test = function() {}
*/

QUnit.test('test start from full, simple match', (assert) => {
  const actor = new BadActor2()
  const testSate2 = {}
  actor._inbox.push('krakov')

  actor.RECEIVE([{match: 'krakov', action: function() {
    testSate2.didMatch = true
  }}], function() {
    testSate2.continuationWasCalled = true
  })
  assert.ok(testSate2.didMatch, 'testSate2 should have matched krakov')
  assert.ok(testSate2.continuationWasCalled, 'testSate2 continuation should be called')
})

QUnit.test('test start from full, simple fail', (assert) => {
  const actor = new BadActor2()
  var testSate3 = {}
  actor._inbox.push('krakov')
  actor.RECEIVE([{match: 'berlin', action: function() {
    testSate3.didMatch = true
  }}], function() {
    testSate3.continuationWasCalled = true
  })
  assert.ok(!testSate3.didMatch, 'testSate3 should not have matched berlin')
  assert.ok(!testSate3.continuationWasCalled, 'testSate3 continuation should not be called')

  var threwBlockedError = false
  try {
    actor.RECEIVE([nullPattern], nullf)
  } catch (e) {
    if (e === BLOCKED_ERROR) threwBlockedError = true
  }
  assert.ok(threwBlockedError, 'dah! failed hokey test suite')
})

QUnit.test('test start from full, simple out of order match', (assert) => {
  const actor = new BadActor2()
  var testSate4_1 = {}
  actor._inbox.push('krakov')
  actor._inbox.push('berlin')
  actor._inbox.push('moscow')
  actor.RECEIVE([{match: 'berlin', action: function() {
    testSate4_1.didMatch = true
  }}], function() {
    testSate4_1.continuationWasCalled = true
  })
  assert.ok(testSate4_1.didMatch, 'testSate4_1 should not have matched berlin')
  assert.ok(testSate4_1.continuationWasCalled, 'testSate4_1 continuation should not be called')
  assert.ok(actor._inbox.join() === 'krakov,moscow', 'we should have matched out of order')
  assert.ok(actor._savedMsgs.length === 0, 'we should have matched out of order')

  actor.RECEIVE([nullPattern], nullf)

  var threwBlockedError = false
  try {
    actor.RECEIVE([nullPattern], nullf)
  } catch (e) {
    if (e === BLOCKED_ERROR) threwBlockedError = true
  }
  assert.ok(threwBlockedError, 'dah! failed hokey test suite')
})

QUnit.test('test start from full, simple inner match', (assert) => {
  const actor = new BadActor2()
  var testSate5 = {}
  actor._inbox.push('sandwich', 'beetroot')
  actor.RECEIVE([{match: 'sandwich', action: function() {
    testSate5.outerDidMatch = true
    actor.RECEIVE([{match: 'beetroot', action: function() {
      testSate5.innerDidMatch = true
    }}], function() {
      testSate5.innerContinuationWasCalled = true
    })
  }}], function() {
    testSate5.outerContinuationWasCalled = true
  })
  assert.ok(testSate5.outerDidMatch, 'testSate5 should have matched krakov')
  assert.ok(testSate5.outerContinuationWasCalled, 'testSate5 continuation should be called')
  assert.ok(testSate5.innerDidMatch, 'testSate5 should have matched krakov')
  assert.ok(testSate5.innerContinuationWasCalled, 'testSate5 continuation should be called')
})

QUnit.test('test start from full, simple inner fail', (assert) => {
  const actor = new BadActor2()
  var testSate6 = {}
  actor._inbox.push('sandwich', 'beetroot')
  actor.RECEIVE([{match: 'sandwich', action: function() {
    testSate6.outerDidMatch = true
    actor.RECEIVE([{match: 'cabbage', action: function() {
      testSate6.innerDidMatch = true
    }}], function() {
      testSate6.innerContinuationWasCalled = true
    })
  }}], function() {
    testSate6.outerContinuationWasCalled = true
  })
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

QUnit.test('test start from empty, simple match', (assert) => {
  const actor = new BadActor2()
  var testSate1 = {}
  actor.RECEIVE([{match: 'YES', action: function() {
    testSate1.didMatch = true
  }}], function() {
    testSate1.continuationWasCalled = true
  })
  actor.sendMsg('YES')
  assert.ok(testSate1.didMatch, 'testSate1 should have matched YES')
  assert.ok(testSate1.continuationWasCalled, 'testSate1continuation should be called')
})

QUnit.test('test start from empty, simple fail', (assert) => {
  const actor = new BadActor2()
  var testSate8 = {}
  actor.RECEIVE([{match: 'YES', action: function() {
    testSate8.didMatch = true
  }}], function() {
    testSate8.continuationWasCalled = true
  })
  actor.sendMsg('NO')
  assert.ok(!testSate8.didMatch, 'testSate8 should have matched YES')
  assert.ok(!testSate8.continuationWasCalled, 'testSate8 should be called')
})

QUnit.test('test start from empty, simple inner match', (assert) => {
  const actor = new BadActor2()
  var testState9 = {}
  actor.RECEIVE([{match: 'sandwich', action: function() {
    testState9.outerDidMatch = true
    actor.RECEIVE([{match: 'beetroot', action: function() {
      testState9.innerDidMatch = true
    }}], function() {
      testState9.innerContinuationWasCalled = true
    })
  }}], function() {
    testState9.outerContinuationWasCalled = true
  })
  actor.sendMsg('beetroot')
  actor.sendMsg('sandwich')
  assert.ok(testState9.outerDidMatch, 'testState9 should have matched krakov')
  assert.ok(testState9.outerContinuationWasCalled, 'testState9 continuation should be called')
  assert.ok(testState9.innerDidMatch, 'testState9 should have matched krakov')
  assert.ok(testState9.innerContinuationWasCalled, 'testState9 continuation should be called')
})

QUnit.test('test start from empty, simple inner fail', (assert) => {
  const actor = new BadActor2()
  var testSate10 = {}
  actor.RECEIVE([{match: 'sandwich', action: function() {
    testSate10.outerDidMatch = true
    actor.RECEIVE([{match: 'beetroot', action: function() {
      testSate10.innerDidMatch = true
    }}], function() {
      testSate10.innerContinuationWasCalled = true
    })
  }}], function() {
    testSate10.outerContinuationWasCalled = true
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

  assert.ok(actor._inbox.length === 1 && actor._inbox[0] === 'rootoot', 'should be 1')
  assert.ok(actor._cntxStack.length === 0 && actor._savedMsgs.length === 0, 'stack should be empty')
})

QUnit.test('test some recursive shit where we send ourself messages in the middle of a match', (assert) => {
  const actor = new BadActor2()
  var testState11 = {results: []}
  actor.RECEIVE([{match: 'outer', action: function() {
    actor.sendMsg('whaaaa????')
    actor.RECEIVE([{match: 'whaaaa????', action: function() {
      testState11.results.push('inner1')
    }}], function() { testState11.results.push('inner2') })
  }}], function() {
    testState11.results.push('outer')
  })
  actor.sendMsg('outer')
  actor.sendMsg('ignored')
  assert.ok(testState11.results.join() === 'inner1,inner2,outer', 'results should be ordered correctly: ' + testState11.results.join())
})

QUnit.test('test simple timer fires', (assert) => {
  const done = assert.async()
  const actor = new BadActor2()
  const results = []
  actor.RECEIVE([{match: TIME_OUT, action: function() {
    results.push('timeoutreceived')
  }}], function() {
    assert.ok(results[0] === 'timeoutreceived', 'timeout didnt trigger')
    done()
  }, 10)
})

QUnit.test('test simple timer doesnt fire', (assert) => {
  const done = assert.async()
  const actor = new BadActor2()
  const results = []
  actor.RECEIVE([
    {match: 'hello', action: function() {
      results.push('helloreceived')
    }},
    {match: TIME_OUT, action: function() {
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

QUnit.test('test simple immediate timeout', (assert) => {
  const done = assert.async()
  const actor = new BadActor2()
  const results = []
  actor.RECEIVE([
    {match: TIME_OUT, action: function() {
      results.push('timeoutreceived')
    }}], function() {
      assert.ok(results[0] === 'timeoutreceived', 'timeout didnt trigger')
      done()
    }, 0)
})

QUnit.test('test immediate timeout isnt cancelled', (assert) => {
  const done = assert.async()
  const actor = new BadActor2()
  const results = []
  actor.sendMsg('hello')
  actor.RECEIVE([
    {match: 'hello', action: function() {
      results.push('hello')
    }},
    {match: TIME_OUT, action: function() {
      results.push('timeoutreceived')
    }}], function() {
      assert.ok(results.join() === 'hello,timeoutreceived', 'timeout was cancelled')
      done()
    }, 0)
})

QUnit.test('initial test of an error', (assert) => {
  const actor = new BadActor2()
  actor.sendMsg('hello')
  actor.RECEIVE([
    {match: 'hello', action: function() {
      throw new Error('please be caught')
    }}], function() {}
               )
  const results = []
  actor.sendMsg('this should just be swallowed')
  actor.RECEIVE([{match: 'this should just be swallowed', action: () => { results.push('derp')}}], () => {
    results.push('derp again')
  })
  assert.ok(results.length === 0, 'phew im glad we got here')
})

QUnit.test('mixing in the actor somehow', (assert) => {
  var strokeCount = 0
  const done = assert.async()

  class DogConstructor extends BadActor2 {
    dogLoop() {
      this.RECEIVE([{
        match: 'stroke',
        action: () => {
          strokeCount++
          this.dogLoop()
        }}], nullf)
    }
  }

  const dog = new DogConstructor()
  dog.dogLoop()
  var strokeDog = () => { dog.sendMsg('stroke') }
  setTimeout(strokeDog, 10)
  setTimeout(strokeDog, 100)
  setTimeout(strokeDog, 150)
  setTimeout(strokeDog, 200)
  var finishedChecker = setInterval(() => {
    if (strokeCount === 3) {
      clearInterval(finishedChecker)
      assert.ok('woo', 'im glad this worked')
      done()
    }
  }, 5)
})

QUnit.test('ugh timeout zero is messed up with nested receive', (assert) => {
  const done = assert.async()
  const results = []
  class DogConstructor extends BadActor2 {
    startLoop() {
      this.RECEIVE([{
        match: 'stroke1',
        action: () => {
          results.push('one')

          this.RECEIVE([{
            match: 'stroke2',
            action: () => {
              results.push('two')

              this.RECEIVE([{
                match: 'stroke3',
                action: () => {
                  results.push('three')
                }}], nullf)
            }}], nullf)
        }},
        {match: TIME_OUT, action: function() {
          results.push('timeoutreceived')
        }}
        ], () => {
          results.push('complete')
        }, 0)
    }
  }

  var dog = new DogConstructor()
  dog.sendMsg('stroke1')
  dog.startLoop()
  setTimeout(() => { dog.sendMsg('stroke2') }, 100)
  setTimeout(() => { dog.sendMsg('stroke3') }, 150)

  const expected = 'one,two,three,timeoutreceived,complete'
  setTimeout(() => {
    assert.ok(results.join() === expected, ': ' + results.join())
    done()
  }, 500)
})

QUnit.test('experiment with containing errors', (assert) => {
  const actor = new BadActor2()
  var res = 'initialvalue'
  actor.RECEIVE([{
    match: 'fuckthingsup',
    action: () => {
      throw new Error('yeah im screwed')
    }}], function() {
      res = 'setingaction'
    })
  actor.sendMsg('fuckthingsup')
  assert.ok(res === 'initialvalue', 'this shouldnt happen')
})

// shit! of course the main thing with erlang is immutable data in a neverending loop
QUnit.test('what happens if you infinte loop?', (assert) => {
  const done = assert.async()
  const actor = new BadActor2()
  var testlock = true
  function loop(data) {
    actor.RECEIVE([{
      match: 'doit',
      action: () => {
        testlock = true
        loop(data)
      }}], nullf)
  }
  loop({})

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

QUnit.test('red green callbacks', (assert) => {
  const done = assert.async()
  var res = 'initialvalue'

  class AsyncObConstructor extends BadActor2 {
    init() {
      this.RECEIVE([{
        match: 'urlLoaded',
        action: () => {
          res = 'setingaction'
        }}], () => {
          this.cleanup()
          assert.ok(res === 'setingaction', 'this shouldnt happen')
          done()
        })
    }
    cleanup() {}
  }

  const asyncOb = new AsyncObConstructor()
  asyncOb.init()

  setTimeout(function() {
    asyncOb.sendMsg('urlLoaded')
  })
})

QUnit.test('lets test multiple objects', (assert) => {
  const done = assert.async()
  class AsyncObConstructor1 extends BadActor2 {
    init(initialServerState) {
      this.loop(initialServerState)
    }
    loop(serverState) {
      this.RECEIVE([{
        match: 'ping',
        action: () => {
          serverState['client'].sendMsg('pong')
        }}], nullf)
    }
  }
  class AsyncObConstructor2 extends BadActor2 {
    init(initialClientState) {
      initialClientState.server.sendMsg('ping')
      this.loop(initialClientState)
    }
    loop(clientState) {
      this.RECEIVE([{
        match: 'pong',
        action: () => {
          assert.ok(true, 'yay we sent a message and received a response')
          done()
        }}], nullf)
    }
  }

  const serverActor = new AsyncObConstructor1()
  const clientActor = new AsyncObConstructor2()
  serverActor.init({client: clientActor})
  clientActor.init({server: serverActor})
})

QUnit.test('check normal timeout and crashes in action', (assert) => {
  const done = assert.async()
  const actor = new BadActor2()
  const results = []
  actor.RECEIVE([
    {match: TIME_OUT, action: function() {
      results.push('this should happen')
      throw new Error('i cant javascript')
    }}], function() {
      results.push('this shouldnt happen')
    }, 1)

  setTimeout(function() {
    assert.ok(results.length === 1, 'after shouldnt happen')
    assert.ok(results[0] === 'this should happen', 'after shouldnt happen')
    done()
  }, 10)
})

QUnit.test('check normal timeout and crashes in after', (assert) => {
  const done = assert.async()
  const actor = new BadActor2()
  const results = []
  actor.RECEIVE([
    {match: TIME_OUT, action: function() {
      results.push('timeoutreceived')
    }}], function() {
      throw new Error('i cant javascript')
    }, 1)

  setTimeout(function() {
    assert.ok(results[0] === 'timeoutreceived', 'timeout didnt trigger')
    done()
  }, 10)
})

QUnit.test('check immediate timeout and crashes in action', (assert) => {
  const done = assert.async()
  const actor = new BadActor2()
  const results = []
  actor.RECEIVE([
    {match: TIME_OUT, action: function() {
      throw new Error('i cant javascript')
    }}], function() {
      results.push('this shouldnt happen')
    }, 0)

  setTimeout(function() {
    assert.ok(results.length === 0, 'after shouldnt happen')
    done()
  }, 10)
})

QUnit.test('check immediate timeout and crashes in after', (assert) => {
  const done = assert.async()
  const actor = new BadActor2()
  const results = []
  actor.RECEIVE([
    {match: TIME_OUT, action: function() {
      results.push('timeoutreceived')
    }}], function() {
      throw new Error('i cant javascript')
    }, 0)

  setTimeout(function() {
    assert.ok(results[0] === 'timeoutreceived', 'timeout didnt trigger')
    done()
  }, 10)
})

QUnit.test('test unwinding the stack a pid high up the stack has immediate timeout and it crashes in the timeout action', (assert) => {
  const done = assert.async()
  const actor = new BadActor2()
  const results = []
  actor.sendMsg('ping')
  actor.sendMsg('pong')
  actor.RECEIVE([
    {match: 'ping', action: () => {
      actor.RECEIVE([
        {match: 'pong', action: () => {
          debugger
        }}], nullf)
    }},
    {match: TIME_OUT, action: () => {
      throw new Error('i should throw when unwinding')
    }}], function() {
      results.push('timeoutreceived')
    }, 0)

  setTimeout(function() {
    assert.ok(results.length === 0, 'continuation should not have been called')
    done()
  }, 10)
})


// good link and monitor reference http://marcelog.github.io/articles/erlang_link_vs_monitor_difference.html
QUnit.test('test simple link - forward', (assert) => {
  // remember links are two way
  const done = assert.async()
  const actor1 = new BadActor2()
  const actor2 = new BadActor2()
  actor2.link(actor1)
  actor1.RECEIVE([
    {match: 'simulate_error', action: () => {
      throw new Error('derp')
    }}], nullf)
  actor1.sendMsg('simulate_error')
  assert.ok(actor2.DEAD, 'the error should kill the linked actor')
  done()
})

QUnit.test('test simple link - backwards', (assert) => {
  const done = assert.async()
  const actor1 = new BadActor2()
  const actor2 = new BadActor2()
  actor2.link(actor1)
  actor2.RECEIVE([
    {match: 'simulate_error', action: () => {
      throw new Error('derp')
    }}], nullf)
  actor2.sendMsg('simulate_error')
  assert.ok(actor1.DEAD, 'the error should kill the linked actor')
  done()
})

QUnit.test('test simple link - trap exit', (assert) => {
  const done = assert.async()
  const actor1 = new BadActor2()
  const actor2 = new BadActor2()
  actor2.trapExit(true)

  actor2.link(actor1)
  actor1.RECEIVE([
    {match: 'simulate_error', action: () => {
      throw new Error('derp')
    }}], nullf)

  actor2.RECEIVE([
    {match: EXIT, action: () => {
      assert.ok(!actor2.DEAD, 'actor2 should trap the exit')
      done()
    }}], nullf)

  actor1.sendMsg('simulate_error')
})

QUnit.test('test simple monitor', (assert) => {
  // monitors are one way
  const done = assert.async()
  const actor1 = new BadActor2()
  const actor2 = new BadActor2()
  actor2.monitor(actor1)

  const results = []
  actor1.RECEIVE([
    {match: 'simulate_error', action: () => {
      throw new Error('derp')
    }}], nullf)

  actor2.RECEIVE([
    {match: DOWN, action: () => {
      results.push('todo: we need to send the object and the error')
    }}], nullf)

  actor1.sendMsg('simulate_error')

  setTimeout(function() {
    assert.ok(results.length === 1, 'we should have received the DOWN')
    assert.ok(results[0] === 'todo: we need to send the object and the error', 'we should have received the DOWN')
    done()
  }, 10)
})

QUnit.test('empty mailbox with star match', (assert) => {
  const actor = new BadActor2()
  actor.sendMsg('one')
  actor.sendMsg('two')
  actor.sendMsg('three')
  function emptyMailbox() {
    actor.RECEIVE([
      {match: '*', action: emptyMailbox}
    ], nullf, 0)
  }
  emptyMailbox()
  assert.ok(actor._inbox.length === 0, 'mailbox should have been recursively emptied')
  assert.ok(actor._savedMsgs.length === 0, 'mailbox should have been recursively emptied')
})
