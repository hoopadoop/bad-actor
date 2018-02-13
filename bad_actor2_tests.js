/* global QUnit */
// @flow
import invariant from "invariant"

import Actor, {
  BLOCKED_ERROR,
  TIME_OUT,
  DOWN,
  EXIT,
  register,
  unregister,
  sendMsg,
  registered
} from "modules/actor2"
import type { MsgT, ActionFunctionT } from "modules/actor2" // eslint-disable-line no-duplicate-imports
//import Mailbox from "modules/mailbox"

QUnit.module("actor")

// todo: import this
// const AUDIOURL = 'https://audioboom.com/posts/4193114-how-do-you-even-lose-someone-s-ashes.mp3?stitched=0'

function nullf(a?: any): void {}
function nullAction(_: any) {
  return null
}
const nullPattern = {
  match: "",
  action: (_: MsgT) => {
    return null
  }
}

/* you can use these to run just one test.. replace test with ttest */
// var qu: any = QUnit
// QUnit.test = QUnit.test
// qu.test = function() {}

QUnit.test("dies when function ends", assert => {
  let hasRun = false
  const actor = new Actor(function(pid) {
    hasRun = true
  })
  assert.ok(hasRun, "must have run the init function")
  assert.ok(actor.DEAD, "must be dead")
})

QUnit.test("blocks when given receive function", assert => {
  const actor = new Actor(function(pid) {
    pid.receive([
      {
        match: "unblock",
        action: nullAction
      }
    ])
  })
  assert.ok(!actor.DEAD, "must not be dead")
  assert.ok(actor._blocking(), "must be blocking")

  actor.send("unblock")
  assert.ok(actor.DEAD, "must be dead")
  assert.ok(!actor._blocking(), "must not be blocking")
})

QUnit.test("simple fail to match", assert => {
  var testSate8 = {}
  const actor = new Actor(pid => {
    pid.receive(
      [
        {
          match: "YES",
          action: function() {
            testSate8.didMatch = true
          }
        }
      ],
      () => {
        testSate8.continuationWasCalled = true
      }
    )
  })
  actor.send("NO")
  assert.ok(!testSate8.didMatch, "testSate8 should have matched YES")
  assert.ok(!testSate8.continuationWasCalled, "testSate8 should be called")
  assert.ok(!actor.DEAD, "must not be dead")
  assert.ok(actor._blocking(), "must be blocking")
})

QUnit.test("calls action on match and continues after unblocking", assert => {
  var testSate1 = {}
  const actor = new Actor(pid => {
    pid.receive(
      [
        {
          match: "YES",
          action: function() {
            testSate1.didMatch = true
          }
        }
      ],
      () => {
        assert.ok(!actor.DEAD, "i dont know if actor should be dead or not")
        testSate1.continuationWasCalled = true
      }
    )
  })
  actor.send("YES")
  assert.ok(testSate1.didMatch, "testSate1 should have matched YES")
  assert.ok(
    testSate1.continuationWasCalled,
    "testSate1continuation should be called"
  )
  assert.ok(actor.DEAD, "must be dead")
})

QUnit.test("we can receive in a continuation, right?", assert => {
  var testSate1 = {}
  const actor = new Actor(pid => {
    pid.receive(
      [
        {
          match: "YES",
          action: () => {
            testSate1.didMatch = true
            actor.send("HELLO")
          }
        }
      ],
      () => {
        return pid.receive([
          {
            match: "HELLO",
            action: () => {
              testSate1.didMatchInContinuation = true
            }
          }
        ])
      }
    )
  })
  actor.send("YES")
  assert.ok(testSate1.didMatch, "testSate1 should have matched YES")
  assert.ok(
    testSate1.didMatchInContinuation,
    "testSate1continuation should be called"
  )
  assert.ok(actor.DEAD, "must be dead")
})

QUnit.test("receive in a continuation can block", assert => {
  var testSate1 = {}
  const actor = new Actor(pid => {
    pid.receive(
      [
        {
          match: "YES",
          action: () => {
            testSate1.didMatch = true
          }
        }
      ],
      () => {
        return pid.receive([
          {
            match: "HELLO",
            action: () => {
              assert.ok(
                !actor.DEAD,
                "i dont know if actor should be dead or not"
              )
              testSate1.didMatchInContinuation = true
            }
          }
        ])
      }
    )
  })
  actor.send("YES")
  assert.ok(testSate1.didMatch, "testSate1 should have matched YES")

  actor.send("HELLO")
  assert.ok(
    testSate1.didMatchInContinuation,
    "testSate1continuation should be called"
  )
  assert.ok(actor.DEAD, "must be dead")
})

