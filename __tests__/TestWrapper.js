import Bright from '../src/Bright.js'

test('ping yields pong', () => {
  let bright = new Bright()
  let origin = 'X'

  bright.on('message', (target, message) => {
    expect(target).toEqual(origin)
    expect(message).toEqual({type: 'pong'})
  })

  bright.message(origin, {type : 'ping'})
})
