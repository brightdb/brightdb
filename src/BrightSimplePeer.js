import Peer from 'simple-peer'
import Logger from 'logplease'

let logger = Logger.create('BrightSimplePeer')

let events = ['message']
const eventExists = (e) => {
  return events.indexOf(e) !== -1
}

export default function BrightSimplePeer(WRTC) {
  let peers = {}
  let handlers = {}
  for( let e of events  ) {
    handlers[e] = []
  }

  this.on = (event, handler) => {
    if(!eventExists(event)) {
      logger.error(`event ${event} does not exist`)
      return
    }
    if(!handlers[event]) handlers[event] = []
    handlers[event].push(handler)
  }

  const send = (peer, msg) => {
    setTimeout(() => {
      for(let handler of handlers['message']) {
        handler(peer, msg)
      }
    }, 1)
  }

  this.connect = (me, you) => {
    logger.debug(`connect ${me} to ${you}`)
    logger.debug('peers', Object.getOwnPropertyNames(peers))
    if( peers[you] ) {
      logger.error(`${me} and ${you} are already connected or connecting`)
      return
    }
    let opts = {
      initiator : me < you,
      wrtc : WRTC
    }
    
    peers[you] = new Peer(opts)
    peers[you].on('signal', (data) => {
      send(you, {type: 'signal', signal: data})    
    })
    peers[you].on('connect', () => {
      send(you, {type: 'connect'})
    })
    peers[you].on('data', (data) => {
      send(you, {type: 'data', data : data})
    })
  }
  this.signal = (me, you, signal) => {
    if(!peers[you]) {
      logger.error(`unexpected signal data from ${you}`)
      return
    }
    peers[you].signal(signal)
  }
}
