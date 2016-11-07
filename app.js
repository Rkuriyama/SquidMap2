

var express = require('express');
var http = require('http');
// var routes = require('./routes');
// var user = require('./routes/user');
var path = require('path');
var fs = require('fs');



var methodOverride = require('method-override');
var session = require('express-session');
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');


var app = express();
	app.set('port', process.env.PORT || 3000);
	app.set('views', path.join(__dirname, 'views'));
	app.set('view engine', 'ejs');
	app.use(methodOverride());
	app.use(session({
				resave: true,
                saveUninitialized: true,
                secret: 'uwotm8' 
    }));
    app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(express.static(path.join(__dirname, 'public')));

	// app.get('/', routes.index);
	// app.get('/users', user.list);

	if ('development' == app.get('env')) {
	  app.use(errorHandler());
	}

	var server = http.createServer(app).listen(app.get('port'), function(){
		 console.log('Express server listening on port :'+app.get('port'));
	});
module.exports = app;
var io = require('socket.io').listen(server);

app.get('/', function(req, res){
	// console.log(req);
	res.render('index', {
		title: 'SquidMap'
	});
});




io.sockets.on('connection', function(client){

	client.on('connect', function(data,fn){

	});


	client.on('c2s_broadcast', function(data){
		client.broadcast.emit('s2c_broadcast',data);
	});
});
