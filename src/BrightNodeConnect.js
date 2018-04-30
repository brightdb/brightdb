import WS from "./BrightWebSocket"
import Logger from 'logplease'

const port = 5454

let events = ['message']
const eventExists = (e) => {
  return events.indexOf(e) !== -1
}

export default function BrightNodeConnect(WebSocket) {
  let logger = Logger.create('BrightNodeConnect')
  let websockets = {}
  let handlers = {}

  let uriToHost = (uri) => {
    let host = uri
    let m = uri.indexOf("/")
    if(m == 0) return null
    if(m != -1) {
      host = uri.substr(0,m)
    }
    let newUri = "wss://" + host + ":" + port
    logger.debug(`uriToHost from ${uri} to ${newUri}`)
    return newUri
  }

  let hostToDataspace = (host) => {
    let m = host.match(/\/\/(.+):/)
    if(m == null) return null
    return m[1]
  }

  let getWS = (uri) => {
    uri = uriToHost(uri)
    if(uri === null) return null
    if(websockets[uri]) 
      return websockets[uri]
    let ws = new WS(WebSocket, uri)

    ws.on('message', message => {
      logger.debug('receive message', message)
      let msg;
      try {
        msg = JSON.parse(message)
      } catch (e) {
        logger.error("message is no JSON ", message)
        return
      }

      for(let handler of handlers['message']) {
        handler(hostToDataspace(uri), msg)
      }
    })
    return ws
  }

  this.register = (uri) => {
    let ws = getWS(uri)
    if(ws === null) {
      logger.error(`Cannot create WebSocket for ${uri}`)
      return
    }
    ws.send(JSON.stringify({type : 'register', uri : uri}))
  }

  this.connect = (instanceUri, dataspace) => {
    let ws = getWS(dataspace) 
    if(ws === null) {
      logger.error(`Cannot create WebSocket for ${dataspace}`)
      return
    }
    ws.send(JSON.stringify({type : 'connect', uri : instanceUri}))
  }

  this.on = (event, handler) => {
    if(!eventExists(event)) {
      logger.error(`event ${event} does not exist`)
      return
    }
    if(!handlers[event]) handlers[event] = []
    handlers[event].push(handler)
  }
}

