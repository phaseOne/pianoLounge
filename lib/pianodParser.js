// Parse pianod responses (yes, it sadly takes this much code)

var codeMap = require('./codeMap')

exports.parse = function(data, self) {
  code = parseInt(data.slice(0,3))

  if ([101,102,106].indexOf(code) !== -1) {
    var time = data
      .slice(4,22)
      .replace('-','')
      .split('/')
      .map(function(t) {
        return t
          .split(':')
          .reduce(function(m, s) {
            return parseInt(m)*60 + parseInt(s)
          })
      })
    self.status.time = {
      elapsed: time[0],
      duration: time[1],
      remaining: time[2],
      timestamp: new Date().getTime() - time[0]*1000,
      string: {
        elapsed: secToString(time[0]),
        duration: secToString(time[1]),
        remaining: secToString(time[2])
      }
    }
  }

  switch (code) {
    case 136:
    case 141:
    case 200:
      break

    case 100:
      self.version = /(?:pianod\s)(\d*)/.exec(data)[1]
      self.emit('connection', self.version)
      break

    case 101:
    case 102:
    case 106:
    case 103:
    case 104:
    case 105:
      var prevState = self.status.state
        , newState  = codeMap[code]
      self.status.state = (prevState === 'paused' && newState === 'ended') ? 'timeout' : newState
      self.emit(self.status.state)
      self.emit('stateChange', self.status.state)
      break

    case 108:
    case 109:
      self.status.station = (code !== 108 ? extractData(data).replace('station ','') : '')
      self.emit('station', self.status.station)
      break

    case 115:
      if (self.q.type === 'stationList') {
        self.q.stations.push(extractData(data))
        break
      }
    case 111:
      if (code === 111) self.q.type = 'track'
    case 112:
    case 113:
    case 114:
    case 116:
    case 117:
    case 118:
    case 119:
    case 120:
      self.q[codeMap[code]] = extractData(data)
      if (code === 120 && self.q.type === 'track') {
        delete self.q.type
        self.status.track = self.q
        self.q = {}
        self.emit('track', self.status.track)
      }
      break

    case 132:
      var msg = data.slice(4);
      /signed in/.test(msg) ? self.emit('login', msg) : self.emit('activity', msg)
      break

    case 203:
      break

    case 135:
      self.q = {type:"stationList", stations: []}
    case 204:
      if (self.q.type === 'stationList') {
        self.stations = self.q.stations
        self.emit('stationList', self.stations)
      }
      self.q = {}
      break

    default:
      self.emit('activity', data)
      break
  }
}

function extractData(data) {
  return /(?::\s)(.*)/.exec(data)[1]
}

function secToString(sec) {
  var min = Math.floor(sec / 60).pad(),
      sec = (sec % 60).pad()
  return min + ':' + sec
}

Number.prototype.pad = function() {
  return (this < 10) ? '0'+this : this.toString()
}
