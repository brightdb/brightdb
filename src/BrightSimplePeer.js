import Peer from 'simple-peer'
import Logger from 'logplease'

let logger = Logger.create('BrightSimplePeer')

let events = ['message']
const eventExists = (e) => {
  return events.indexOf(e) !== -1
}

const iceServers = [
  {
    url: 'stun:stun.l.google.com:19302'
  },
  {
    url: 'turn:192.158.29.39:3478?transport=udp',
    credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
    username: '28224511:1379330808'
  },
  {
    url: 'turn:192.158.29.39:3478?transport=tcp',
    credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
    username: '28224511:1379330808'
  }
]

export default function BrightSimplePeer (WRTC) {
  let peers = {}
  let handlers = {}
  for (let e of events) {
    handlers[e] = []
  }

  this.on = (event, handler) => {
    if (!eventExists(event)) {
      logger.error(`event ${event} does not exist`)
      return
    }
    if (!handlers[event]) handlers[event] = []
    handlers[event].push(handler)
  }

  const send = (peer, msg) => {
    setTimeout(() => {
      for (let handler of handlers['message']) {
        handler(peer, msg)
      }
    }, 1)
  }

  const createPeer = (you, initiator) => {
    logger.debug('creating peer, initiator = ', initiator)
    let p = new Peer({initiator: initiator, wrtc: WRTC})
    p.on('signal', (data) => {
      send(you, {type: 'signal', signal: data})
    })
    p.on('connect', () => {
      send(you, {type: 'connect'})
    })
    p.on('data', (data) => {
      send(you, {type: 'data', payload: data.toString()})
    })
    p.on('close', () => {
      logger.debug('closing peer', you)
      delete peers[you]
      send(you, {type: 'disconnect_peer'})
    })
    p.on('error', (error) => {
      logger.error('p2p error', error)
      send(you, {type: 'error', error: error})
    })
    return p
  }

  this.connect = (me, you) => {
    logger.debug(`connect ${me} to ${you}`)
    logger.debug('peers', Object.getOwnPropertyNames(peers))
    if (peers[you]) {
      logger.error(`${me} and ${you} are already connected or connecting`)
      return
    }

    let init = me < you
    peers[you] = createPeer(you, init)
    if (!init) {
      send(you, {type: 'wanna_connect'})
    }
  }
  this.signal = (me, you, signal) => {
    if (!peers[you]) {
      peers[you] = createPeer(you, false)
    }
    peers[you].signal(signal)
  }
  this.send = (to, payload) => {
    if (!peers[to]) {
      logger.error(`peer ${to} not connected`)
      return
    }
    peers[to].send(payload)
  }

  this.disconnect = peer => {
    if (!peers[peer]) {
      logger.error(`peer ${peer} not connected`)
      return
    }
    peers[peer].destroy()
    delete peers[peer]
  }
}
