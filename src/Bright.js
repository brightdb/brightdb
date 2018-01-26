import Logger from 'logplease'
import NodeConnect from './NodeConnect'

let logger = Logger.create('Bright');

export default function Bright() {
  this.send = () => { logger.error('no send function defined') }
  let nodeConnect = new NodeConnect()
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
        this.send(origin, {type : "pong"})
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

