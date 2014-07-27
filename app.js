var express       = require('express'),
    http          = require('http'),
    path          = require('path'),
    favicon       = require('static-favicon'),
    logger        = require('morgan'),
    cookieParser  = require('cookie-parser'),
    bodyParser    = require('body-parser'),
    EventEmitter  = require('events').EventEmitter,
    util          = require('util')
    Writable      = require('stream').Writable;

var routes  = require('./routes'),
    users   = require('./routes/user');

var Debug = require('debug'),
    pL    = {
      info: Debug('pianoLounge:info'),
      debug: Debug('pianoLounge:debug'),
      pianobar: Debug('pianoLounge:pianobar'),
      http: {
        request: Debug('http:request')
      }
    }

var spawn = require('child_process').spawn;

function strToSec(str) {
  return str.split(':').reduce(function(m, s){return parseInt(m)*60 + parseInt(s)})
}

function Pianobar() {
  var self = this

  EventEmitter.call(this)

  this.process = spawn('pianobar')

  this.process.stdout.on('data', function (data) {
    data = data.toString().replace(/\[2K/g, '').replace(/\u001B/g, '').split('\n')
    data.forEach(function (e, i, a) {
      e = e.trim()

      switch (e.charAt(0)) {
        case '#':
          var time
          self.emit('time', {
            remaining: strToSec(e.substr(5,5)),
            total: strToSec(e.substr(11)),
            elapsed: this.total - this.remaining
          })
          break;
        case '|':
          if (/Station/.test(e)) {
            var station = {
              name: /(?:")([^"]*)(?:")/.exec(e)[1],
              id: /(?:\()([^\)]*)(?:\))/.exec(e)[1]
            }
            self.emit('station', station)
          } else {
            e = e.replace(/\|\>\s*/, '');
            var reg = /(?:")([^"]*)(?:")/g,
                match,
                matches = [];
            while ((match = reg.exec(e)) !== null) {
              matches.push(match[1])
            }
            self.emit('track', {
              Title: matches[0],
              Artist: matches[1],
              Album: matches[2]
            })
          }
          break;
      }
    })
  });
}

util.inherits(Pianobar, EventEmitter)

var pianobar = new Pianobar()

var app = express();

app.set('port', process.env.PORT || 3000);

var server = http.Server(app),
    io = require('socket.io')(server);

server.listen(app.get('port'), function () {
  pL.info('Server listening on port ' + server.address().port);
});


// Redirect morgan to debug
var morganDebug = Writable({ decodeStrings: false })
morganDebug._write = function (data, enc, next) {
  pL.http.request(data.trim())
  next()
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev', { stream: morganDebug }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);

app.get('/', routes.index);
app.get('/users', users.list);

io.on('connection', function (socket) {
  pL.info('User connected');
});


pianobar.on('track', function (track) {
  pL.pianobar('Track: '+JSON.stringify(track));
})

pianobar.on('station', function (track) {
  pL.pianobar('Station: '+JSON.stringify(track));
})

pianobar.on('time', function (track) {
  pL.pianobar('Time: '+JSON.stringify(track));
})

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.render('error', {
        message: err.message,
        error: {}
    });
});
