import Logger from 'logplease'
import BrightNodeConnect from './BrightNodeConnect'
import BrightSimplePeer from './BrightSimplePeer'

let logger = Logger.create('Bright');

let events = ['message']
const eventExists = (e) => {
  return events.indexOf(e) !== -1
}

let dataspaces = {}
const savePeer = (peer, dataspace) => {
  if(!dataspaces[peer]) {
    dataspaces[peer] = new Set()
  }
  dataspaces[peer].add(dataspace)
}

const removePeer = (peer) => {
  delete dataspaces[peer]
}

export default function Bright(WebSocket, WRTC) {
  let handlers = {}
  for( let e of events  ) {
    handlers[e] = []
  }
  let registerInquiries = {}
  let instanceUri;

  this.on = (event, handler) => {
    if(!eventExists(event)) {
      logger.error(`event ${event} does not exist`)
      return
    }
    if(!handlers[event]) handlers[event] = []
    handlers[event].push(handler)
  }

  let nodeConnect = new BrightNodeConnect(WebSocket)
  let p2pConnect = new BrightSimplePeer(WRTC)

  nodeConnect.on('message', (dataspace, message) => {
    logger.debug('receive message from node', dataspace, message)
    switch(message.type) {
      case 'register':
        if (!message.uri || !message.result) {
          logger.error("invalid message 'register'", message)
          break
        }
        let origin = registerInquiries[message.uri]
        if(!origin) {
          logger.error("register inquiry was not expected", message)
          break
        }
        instanceUri = message.uri
        send(origin, {type:"registered"})
        break
      case 'peer':
        if (!message.uri) {
          logger.error("invalid message 'peer'", message)
          break
        }
        savePeer(message.uri, dataspace)
        send(null, {type:"peer", uri : message.uri})
        break
      case 'signal':
        if (!message.peer || !message.signal) {
          logger.error("invalid message 'signal'", message)
          break
        }
        p2pConnect.signal(instanceUri, message.peer, message.signal)
        break
      case 'remove_peer':
        if (!message.uri) {
          logger.error("invalid message 'remove_peer'", message)
          break
        }
        removePeer(message.uri)
        send(null, {type:"remove_peer", uri : message.uri})
        break
    }
  })

  p2pConnect.on('message', (peer, message) => {
    logger.debug('receive p2p message', peer, message)
    if(!peer) {
      logger.error('no peer', peer)
      return
    }
    switch(message.type) {
      case 'signal':
        if(!message.signal) {
          logger.error('no signal data', message)
          break
        }
        logger.debug('dataspaces', dataspaces)
        if(!dataspaces[peer]) {
          logger.error(`no dataspaces found for ${peer}`)
          break
        }
        let space = null
        // a hack to pick one item from the set
        dataspaces[peer].forEach((value) => {
          space = value
        })
        if(!space) {
          logger.error(`no dataspaces found for ${peer} found`)
          break
        }
        nodeConnect.signal(space, instanceUri, peer, message.signal )
        break
      case 'connect':
        send(null, {type: "connect", peer: peer})
        break
      case 'data':
        if(!message.payload) {
          logger.error('no p2p payload', message)
          break
        }
        // target should be a concrete receiver app?
        send(null, {type: "data", peer: peer, payload: message.payload})
        break
      case 'disconnect_peer':
        send(null, {type: 'disconnect_peer', uri: peer})
        break
    }

  })

  const send = (target, msg) => {
    setTimeout(() => {
      for(let handler of handlers['message']) {
        handler(target, msg)
      }
    }, 1)
  }

  /**
   * incoming messages from apps
   * origin is the app id
   */
  this.message = (origin, data) => {
    logger.info('message received', origin, data)
    if(!origin) {
      logger.error('no origin given')
      return
    }
    switch(data.type){
      case "ping":
        send(origin, {type : "pong"})
        break
      case "register":
        if(!data.uri) {
          logger.error('message register received without uri')
          break
        }
        registerInquiries[data.uri] = origin
        nodeConnect.register(data.uri)
        break
      case "connect":
        if(!instanceUri) {
          logger.error("instance is not registered")
          break
        }
        if(!data.dataspace) {
          logger.error("received invalid 'connect'", data)
          break
        }
        nodeConnect.connect(instanceUri, data.dataspace)
        break
      case "signal":
        if(!instanceUri) {
          logger.error("instance is not registered")
          break
        }
        if(!data.peer) {
          logger.error("received invalid 'signal'", data)
          break
        }
        p2pConnect.connect(instanceUri, data.peer)
        break
      case "data":
        if(!instanceUri) {
          logger.error("instance is not registered")
          break
        }
        if(!data.peer || !data.payload) {
          logger.error("received invalid 'data'", data)
          break
        }
        p2pConnect.send(data.peer, data.payload)
        break
      case "disconnect_dataspace":
        if(!data.dataspace) {
          logger.error("received invalid 'disconnect_dataspace'", data)
          break
        }
        nodeConnect.disconnect(data.dataspace)
        break
      case "disconnect_peer":
        if(!data.uri) {
          logger.error("received invalid 'disconnect_peer'", data)
          break
        }
        p2pConnect.disconnect(data.uri)
        break
    
    }
  }
}

