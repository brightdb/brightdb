import Logger from 'logplease'
import BrightNodeConnect from './BrightNodeConnect'

let logger = Logger.create('Bright');

let events = ['message']
const eventExists = (e) => {
  return events.indexOf(e) !== -1
}

export default function Bright(WebSocket) {
  let handlers = {}
  let registerInquiries = {}

  this.on = (event, handler) => {
    if(!eventExists(event)) {
      logger.error(`event ${event} does not exist`)
      return
    }
    if(!handlers[event]) handlers[event] = []
    handlers[event].push(handler)
  }

  let nodeConnect = new BrightNodeConnect(WebSocket)

  nodeConnect.on('message', (dataspace, message) => {
    logger.debug('receive message', dataspace, message)
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
        send(origin, {type:"registered"})
        break
    }
  })

  const send = (target, msg) => {
    for(let handler of handlers['message']) {
      handler(target, msg)
    }
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
          return
        }
        registerInquiries[data.uri] = origin
        nodeConnect.register(data.uri)
        break

    }
  }
}

