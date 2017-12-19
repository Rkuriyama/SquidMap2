

var express = require('express');
var http = require('http');
var path = require('path');
var fs = require('fs');

var basicAuth = require('basic-auth-connect');

var methodOverride = require('method-override');
var session = require('express-session');
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');

var rooms = {};
var no_member_room = [];


var app = express();
	app.set('port', process.env.PORT || 3000);
	app.set('views', path.join(__dirname, 'views'));
	app.set('view engine', 'ejs');
	app.use(methodOverride());
	app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(session({
	  secret: process.env.SESSION_SECRET || 'uwotm8',
	  resave: false,
	  saveUninitialized: false
	}));
	app.use(basicAuth('squid','1220'));
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


// var do_login = require('./routes/login');
// var create_room = require('./routes/create_room');
// app.use('/do_login',do_login);
// app.use('/create_room',create_room);


app.use(session({
	secret: process.env.SESSION_SECRET || 'session secret',
	resave: false,
	saveUninitialized: false
}));

var io = require('socket.io').listen(server);



app.post("/create_room", function(req, res){
	// console.log('create......');
	var err_message;

		if(rooms[req.body.room]){
			err_message ="The roomname has been used.";
			req.session.err_message = err_message;
				res.redirect('/');
			// console.log('failed......');
			return false;
		}
	if(req.body.room　&& req.body.pass && req.body.name){
		var room = req.body.room;
		var pass = req.body.pass;
		var name = req.body.name;
		rooms[room] = {
			pass:pass,
			owner:{
				name:name,
				id:''
			},
			member:[],
			id_list:{}
		}

		req.session.room = room;
		req.session.name = name;
		req.session.login = true;
		//入力値の判定が必要

		res.redirect('/squid_map');

	}else{
		//err処理
		err_message = "Fill in the all blanks";
			req.session.err_message = err_message;
				res.redirect('/');
		// console.log('failed......');
	}
});


app.post('/do_join',function(req, res){
	var err_message;
	if(req.body.room　&& req.body.pass && req.body.name){
		var room = req.body.room;
		var pass = req.body.pass;
		var name = req.body.name;
		if (rooms[room]) {
			if(pass === rooms[room].pass){
				if (rooms[room].member.indexOf(name) == -1) {
					req.session.room = room;
					req.session.name = name;
					req.session.login = true;

					res.redirect('/squid_map');
				}else{
					err_message = "The same name as roommate"
					req.session.err_message = err_message;
					res.redirect('/');
				}


			} else {
				//err処理
				err_message = "Unknown roomname or Wrong password";

			req.session.err_message = err_message;
				res.redirect('/');
			}
		}else{
			//err処理
			err_message = "Unknown roomname or Wrong password";
			req.session.err_message = err_message;
				res.redirect('/');
		}
	}else{
		//err処理
		err_message = "Fill in the blanks";
			req.session.err_message = err_message;
				res.redirect('/');

	}
});


app.get('/', function(req, res){
	// console.log(req);
	res.render('index', {
		title: 'SquidMap',
		err_message:req.session.err_message
	});
	req.session.destroy();
	// console.log(req.session);
});

app.get('/squid_map',function(req,res){
	if (req.session.login === true) {
	res.render('squid_map',{
		session:req.session
	});
	}else{
		res.redirect('/');
	}
});

app.get('/howto',function(req,res){
	res.render('howto');
});
app.get('/bugs',function(req,res){
	res.render('bugs');
});
app.get('/update',function(req,res){
	res.render('update');
})

io.sockets.on('connection', function(client){
	var room = '';
	var name = '';


	client.on('c2s_join', function(data,fn){

		console.log('connected');
		if(no_member_room[data.room]) {
		console.log('clear');
			clearTimeout(no_member_room[data.room]);
			delete no_member_room[data.room];
		};
		if(!rooms[data.room]){client.to(client.id).emit('room '+data.room+' is undefined');return;}
		console.log('join');
		name = data.name;
		room = data.room;
		client.join(room);

		rooms[room].member.push(name);
		io.to(room).emit('s2c_emit',{act:'new_member',name:rooms[room].member});

		rooms[room].id_list[name] = client.id;
		if (name == rooms[room].owner.name) {
			rooms[room].owner.id = client.id;
		}else{
			client.to(rooms[room].owner.id).emit('new_member',name);
		}
	});

	client.on('canvas_data',function(value){
		client.to(rooms[room].id_list[value.name]).emit('canvas_data',value.data);
	});

	client.on('c2s_broadcast', function(data){
		client.broadcast.to(room).emit('s2c_broadcast',data);
	});

	client.on('disconnect', function() {
		if(rooms[room]){
			rooms[room].member.splice(rooms[room].member.indexOf(name),1);
			delete rooms[room].id_list[name];

			client.to(room).emit('s2c_emit',{act:'disconnect_member',name:name});

			if(rooms[room].member.length === 0){
				no_member_room[room] = setTimeout(function(){
					delete rooms[room];
					delete no_member_room[room];
					console.log(room+' was deleted.');
				}, 30000);
				console.log(room+' owner disconnect & add '+room+' into remove list.');
			} else {
				if (name == rooms[room].owner.name) {
					var new_owner = rooms[room].member[0]
					rooms[room].owner.name = new_owner;
					rooms[room].owner.id = rooms[room].id_list[new_owner];
				};
				console.log(name + ' disconnect from '+room+'acq');
			}
		}
    });
});
