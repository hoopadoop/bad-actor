/* @flow */
import matches from './pattern_match'

type MsgT = any

export default class Mailbox {
  mbox: Array<MsgT>
  savedMsgs: Array<MsgT>

  constructor() {
    this.mbox = []
    this.savedMsgs = []
  }

  push(msg: MsgT): void {
    this.mbox.push(msg)
  }

  match(set: Array<MsgT>): ?[MsgT, number] {
    if (!set.length) throw new Error('cannot match nothing')
    if (!this.mbox.length) return null
    const topMsg = this.mbox.shift()
    const matchedIndex = set.findIndex(msgFromSet => matches(msgFromSet, topMsg))
    if (matchedIndex !== -1) {
      this.restoreSavedMsgs()
      return [topMsg, matchedIndex]
    } else {
      this.savedMsgs.push(topMsg)
      return this.match(set)
    }
  }

  _msgs(): Array<MsgT> {
    return this.mbox
  }

  _savedMsgs(): Array<MsgT> {
    return this.savedMsgs
  }

  restoreSavedMsgs(): void {
    this.mbox = [...this.savedMsgs, ...this.mbox]
    this.savedMsgs = []
  }

  debugMsgs(): string {
    var all = [...this.savedMsgs, ...this.mbox]
    return all.length ? JSON.stringify(all) : ''
  }
}
