var EventEmitter  = require('events').EventEmitter,
    util          = require('util'),
    ChildProcess  = require('child_process'),
    WebSocket     = require('ws'),
    pianodParser  = require('./pianodParser')

exports.Pianod = function() {
  var self = this

  EventEmitter.call(this)

  //this.process

  this.q = {}
  this.status = { track: {}, time: {}, station: '', state: ''}

  this.socket = new WebSocket('http://localhost:4446')
  this.socket.on('message', function (data) { pianodParser.parse(data, self) })
}

util.inherits(exports.Pianod, EventEmitter)
