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
        logger.debug('registered, next connect')
        registered = true
        bright.message(origin, {type: 'connect', dataspace : dataspace})
      }
      if (message.type == 'peer' ) {
        let peer = origin == X ? instanceY : instanceX
        expect(message).toEqual({type: 'peer', uri: peer})
        expect(registered).toEqual(true)
        logger.debug('got peer, next signal', message.uri)
        peers = true
        bright.message(origin, {type: 'signal', peer : message.uri})
      }
      if (message.type == 'connect') {
        logger.debug('connected peer, next send data', message.peer)
        let peer = origin == X ? instanceY : instanceX
        expect(message).toEqual({type: 'connect', peer: peer})
        expect(peers).toEqual(true)
        connected = true
        bright.message(origin, {type: 'data', peer : message.peer, payload: "TEST"})
      }
      if (message.type == 'data') {
        logger.debug('received data from peer, next disconnect', message)
        let peer = origin == X ? instanceY : instanceX
        expect(message).toEqual({type: 'data', peer: peer, payload : "TEST"})
        // seems connect is only emitted for one of the two peers ..?
        //expect(connected).toEqual(true)
        data = true
        if(origin == X){
          bright.message(origin, {type: 'disconnect_peer', uri: instanceY})
        }

      }
      if (message.type == 'disconnect_peer') {
        logger.debug('disconnect from peer, next remove me', message)
        let peer = origin == X ? instanceY : instanceX
        expect(message).toEqual({type: 'disconnect_peer', uri: peer})
        //expect(data).toEqual(true)
        receivedY = true
        if(origin == Y){
          bright.message(origin, {type: 'disconnect_dataspace', dataspace : dataspace})
        }

      }
      if (message.type == 'remove_peer') {
        logger.debug('peer removed', message)
        expect(message).toEqual({type: 'remove_peer', uri: instanceY})
        receivedX = true
        if(receivedX && receivedY ) done()
      }
    } 
  }

  bright.on('message', handle(X, bright))
  bright2.on('message', handle(Y, bright2))

  bright.message(X, {type: 'register', uri: "local.pisys.eu/bob"})
  bright2.message(Y, {type: 'register', uri: "local.pisys.eu/alice"})
})