QUnit.test("matching more complex messages", assert => {
  let itworked = false
  function actorLoop(pid) {
    pid.receive([
      {
        match: { self: assert, txt: "hello" },
        action: a => {
          itworked = true
        }
      }
    ])
  }
  const actor = new Actor(actorLoop)
  actor.send({ self: assert, txt: "hello" })
  assert.ok(itworked, "using underscore we can match more complex objects")
  assert.ok(actor.DEAD, "must be dead")
})

QUnit.test("matching with regexes - both regexes", assert => {
  let itworked = false
  function actorLoop(pid) {
    pid.receive([
      {
        match: /ab+c/,
        action: a => {
          itworked = true
        }
      }
    ])
  }
  const actor = new Actor(actorLoop)
  actor.send(/ab+c/)
  assert.ok(itworked, "using underscore we can match more complex objects")
  assert.ok(actor.DEAD, "must be dead")
})

QUnit.test("matching with regexes - regex pattern, string meg", assert => {
  let itworked = false
  function actorLoop(pid) {
    pid.receive([
      {
        match: /ab+c/,
        action: a => {
          itworked = true
        }
      }
    ])
  }
  const actor = new Actor(actorLoop)
  actor.send("abbbbc")
  assert.ok(itworked, "using underscore we can match more complex objects")
  assert.ok(actor.DEAD, "must be dead")
})

QUnit.test("matching with regexes - string pattern, regex msg", assert => {
  let itworked = false
  function actorLoop(pid) {
    pid.receive([
      {
        match: "abbbbc",
        action: a => {
          itworked = true
        }
      }
    ])
  }
  const actor = new Actor(actorLoop)
  actor.send(/ab+c/)
  assert.ok(itworked, "using underscore we can match more complex objects")
  assert.ok(actor.DEAD, "must be dead")
})

QUnit.test("matching even more complex messages *", assert => {
  let itworked = false
  function actorLoop(pid) {
    pid.receive([
      {
        match: { self: assert, data: { type: "error", txt: "*" } },
        action: a => {
          itworked = true
        }
      }
    ])
  }
  const actor = new Actor(actorLoop)
  actor.send({
    self: assert,
    data: {
      type: "error",
      txt: "hello"
    }
  })
  assert.ok(itworked, "using underscore we can match more complex objects")
  assert.ok(actor.DEAD, "must be dead")
})

QUnit.test("simple out of order match", assert => {
  var testSate41 = {}
  const actor = new Actor(pid => {
    pid.receive(
      [
        {
          match: "berlin",
          action: () => {
            testSate41.didMatch = true
          }
        }
      ],
      function() {
        testSate41.continuationWasCalled = true
        assert.ok(
          actor._inbox._msgs().join() === "krakov,moscow",
          "we should have matched out of order"
        )
        assert.ok(
          actor._inbox._savedMsgs().length === 0,
          "we should have matched out of order"
        )
      }
    )
  })
  actor.send("krakov")
  actor.send("moscow")
  actor.send("berlin")

  assert.ok(testSate41.didMatch, "testSate4_1 should not have matched berlin")
  assert.ok(
    testSate41.continuationWasCalled,
    "testSate4_1 continuation should not be called"
  )
  assert.ok(actor.DEAD, "must be dead")
})

QUnit.test("cannot double receive", assert => {
  const actor = new Actor(pid => {
    pid.receive([
      {
        match: "berlin",
        action: nullAction
      }
    ])
  })
  var threwBlockedError = false
  try {
    actor.receive([nullPattern])
  } catch (e) {
    if (e === BLOCKED_ERROR) threwBlockedError = true
  }
  assert.ok(threwBlockedError, "dah! failed hokey test suite")
})

QUnit.test("red green callbacks", assert => {
  const done = assert.async()
  var res = "initialvalue"
  function asyncLoop(pid) {
    pid.receive(
      [
        {
          match: "urlLoaded",
          action: () => {
            res = "setingaction"
          }
        }
      ],
      () => {
        assert.ok(res === "setingaction", "this shouldnt happen")
        done()
      }
    )
  }
  const asyncOb = new Actor(asyncLoop)
  setTimeout(() => {
    asyncOb.send("urlLoaded")
  })
})

