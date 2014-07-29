var Debug = require('debug')

module.exports = {
  info: Debug('pianoLounge:info'),
  debug: Debug('pianoLounge:debug'),
  pianod: {
    info: Debug('pianod:info'),
    status: Debug('pianod:status')
  },
  http: {
    request: Debug('http:request')
  }
}
