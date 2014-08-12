var express       = require('express'),
    http          = require('http'),
    path          = require('path'),
    favicon       = require('static-favicon'),
    logger        = require('morgan'),
    cookieParser  = require('cookie-parser'),
    bodyParser    = require('body-parser'),
    Writable      = require('stream').Writable

var Pianod        = require('./lib/pianod').Pianod,
    pL            = require('./lib/logger'),
    pandoraAuth   = require('./pandoraAuth')

/// set up app
var app = express()

// create a pianod instance along with other tools
var pianod = new Pianod()

app.set('port', process.env.PORT || 3000)

var server = http.Server(app),
    io = require('socket.io')(server)

// assets setup
var assets = require("connect-assets")({paths: ['assets/bootstrap']})
assets.environment.enable("autoprefixer")

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
app.use(express.static(path.join(__dirname, 'public')))
app.use(assets)
app.use(app.router)

/// routes

app.get('/', function(req, res) {
  res.render('index', { status: pianod.status, stationList: pianod.stations })
})

/// events

pianod.on('connection', function(version) {
  pL.pianod.info('connected to pianod version '+version)

  pianod.login(pandoraAuth.username, pandoraAuth.password, function(msg) {
    pL.pianod.info(msg)

    pianod.getStations(function(stations) {
      // Wait for stations, then start server
      server.listen(app.get('port'), function() {
        pL.info('server listening on port ' + server.address().port)
      })
    })
  })
})

io.on('connection', function(socket) {
  pL.info('user connected')
  socket.emit('status', pianod.status)
  socket.emit('stationList', pianod.stations)

  socket.on('transport', function(data) {
    pL.debug(data)

    switch (data) {
      case 'play':
      case 'pause':
      case 'playpause':
      case 'skip':
        pianod.control(data)
        break;
    }
  })

  socket.on('volume', function(data) {
    pL.debug(data)

    if (data === 'get') {
      pianod.getVolume(function(vol) {
        socket.emit('volume', vol)
      })
    } else if (typeof data === 'number') {
      pianod.setVolume(Math.min(Math.max(data, 0), 100), function(vol) {
        socket.emit('volume', vol)
      })
    }
  })
})

pianod.on('stationList', function () {
  pL.pianod.info('stations updated')
  io.emit('stationList', pianod.stations)
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
