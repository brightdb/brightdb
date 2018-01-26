import Bright from "./Bright.js"
import ipc from "node-ipc"

ipc.config.id = "bright"
ipc.config.retry = 1500

let sockets = {}

let bright = new Bright()

bright.send = (target, data) => {
  if(!sockets[target]) {
    console.log('socket for ' + target + ' does not exist')
    return
  }
  ipc.server.emit(
      sockets[target],
      'message',
      {
          id      : ipc.config.id,
          message : data
      }
  );
}

ipc.serve(
    function(){
        ipc.server.on(
            'message',
            function(data, socket){
              sockets[data.origin] = socket
              bright.message(data.origin, data.message)
            }
        );
    }
);

ipc.server.start();

