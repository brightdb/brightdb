import Logger from 'logplease'
import BrightNodeConnect from './BrightNodeConnect'

let logger = Logger.create('Bright');

let events = ['message']
const eventExists = (e) => {
  return events.indexOf(e) !== -1
}

export default function Bright(WebSocket) {
  let handlers = {
    'message' : []
  }
  this.on = (event, handler) => {
    if(!eventExists(event)) {
      logger.error(`event ${event} does not exist`)
      return
    }
    handlers[event].push(handler)
  }

  let nodeConnect = new BrightNodeConnect(WebSocket)

  const send = (origin, msg) => {
    for(let handler of handlers['message']) {
      handler(origin, msg)
    }
  }

  /**
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
        nodeConnect.register(data.uri)
        break
    }
  }
}