QUnit.test("what happens if you infinte loop?", assert => {
  const done = assert.async()
  var testlock = true
  function loop(pid, data) {
    pid.receive([
      {
        match: "doit",
        action: () => {
          testlock = true
          loop(pid, data)
        }
      }
    ])
  }
  const actor = new Actor(loop)
  var msgSentCount = 0
  var t = setInterval(() => {
    if (testlock === false) return
    testlock = false
    if (msgSentCount === 10) {
      clearInterval(t)
      assert.ok(true, "placeholder assert")
      done()
    }
    actor.send("doit")
    msgSentCount++
  }, 1)
})

QUnit.test("simple inner match", assert => {
  var testState9 = {}
  const actor = new Actor(pid => {
    pid.receive(
      [
        {
          match: "sandwich",
          action: () => {
            testState9.outerDidMatch = true
            return pid.receive(
              [
                {
                  match: "beetroot",
                  action: () => {
                    testState9.innerDidMatch = true
                  }
                }
              ],
              () => {
                testState9.innerContinuationWasCalled = true
              }
            )
          }
        }
      ],
      () => {
        testState9.outerContinuationWasCalled = true
      }
    )
  })
  actor.send("beetroot")
  actor.send("sandwich")
  assert.ok(testState9.outerDidMatch, "testState9 should have matched sandwich")
  assert.ok(
    testState9.outerContinuationWasCalled,
    "testState9 continuation should be called"
  )
  assert.ok(testState9.innerDidMatch, "testState9 should have matched beetroot")
  assert.ok(
    testState9.innerContinuationWasCalled,
    "testState9 continuation should be called"
  )
  assert.ok(actor.DEAD, "must be dead")
  assert.ok(!actor._blocking(), "must not be blocking")
})

QUnit.test(
  "some recursive shit where we send ourself messages in the middle of a match",
  assert => {
    var testState11 = { results: [] }
    const actor = new Actor(pid => {
      pid.receive(
        [
          {
            match: "outer",
            action: () => {
              pid.send("whaaaa????")
              return pid.receive(
                [
                  {
                    match: "whaaaa????",
                    action: () => {
                      testState11.results.push("inner1")
                    }
                  }
                ],
                () => {
                  testState11.results.push("inner2")
                }
              )
            }
          }
        ],
        () => {
          testState11.results.push("outer")
        }
      )
    })
    actor.send("outer")
    actor.send("ignored")
    assert.ok(
      testState11.results.join() === "inner1,inner2,outer",
      "results should be ordered correctly: " + testState11.results.join()
    )
  }
)

QUnit.test("lets test multiple objects", assert => {
  var results = []
  function serverLoop(pid, serverState) {
    return pid.receive([
      {
        match: { name: "setClient", data: "*" },
        action: msg => {
          serverState.client = msg.data
          serverState.client.send({ name: "ping", sender: pid })
          return serverLoop(pid, serverState)
        }
      },
      {
        match: "pong",
        action: () => {
          results.push("pong")
        }
      }
    ])
  }
  function clientLoop(pid, clientState) {
    return pid.receive([
      {
        match: { name: "ping", sender: "*" },
        action: msg => {
          results.push("ping")
          clientState.server = msg.sender.send("pong")
        }
      }
    ])
  }
  const serverActor = new Actor(serverLoop, { client: null })
  const clientActor = new Actor(clientLoop, { server: null })
  serverActor.send({ name: "setClient", data: clientActor })
  assert.ok(results.join() === "ping,pong", results.join())
  assert.ok(serverActor.DEAD, "should have finished")
  assert.ok(clientActor.DEAD, "should have finished")
})

QUnit.test("simple inner fail 1", assert => {
  var testSate6 = {}
  const actor = new Actor(pid => {
    pid.receive(
      [
        {
          match: "sandwich",
          action: () => {
            testSate6.outerDidMatch = true
            return pid.receive(
              [
                {
                  match: "cabbage",
                  action: () => {
                    testSate6.innerDidMatch = true
                  }
                }
              ],
              () => {
                testSate6.innerContinuationWasCalled = true
              }
            )
          }
        }
      ],
      () => {
        testSate6.outerContinuationWasCalled = true
      }
    )
  })
  actor.send("sandwich")
  actor.send("beetroot")

  assert.ok(testSate6.outerDidMatch, "testSate6 should have matched krakov")
  assert.ok(
    !testSate6.outerContinuationWasCalled,
    "testSate6 continuation should not be called"
  )
  assert.ok(!testSate6.innerDidMatch, "testSate6 should have matched krakov")
  assert.ok(
    !testSate6.innerContinuationWasCalled,
    "testSate6 continuation should be called"
  )
  var threwBlockedError2 = null
  try {
    actor.receive([nullPattern])
  } catch (e) {
    if (e === BLOCKED_ERROR) threwBlockedError2 = true
  }
  assert.ok(threwBlockedError2, "dah! failed hokey test suite")
})

