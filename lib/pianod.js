var EventEmitter  = require('events').EventEmitter,
    util          = require('util'),
    ChildProcess  = require('child_process'),
    crypto        = require('crypto'),
    WebSocket     = require('ws'),
    pianodParser  = require('./pianodParser')

exports.Pianod = function() {
  var self = this

  EventEmitter.call(this)

  //this.process

  this.q = {}
  this.status = { track: {}, time: {}, station: '', state: ''}

  this.socket = new WebSocket('http://localhost:4446')
  this.socket.on('message', function(data) { pianodParser.parse(data, self) })
}

util.inherits(exports.Pianod, EventEmitter)

exports.Pianod.prototype.login = function(user, pass, cb) {
  var self = this

  self.socket.send('user admin admin')
  self.socket.send('pandora user '+user+' '+pass)
  crypto.randomBytes(24, function(ex, buf) {
    if (ex) throw ex
    // Commented for testing
    //self.socket.send('set password admin '+crypto.createHash('sha1').update(buf).digest('hex'))
  })

  cb()
}

exports.Pianod.prototype.getStations = function() {
  var self = this

  this.q = {type:"stationList", stations: []}
  self.socket.send('stations list')
}
