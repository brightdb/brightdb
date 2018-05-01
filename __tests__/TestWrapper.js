import Bright from '../src/Bright.js'
import Logger from 'logplease'
import WebSocket from 'ws'
import WRTC from 'wrtc'

let logger = Logger.create('TestWrapper')

let dataspace = 'local.pisys.eu'

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

test('p2p', done => {
  let bright = new Bright(WebSocket, WRTC)
  let bright2 = new Bright(WebSocket, WRTC)
  let X = 'X'
  let Y = 'Y'
  let instanceX = dataspace + '/bob'
  let instanceY = dataspace + '/alice'

  let receivedX = false
  let receivedY = false

  let handle = (origin, bright) => {
    let registered = false
    let peers = false
    let connected = false
    let data = false
    return (target, message) => {
      if (message.type == "registered" ) {
        logger.debug('registered, now connect')
        registered = true
        bright.message(origin, {type: 'connect', dataspace : dataspace})
      }
      if (message.type == 'peer' ) {
        let peer = origin == X ? instanceY : instanceX
        expect(message).toEqual({type: 'peer', uri: peer})
        logger.debug('got peer, now signal', message.uri)
        peers = true
        bright.message(origin, {type: 'signal', peer : message.uri})
      }
      if (message.type == 'connect') {
        let peer = origin == X ? instanceY : instanceX
        expect(message).toEqual({type: 'connect', peer: peer})
        logger.debug('connected peer, now send data', message.peer)
        bright.message(origin, {type: 'data', peer : message.peer, payload: "TEST"})
      }
      if (message.type == 'data') {
        logger.debug('received data from peer', message)
        let peer = origin == X ? instanceY : instanceX
        expect(message).toEqual({type: 'data', peer: peer, payload : "TEST"})
        if(message.peer == instanceX ) receivedX = true
        if(message.peer == instanceY ) receivedY = true
        if(receivedX && receivedY ) done()
      }
    } 
  }

  bright.on('message', handle(X, bright))
  bright2.on('message', handle(Y, bright2))

  bright.message(X, {type: 'register', uri: "local.pisys.eu/bob"})
  bright2.message(Y, {type: 'register', uri: "local.pisys.eu/alice"})
})