QUnit.test("simple inner fail 2", assert => {
  var testSate10 = {}
  const actor = new Actor(pid => {
    pid.receive(
      [
        {
          match: "sandwich",
          action: () => {
            testSate10.outerDidMatch = true
            return pid.receive(
              [
                {
                  match: "beetroot",
                  action: () => {
                    testSate10.innerDidMatch = true
                  }
                }
              ],
              () => {
                testSate10.innerContinuationWasCalled = true
              }
            )
          }
        }
      ],
      () => {
        testSate10.outerContinuationWasCalled = true
      }
    )
  })

  actor.send("rootoot")
  actor.send("sandwich")
  assert.ok(testSate10.outerDidMatch, "testSate10 should have matched krakov")
  assert.ok(
    !testSate10.outerContinuationWasCalled,
    "testSate10 continuation should be called"
  )
  assert.ok(!testSate10.innerDidMatch, "testSate10 should have matched krakov")
  assert.ok(
    !testSate10.innerContinuationWasCalled,
    "testSate10 continuation should be called"
  )

  actor.send("beetroot")
  assert.ok(testSate10.innerDidMatch, "testSate10 should have matched beetroot")
  assert.ok(
    testSate10.innerContinuationWasCalled,
    "testSate10 inner continuation should be called"
  )
  assert.ok(
    testSate10.outerContinuationWasCalled,
    "testSate10 outer continuation should be called"
  )
  assert.ok(actor.DEAD, "must be dead")
})

QUnit.test("simple timer doesnt fire", assert => {
  const done = assert.async()
  const results = []
  const actor = new Actor(pid => {
    pid.receive(
      [
        {
          match: "hello",
          action: () => {
            results.push("helloreceived")
          }
        },
        {
          match: TIME_OUT,
          action: () => {
            results.push("timeoutreceived")
          }
        }
      ],
      null,
      100
    )

    setTimeout(() => {
      actor.send("hello")
    }, 10)

    setTimeout(() => {
      assert.ok(results.join() === "helloreceived", results.join())
      done()
    }, 200)
  })
  assert.ok(!actor.DEAD, "must not be dead")
  assert.ok(actor._blocking(), "must be blocking")
})

QUnit.test("normal timeout", assert => {
  const done = assert.async()
  const results = []
  const actor = new Actor(pid => {
    pid.receive(
      [
        {
          match: TIME_OUT,
          action: () => {
            results.push("timeoutreceived")
          }
        }
      ],
      () => {
        setTimeout(cleanup, 2)
      },
      10
    )
  })
  function cleanup() {
    assert.ok(results[0] === "timeoutreceived", "timeout didnt trigger")
    assert.ok(actor.DEAD, "must be dead")
    done()
  }
  assert.ok(actor, "silence warning")
})

QUnit.test("immediate timeout", assert => {
  const done = assert.async()
  const results = []
  const actor = new Actor(pid => {
    pid.receive(
      [
        {
          match: TIME_OUT,
          action: () => {
            results.push("timeoutreceived")
          }
        }
      ],
      () => {
        setTimeout(cleanup, 2)
      },
      0
    )
  })
  function cleanup() {
    assert.ok(results[0] === "timeoutreceived", "timeout didnt trigger")
    assert.ok(actor.DEAD, "must be dead")
    done()
  }
  assert.ok(actor, "silence warning")
})

QUnit.test("immediate timeout restores savedMsgs", assert => {
  // the 1st msg, 'swallowed' should be on the save stack
  // when TIME_OUT matched,
  var previouslySwallowedWasMatched = false
  const actor = new Actor(pid => {
    pid.receive([
      {
        match: "go inner",
        action: () => {
          return pid.receive(
            [
              {
                match: TIME_OUT,
                action: () => {
                  return pid.receive([
                    {
                      match: "swallowed",
                      action: () => {
                        previouslySwallowedWasMatched = true
                      }
                    }
                  ])
                }
              }
            ],
            null,
            0
          )
        }
      }
    ])
  })

  actor.send("swallowed")
  actor.send("go inner")
  assert.ok(
    previouslySwallowedWasMatched,
    "are we putting the saved messages back in the mbox?"
  )
})

