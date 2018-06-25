import Queue from 'queuejs'
import Logger from 'logplease'

let logger = Logger.create('BrightWebSocket')

export default function WS (WebSocket, uri) {
  let ws = new WebSocket(uri)
  let queue = new Queue()

  let isOpen = () => {
    return ws.readyState == WebSocket.OPEN
  }

  const send = (ws, packet) => {
    try {
      ws.send(packet, err => {
        if (err) {
          logger.error('could send through websocket, not recovering ', e)
        }
      })
    } catch (e) {
      logger.error('could send through websocket, not recovering ', e)
    }
  }

  ws.addEventListener('open', () => {
    logger.debug('ws onopen')
    while (queue.size() > 0) {
      let packet = queue.deq()
      logger.debug(`dequeue and send ${packet}`)
      send(ws, packet)
    }
  })

  this.on = (event, callback) => {
    switch (event) {
      case 'message':
        ws.addEventListener(event, message => {
          callback(message.data)
        })
        break
      default:
        ws.addEventListener(event, callback)
    }
  }

  this.send = (packet) => {
    if (!isOpen()) {
      logger.debug(`enqueue ${packet}`)
      queue.enq(packet)
      return
    }
    logger.debug(`send ${packet} right away`)
    send(ws, packet)
  }

  this.close = () => {
    ws.close()
  }

  setInterval(() => {
    send(ws, JSON.stringify({'type': 'ping'}))
  }, 5000)
}
