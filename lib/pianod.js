var EventEmitter  = require('events').EventEmitter,
    util          = require('util'),
    ChildProcess  = require('child_process'),
    crypto        = require('crypto'),
    WebSocket     = require('ws'),
    osa           = require('node-osascript'),
    pianodParser  = require('./pianodParser')

exports.Pianod = function() {
  var self = this

  EventEmitter.call(this)

  //this.process

  this.q = {}
  this.status = { track: {}, time: { string: {} }, station: '', state: ''}

  this.socket = new WebSocket('http://localhost:4446')
  this.socket.on('message', function(data) { pianodParser.parse(data, self) })

  this.on('stateChange', function(state) {
    if (state === 'timeout') { clearTrack(self) }
  })
}

util.inherits(exports.Pianod, EventEmitter)

function clearTrack(self) {
  self.status.track = {}
  self.status.time  = { string: {} }
}

exports.Pianod.prototype.login = function(user, pass, cb) {
  var self = this

  self.socket.send('user admin admin')
  self.socket.send('pandora user '+user+' '+pass)

  crypto.randomBytes(24, function(ex, buf) {
    if (ex) throw ex
    // Commented for testing
    //self.socket.send('set password admin '+crypto.createHash('sha1').update(buf).digest('hex'))
  })

  self.once('login', function (msg) {
    cb(msg)
  })
}

exports.Pianod.prototype.getStatus = function() {
  var self = this

  self.socket.send('status')
}

exports.Pianod.prototype.getStations = function(cb) {
  var self = this

  this.q = {type:"stationList", stations: []}
  self.socket.send('stations list')

  self.once('stationList', function (stations) {
    cb(stations)
  })
}

exports.Pianod.prototype.control = function(command) {
  var self = this

  self.socket.send(command)
}


// Volume Mac only right now, working on PulseAudio support and detection for OS
exports.Pianod.prototype.getVolume = function(cb) {
  var self = this

  osa.execute('output volume of (get volume settings)', function (err, vol) {
    cb(vol)
  })
}

exports.Pianod.prototype.setVolume = function(vol, cb) {
  var self = this

  osa.execute('set volume output volume '+vol+'\noutput volume of (get volume settings)', function (err, newVol) {
    cb(newVol)
  })
}