QUnit.test("quite complex immediate timeout", assert => {
  const done = assert.async()

  function emptyMailbox(pid: Actor, continuation: ActionFunctionT) {
    return pid.receive(
      [
        {
          match: "*",
          action: msg => {
            console.log(JSON.stringify(msg))
            return () => emptyMailbox(pid, continuation)
          }
        },
        {
          match: TIME_OUT,
          action: () => {
            return continuation
          }
        }
      ],
      null,
      0
    )
  }
  const actor = new Actor(pid => {
    pid.receive([
      {
        match: "level1",
        action: () => {
          return emptyMailbox(pid, msg => {
            return () =>
              pid.receive([
                {
                  match: "level2",
                  action: () => {
                    assert.ok(!actor.DEAD, "must be dead")
                    done()
                  }
                }
              ])
          })
        }
      }
    ])
  })
  actor.send("eatme")
  actor.send("level1")
  setTimeout(() => {
    actor.send("level2")
  }, 100)
})

QUnit.test("inner normal timeout", assert => {
  const done = assert.async()
  const results = []
  const actor = new Actor(pid => {
    pid.receive(
      [
        {
          match: "go deep",
          action: () => {
            results.push("go deep")
            return pid.receive(
              [
                {
                  match: TIME_OUT,
                  action: () => {
                    results.push("inner timeoutreceived")
                  }
                }
              ],
              () => {
                setTimeout(cleanup, 2)
              },
              10
            )
          }
        }
      ],
      () => {
        results.push("continue")
      }
    )
  })
  function cleanup() {
    assert.ok(
      results.join() === "go deep,inner timeoutreceived,continue",
      results.join()
    )
    assert.ok(actor.DEAD, "must be dead")
    done()
  }
  actor.send("go deep")
})

QUnit.test("timeout, then receive", assert => {
  const done = assert.async()
  const actor = new Actor(pid => {
    pid.receive(
      [
        {
          match: TIME_OUT,
          action: () => {
            return pid.receive(
              [
                {
                  match: "go deep",
                  action: () => {
                    assert.ok(true, "must be dead")
                    done()
                  }
                }
              ],
              () => {}
            )
          }
        }
      ],
      () => {},
      10
    )
  })
  actor.send("go deep")
})

// empty the whole mailbox, then timeout zero is called
// SHIT AGAIN I AM NOT UNDERSTANDING HOW ZERO WORKS IN RECURSIVE FLUSH - ok timeout zero doesnt match if something else does! (only the last matches)
QUnit.test("empty mailbox with star match", assert => {
  const results = []
  function emptyMailbox(pid: Actor, l: string) {
    return pid.receive(
      [
        {
          match: "*",
          action: a => {
            results.push("*")
            return emptyMailbox(pid, a)
          }
        },
        {
          match: TIME_OUT,
          action: () => {
            results.push("timeoutreceived:" + l)
          }
        }
      ],
      () => {
        results.push("continue inner:" + l)
      },
      0
    )
  }
  function actorLoop(pid: Actor) {
    pid.receive(
      [
        {
          match: "unblock",
          action: () => {
            return emptyMailbox(pid, "init")
          }
        }
      ],
      () => {
        results.push("continue outer")
      }
    )
  }
  const actor = new Actor(actorLoop)
  actor.send("one")
  actor.send("two")
  actor.send("three")
  actor.send("unblock")
  assert.ok(
    results.join() ===
      "*,*,*,timeoutreceived:three,continue inner:three,continue inner:two,continue inner:one,continue inner:init,continue outer",
    results.join()
  )
  assert.ok(actor.DEAD, "must be dead")
})

