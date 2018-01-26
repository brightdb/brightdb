Consolidated brightDB

JS:
* Communicate with IndexedDB
  - stores.js: Abstract storage engine. Stores subscriptions, uri index, blobs and graph. 
  - (connect.js):
    Abstract connection engine.
    - p2p.js: Manage p2p connections.
    - ws.js: Manage WS connections to servers (as brightDB instances)
      - ws_heartbeats.js
    - local.js: Manage connections to local peers for debug purposes.
  - log.js: Logging
  - bright.js: 
    brightDB instance
    Abstracts browser, native or server.
    Can run as a web worker, process or local server.
    Communicates with app via ports (messages)
    writes to stores
    - elm.js:
      Writes LSEQ
      Implements protocol


## Roadmap

1. Create Wrappers (WebWorkerWrapper, LocalSocketWrapper)
2. Implement node-connect for connection setup
  1. Create Key Pair
  2. Register
  3. Login
3. Implement peer-connect for peer connections
4. Implement Elm/Main
5. Implement stores


## Run

### With WebWorker

    npm run build

See `bright-todo6/src/index.js` for creating the worker.

### With Sockets

    npm run babel
    node src/LocalSocketWrapper.js
 
See `bright-todo6/src/socket-app.js` for creating a standalone app.
