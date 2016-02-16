var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var serverState = {
	nextId : 1,
};

app.use(express.static('client'));

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/client/piggi.html');
});


io.on('connection', function(socket) {
	var currentId = serverState.nextId;
	serverState.nextId++;

	console.log('connected - [id: '+currentId+']');

	

	// connected to server.
	// get a nickname
	socket.on('login-name', function(msg) {

	});

	socket.on('disconnect', function() {

	});

	// create/choose room
	// play
	// game synch

});

http.listen(3000, function() {
	console.log('HTTPServer is up.');
});