// i don't know what this was meant to test but it doesn't do anything useful anymore
QUnit.test("ugh timeout zero is messed up with nested receive", assert => {
  const done = assert.async()
  const results = []

  function dogLoop(pid) {
    pid._inbox.push("stroke1")

    setTimeout(() => {
      pid.send("stroke2")
    }, 100)
    setTimeout(() => {
      pid.send("stroke3")
    }, 150)

    return pid.receive(
      [
        {
          match: "stroke1",
          action: () => {
            results.push("one")
            return pid.receive([
              {
                match: "stroke2",
                action: () => {
                  results.push("two")
                  return pid.receive([
                    {
                      match: "stroke3",
                      action: () => {
                        results.push("three")
                      }
                    }
                  ])
                }
              }
            ])
          }
        },
        {
          match: TIME_OUT,
          action: () => {
            results.push("timeoutreceived")
          }
        }
      ],
      () => {
        results.push("complete")
      },
      0
    )
  }
  const dog = new Actor(dogLoop)
  const expected = "one,two,three,complete"
  setTimeout(() => {
    assert.ok(results.join() === expected, ": " + results.join())
    assert.ok(dog.DEAD, "must be dead")
    done()
  }, 500)
})

/*
  i don't know why but i thought immediate timeout wasn't cancelled when a match happened but that's clearly wrong
QUnit.test('test immediate timeout isnt cancelled', (assert) => {
  const done = assert.async()
  const results = []
  const actor = new Actor((pid) => {
    pid.receive([{
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
  actor.send('hello')
})
*/

QUnit.test("initial test of an error", assert => {
  const results = []
  const actor = new Actor(pid => {
    pid.receive(
      [
        {
          match: "hello",
          action: () => {
            throw new Error("please be caught")
          }
        },
        {
          match: "this should just be swallowed",
          action: () => {
            results.push("derp")
          }
        }
      ],
      () => {
        results.push("berp")
      }
    )
  })
  actor.send("hello")
  assert.ok(actor.DEAD, "the error should kill the linked actor")
  actor.send("this should just be swallowed")
  assert.ok(results.length === 0, "phew im glad we got here")
})

QUnit.test("check normal timeout and crashes in action", assert => {
  const done = assert.async()
  const results = []
  const actor = new Actor(pid => {
    pid.receive(
      [
        {
          match: TIME_OUT,
          action: () => {
            results.push("this should happen")
            throw new Error("i cant javascript")
          }
        }
      ],
      () => {
        results.push("this shouldnt happen")
      },
      1
    )
  })
  setTimeout(() => {
    assert.ok(actor.DEAD, "hm")
    assert.ok(results.length === 1, "after shouldnt happen" + results.length)
    assert.ok(results[0] === "this should happen", "after shouldnt happen")
    done()
  }, 10)
})

QUnit.test("check normal timeout and crashes in after", assert => {
  const done = assert.async()
  const results = []
  const actor = new Actor(pid => {
    pid.receive(
      [
        {
          match: TIME_OUT,
          action: () => {
            results.push("timeoutreceived")
          }
        }
      ],
      () => {
        throw new Error("i cant javascript")
      },
      1
    )
  })
  setTimeout(() => {
    assert.ok(actor.DEAD, "hm")
    assert.ok(results[0] === "timeoutreceived", "timeout didnt trigger")
    done()
  }, 10)
})

QUnit.test("check immediate timeout and crashes in action", assert => {
  const done = assert.async()
  const results = []
  const actor = new Actor(pid => {
    pid.receive(
      [
        {
          match: TIME_OUT,
          action: () => {
            throw new Error("i cant javascript")
          }
        }
      ],
      () => {
        results.push("this shouldnt happen")
      },
      0
    )
  })
  setTimeout(() => {
    assert.ok(actor.DEAD, "hm")
    assert.ok(results.length === 0, "after shouldnt happen")
    done()
  }, 10)
})

QUnit.test("check immediate timeout and crashes in after", assert => {
  const done = assert.async()
  const results = []
  const actor = new Actor(pid => {
    pid.receive(
      [
        {
          match: TIME_OUT,
          action: () => {
            results.push("timeoutreceived")
          }
        }
      ],
      () => {
        throw new Error("i cant javascript")
      },
      0
    )
  })
  setTimeout(() => {
    assert.ok(actor.DEAD, "hm")
    assert.ok(results[0] === "timeoutreceived", "timeout didnt trigger")
    done()
  }, 10)
})

