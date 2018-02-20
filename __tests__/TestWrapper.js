import Bright from '../src/Bright.js'
import Logger from 'logplease'
import WebSocket from 'ws'

let logger = Logger.create('TestWrapper')

test('ping yields pong', done => {
  let bright = new Bright(WebSocket)
  let origin = 'X'

  bright.on('message', (target, message) => {
    expect(target).toEqual(origin)
    expect(message).toEqual({type: 'pong'})
    done()
  })

  bright.message(origin, {type : 'ping'})
})

test('register', done => {
  let bright = new Bright(WebSocket)
  let origin = 'X'

  bright.on('message', (target, message) => {
    expect(message).toEqual({type: 'registered'})
    done()
  })

  bright.message(origin, {type : 'register', uri : "local.pisys.eu/bob"})

})
