import Bright from "./Bright.js"

var bright = new Bright();

self.addEventListener('message', ({data}) => bright.message(data.origin, data.message))

// need to wrap postMessage so it is bound to window
bright.on('message', (target, message) => postMessage({target: target, message : message}))
