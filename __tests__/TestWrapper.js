import Bright from '../src/Bright.js'
import Logger from 'logplease'
import WebSocket from 'ws'
import WRTC from 'wrtc'

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

test('connect', done => {
  let bright = new Bright(WebSocket)
  let bright2 = new Bright(WebSocket)
  let X = 'X'
  let Y = 'Y'

  let receivedX = false
  let receivedY = false

  let handle = (bright) => {
    return (target, message) => {
      if (message.type == "registered" ) {
        logger.debug('registered, now connect', target)
        bright.message(target, {type: 'connect', dataspace : "local.pisys.eu"})
      }
      if (message.type == 'peer' ) {
        logger.debug('connected', message.uri)
        if(message.uri == 'local.pisys.eu/bob' ) receivedX = true
        if(message.uri == 'local.pisys.eu/alice' ) receivedY = true
        if(receivedX && receivedY ) done()
      }
    } 
  }

  bright.on('message', handle(bright))
  bright2.on('message', handle(bright2))

  bright.message(X, {type: 'register', uri: "local.pisys.eu/bob"})
  bright2.message(Y, {type: 'register', uri: "local.pisys.eu/alice"})
})

test('p2p', done => {
  let bright = new Bright(WebSocket, WRTC)
  let bright2 = new Bright(WebSocket, WRTC)
  let X = 'X'
  let Y = 'Y'

  let receivedX = false
  let receivedY = false

  let handle = (origin, bright) => {
    return (target, message) => {
      if (message.type == "registered" ) {
        logger.debug('registered, now connect')
        bright.message(origin, {type: 'connect', dataspace : "local.pisys.eu"})
      }
      if (message.type == 'peer' ) {
        logger.debug('got peer, now signal', message.uri)
        bright.message(origin, {type: 'signal', peer : message.uri})
      }
      if (message.type == 'connect') {
        logger.debug('connected peer, now send data', message.peer)
        bright.message(origin, {type: 'data', peer : message.peer, payload: "TEST"})
      }
      if (message.type == 'data') {
        logger.debug('received data from peer', message)
        expect(message.payload).toEqual("TEST")
        if(message.peer == 'local.pisys.eu/bob' ) receivedX = true
        if(message.peer == 'local.pisys.eu/alice' ) receivedY = true
        if(receivedX && receivedY ) done()
      }
    } 
  }

  bright.on('message', handle(X, bright))
  bright2.on('message', handle(Y, bright2))

  bright.message(X, {type: 'register', uri: "local.pisys.eu/bob"})
  bright2.message(Y, {type: 'register', uri: "local.pisys.eu/alice"})
})
