import Queue from 'queuejs'
import Logger from 'logplease'

let logger = Logger.create('BrowserWebSocket')

export default function WS(uri) {
  let ws = new WebSocket(uri)
  let queue = new Queue()


  let isOpen = () => {
    return ws.readyState == WebSocket.OPEN
  }

  ws.onopen = () => {
    logger.debug('ws onopen')
    while(queue.size() > 0) {
      let packet = queue.deq()
      logger.debug(`dequeue and send ${packet}`)
      ws.send(packet)
    }
  }

  this.send = (packet) => {
    if(!isOpen()) {
      logger.debug(`enqueue ${packet}`)
      queue.enq(packet)
      return
    }
    logger.debug(`send ${packet} right away`)
    ws.send(packet)
  }

}
