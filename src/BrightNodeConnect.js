import WS from "./BrowserWebSocket"
import Logger from 'logplease'

const port = 5454

export default function BrightNodeConnect() {
  let logger = Logger.create('BrightNodeConnect')
  let websockets = {}

  let uriToHost = (uri) => {
    let m = uri.match(/^(.+)\//)
    if(m == null) return null
    let newUri = "wss://" + m[1] + ":" + port
    logger.debug(`uriToHost from ${uri} to ${newUri}`)
    return newUri
  }

  let encodePacket = JSON.stringify

  let getWS = (uri) => {
    uri = uriToHost(uri)
    if(uri === null) return null
    if(websockets[uri]) 
      return websockets[uri]
    return new WS(uri)
  }

  this.register = (uri) => {
    let ws = getWS(uri);
    if(ws === null) {
      logger.error(`Cannot create WebSocket for ${uri}`)
      return
    }
    ws.send(encodePacket({type : 'register', uri : uri}))
  }
}

