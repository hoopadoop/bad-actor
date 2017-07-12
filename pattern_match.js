/* @flow */

type MsgT = any

// nicked from underscore and crippled by me, dont copy this as a general purpose deep equals
export default function matches(pattern: MsgT, msg: MsgT, aStack?: Array<any>, bStack?: Array<any>): boolean {
  if (pattern === '*') return true
  if (pattern === msg) return pattern !== 0 || 1 / pattern === 1 / msg
  if (pattern == null || msg == null) return pattern === msg
  const className = Object.prototype.toString.call(pattern)
  if (className !== Object.prototype.toString.call(msg)) return false
  switch (className) {
    case '[object RegExp]':
    case '[object String]':
      return '' + pattern === '' + msg
    case '[object Number]':
      if (+pattern !== +pattern) return +msg !== +msg
      return +pattern === 0 ? 1 / +pattern === 1 / msg : +pattern === +msg
    case '[object Date]':
    case '[object Boolean]':
      return +pattern === +msg
  }
  var areArrays = className === '[object Array]'
  if (!areArrays) {
    if (typeof pattern !== 'object' || typeof msg !== 'object') return false
    const aCtor = pattern.constructor
    const bCtor = msg.constructor
    if (aCtor !== bCtor && !(aCtor.apply && aCtor.call && aCtor instanceof aCtor && bCtor.apply && bCtor.call && bCtor instanceof bCtor) && ('constructor' in pattern && 'constructor' in msg)) {
      return false
    }
  }
  aStack = aStack || []
  bStack = bStack || []
  var length = aStack.length
  while (length--) {
    if (aStack[length] === pattern) return bStack[length] === msg
  }
  aStack.push(pattern)
  bStack.push(msg)
  if (areArrays) {
    length = pattern.length
    if (length !== msg.length) return false
    while (length--) {
      if (!matches(pattern[length], msg[length], aStack, bStack)) return false
    }
  } else {
    var keys = Object.keys(pattern)
    var key
    length = keys.length
    if (Object.keys(msg).length !== length) return false
    while (length--) {
      key = keys[length]
      if (!(hasOwnProperty.call(msg, key) && matches(pattern[key], msg[key], aStack, bStack))) return false
    }
  }
  aStack.pop()
  bStack.pop()
  return true
}
