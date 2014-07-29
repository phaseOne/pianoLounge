var express       = require('express'),
    http          = require('http'),
    path          = require('path'),
    favicon       = require('static-favicon'),
    logger        = require('morgan'),
    cookieParser  = require('cookie-parser'),
    bodyParser    = require('body-parser'),
    Writable      = require('stream').Writable

var routes  = require('./routes'),
    users   = require('./routes/user')

var Pianod        = require('./lib/pianod').Pianod,
    pL            = require('./lib/logger')

/// set up app
var app = express()

// create a pianod instance along with other tools
var pianod = new Pianod()

app.set('port', process.env.PORT || 3000)

var server = http.Server(app),
    io = require('socket.io')(server)

server.listen(app.get('port'), function () {
  pL.info('Server listening on port ' + server.address().port)
})

// redirect morgan to debug
var morganDebug = Writable({ decodeStrings: false })
morganDebug._write = function (data, enc, next) {
  pL.http.request(data.trim())
  next()
}

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

app.use(favicon())
app.use(logger('dev', { stream: morganDebug }))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded())
app.use(cookieParser())
app.use(require('stylus').middleware(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'public')))
app.use(app.router)

/// routes

app.get('/', routes.index)
app.get('/users', users.list)

/// events

io.on('connection', function (socket) {
  pL.info('User connected')
  io.emit('status', pianod.status)
})

pianod.on('connection', function (version) {
  pL.pianod.info('Connected to pianod version '+version)
})

pianod.on('activity', function (info) {
  pL.pianod.info(info)
  io.emit('activity', info)
})

pianod.on('stateChange', function (state) {
  pL.pianod.status(state + ': ' + JSON.stringify(pianod.status.time))
  io.emit('status', pianod.status)
})

pianod.on('track', function (track) {
  pL.pianod.status('Track: '+track.title+' by '+track.artist+' on '+track.album)
  io.emit('status', pianod.status)
})

pianod.on('station', function (station) {
  pL.pianod.status('Station: '+station)
  io.emit('status', pianod.status)
})

// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found')
    err.status = 404
    next(err)
})

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.render('error', {
            message: err.message,
            error: err
        })
    })
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.render('error', {
        message: err.message,
        error: {}
    })
})