// i really misunderstood immediate timeout, these tests are useless now but i still feel i cant have been that wrong and ill need to change it back again
/*
QUnit.test('test unwinding the stack a pid high up the stack has immediate timeout and it crashes in the timeout action', (assert) => {
  const done = assert.async()
  const results = []
  const actor = new Actor((pid) => {
    pid.send('ping')
    pid.send('pong')
    pid.receive([
      {
        match: 'ping',
        action: () => {
          results.push('ping')
          pid.receive([{
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

// good link and monitor reference http://marcelog.github.io/articles/erlang_link_vs_monitor_difference.html
QUnit.test("simple link - forward", assert => {
  const actor1 = new Actor(pid => {
    pid.receive([
      {
        match: "simulate_error",
        action: () => {
          throw new Error("derp")
        }
      }
    ])
  })
  const actor2 = new Actor(pid => {
    pid.receive([
      {
        match: "block",
        action: nullf
      }
    ])
  })
  actor2.link(actor1)
  actor1.send("simulate_error")
  assert.ok(actor2.DEAD, "the error should kill the linked actor")
})

QUnit.test("spawn link", assert => {
  var childPid: Actor
  var didGetLinkedMsg = false

  function supervisorLoop(supPid, state1, state2, state3) {
    supPid.trapExit(true)
    childPid = supPid.spawnLink(
      (actor, _state1, _state2, _state3) => {
        assert.ok(_state1 === 1, "messed up the arguments1")
        assert.ok(_state2 === 2, "messed up the arguments2")
        assert.ok(_state3 === 3, "messed up the arguments3")
        actor.receive([
          {
            match: "bang",
            action: () => {
              throw new Error("derp - purposely crash object")
            }
          }
        ])
      },
      state1,
      state2,
      state3
    )

    return supPid.receive([
      {
        match: { name: EXIT, pid: "*", reason: "*" },
        action: () => {
          didGetLinkedMsg = true
        }
      },
      {
        match: "noproc",
        action: () => {
          return supPid.receive([{ match: "blocking", action: nullf }])
        }
      }
    ])
  }
  var supervisor = new Actor(supervisorLoop, 1, 2, 3)
  invariant(childPid, "should have been created")
  childPid.send("bang")
  assert.ok(childPid && childPid.DEAD, "should have died horribly")
  assert.ok(supervisor.DEAD, "should have died normally")
  assert.ok(
    didGetLinkedMsg,
    "should have received msg when worker died in init"
  )
})

QUnit.test("simple link - backwards", assert => {
  const actor1 = new Actor(pid => {
    pid.receive([
      {
        match: "unblock",
        action: nullf
      }
    ])
  })
  const actor2 = new Actor(pid => {
    pid.receive([
      {
        match: "simulate_error",
        action: () => {
          throw new Error("derp")
        }
      }
    ])
  })
  actor2.link(actor1)
  actor2.send("simulate_error")
  assert.ok(actor1.DEAD, "the error should kill the linked actor")
})

QUnit.test("simple link - trap exit", assert => {
  const done = assert.async()
  const actor1 = new Actor(pid => {
    pid.receive([
      {
        match: "simulate_error",
        action: () => {
          throw new Error("derp")
        }
      }
    ])
  })
  const actor2 = new Actor(pid => {
    pid.receive([
      {
        match: { name: EXIT, pid: "*", reason: "*" },
        action: msg => {
          assert.ok(!actor2.DEAD, "actor2 should trap the exit")
          done()
        }
      }
    ])
  })
  actor2.trapExit(true)
  actor2.link(actor1)
  actor1.send("simulate_error")
})

QUnit.test("normal exit linking", assert => {
  const actor1 = new Actor((pid, serverState) => {
    pid.receive([{ match: "unblock", action: () => {} }], () => {
      console.log("thats me dead")
    })
  })
  const actor2 = new Actor((pid, clientState) => {
    pid.receive(
      [
        {
          match: "unblock",
          action: msg => {}
        }
      ],
      nullf
    )
  })
  actor2.link(actor1) // actor2 should receive exit signal 'normal', and ignore it
  actor1.send("unblock")
  assert.ok(actor1.DEAD, "actor1 should die normally")
  assert.ok(!actor2.DEAD, "actor2 should ignore normal exits")
})

QUnit.test("trapping normal exit linking", assert => {
  const results = []
  const actor1 = new Actor((pid, serverState) => {
    pid.receive([{ match: "unblock", action: () => {} }], () => {
      console.log("thats me dead")
    })
  })
  const actor2 = new Actor((pid, clientState) => {
    pid.receive([
      {
        match: { name: EXIT, pid: "*", reason: "normal" },
        action: msg => {
          results.push("done")
        }
      }
    ])
  })
  actor2.link(actor1)
  actor2.trapExit(true)
  actor1.send("unblock")
  assert.ok(actor1.DEAD, "actor1 should die normally")
  assert.ok(results[0] === "done", "actor2 should have received exit message")
})

QUnit.test("simple monitor", assert => {
  // monitors are one way
  const done = assert.async()
  const results = []
  const actor1 = new Actor(pid => {
    pid.receive([
      {
        match: "simulate_error",
        action: () => {
          throw new Error("derp")
        }
      }
    ])
  })
  const actor2 = new Actor(pid => {
    pid.receive([
      {
        match: { name: DOWN, pid: "*", reason: "*" },
        action: () => {
          results.push("todo: we need to send the object and the error")
        }
      }
    ])
  })
  actor1.monitorBy(actor2)
  actor1.send("simulate_error")

  setTimeout(function() {
    assert.ok(results.length === 1, "we should have received the DOWN")
    assert.ok(
      results[0] === "todo: we need to send the object and the error",
      "we should have received the DOWN"
    )
    done()
  }, 10)
})

QUnit.test("simple demonitor", assert => {
  const results = []
  const actor1 = new Actor(pid => {
    pid.receive([
      {
        match: "simulate_error",
        action: () => {
          throw new Error("derp")
        }
      }
    ])
  })
  const actor2 = new Actor(pid => {
    pid.receive([
      {
        match: { name: DOWN, pid: "*", reason: "*" },
        action: () => {
          results.push("todo: we need to send the object and the error")
        }
      }
    ])
  })
  var monitorRef = actor1.monitorBy(actor2)
  actor1.demonitor(monitorRef)
  actor1.send("simulate_error")
  assert.ok(results.length === 0, "we should have received the DOWN")
})

QUnit.test("monitor only sends one message", assert => {
  // monitors are one way
  const done = assert.async()
  const results = []
  const actor1 = new Actor(pid => {
    pid.receive(
      [
        {
          match: TIME_OUT,
          action: () => {
            pid.receive([
              {
                match: "simulate_error",
                action: () => {
                  throw new Error("derp")
                }
              }
            ])
          }
        }
      ],
      null,
      10
    )
  })
  const actorSupervisor = new Actor(pid => {
    pid.receive([
      {
        match: { name: DOWN, pid: "*", reason: "*" },
        action: () => {
          results.push("todo: we need to send the object and the error")
        }
      }
    ])
  })
  actor1.monitorBy(actorSupervisor)
  actor1.send("simulate_error")

  setTimeout(function() {
    assert.ok(results.length === 1, "we should have received the DOWN")
    assert.ok(
      results[0] === "todo: we need to send the object and the error",
      "we should have received the DOWN"
    )
    done()
  }, 10)
})

QUnit.test("basic register name", assert => {
  const results = []
  const actorLoop = pid => {
    pid.receive(
      [
        {
          match: "hello",
          action: () => {
            results.push("ok")
            actorLoop(pid)
          }
        }
      ],
      nullf
    )
  }
  const actor = new Actor(actorLoop)
  register("server", actor)
  sendMsg("server", "hello")
  assert.ok(results.length === 1, "sent msg to name")
  unregister("server")
  assert.ok(registered().length === 0, "you need to clean up")
})

QUnit.test("basic register name error casses", assert => {
  const actor1 = new Actor(pid => {
    pid.receive([{ match: "unblock", action: nullf }], nullf)
  })
  const actor2 = new Actor(pid => {
    pid.receive([{ match: "unblock", action: nullf }], nullf)
  })
  register("server", actor1)
  assert.throws(
    () => {
      register("server", actor2)
    },
    //               /another actor/,
    "cant register two actors to same name"
  )
  assert.throws(
    () => {
      unregister("server2")
    },
    //            /cant unregister/,
    "cant unregister a something not registered"
  )
  assert.throws(
    () => {
      sendMsg("server2", "hello")
    },
    //            /description/,
    "cant message a name not registered"
  )
  assert.ok(registered()[0] === "server", "server should be registered")
  unregister("server")
  assert.ok(registered().length === 0, "you need to clean up")
})

QUnit.test("test name is unregistered when actor dies", assert => {
  const actor = new Actor(pid => {
    pid.receive([
      {
        match: "simulate_error",
        action: () => {
          throw new Error("derp")
        }
      }
    ])
  })
  register("server", actor)
  sendMsg("server", "simulate_error")
  assert.ok(actor.DEAD, "must be dead")
  assert.ok(
    registered().length === 0,
    "actor should be unregistered when it dies"
  )
})
