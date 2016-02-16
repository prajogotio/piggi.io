var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var serverState = {
	nextId : 1,
	connected : [],
};

app.use(express.static('client'));

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/client/piggi.html');
});


io.on('connection', function(socket) {
	console.log('a user connected');

	// connected to server.
	// login to 

});

http.listen(3000, function() {
	console.log('HTTPServer is up.');
});
