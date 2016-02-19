var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var serverState = {
	nextId : 1,
	online : [],	// set of online ids
	player : {		// player[id] contains info regarding that id

	},

	nextRoomId : 1,
	roomList : [],
	room : {},
};

app.use(express.static(__dirname + '/client'));

app.set('port', (process.env.PORT || 3000))

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/client/piggi.html');
});


io.on('connection', function(socket) {
	var currentId = serverState.nextId;
	serverState.nextId++;

	//console.log('connected - [id: '+currentId+']');
	
	var currentPlayer = null;

	socket.on('login-name', function(msg) {
		serverState.online.push(currentId);
		serverState.player[currentId] = {
			username : msg,
			room : null,
			state : 'lobby',
			socket : socket,
		}
		socket.emit('id', currentId);
		currentPlayer = serverState.player[currentId];
		broadcastToLobby('online', {id: currentId, username: msg});
			
	});

	socket.on('get-online-player', function(){
		var list = [];
		for (var i = 0; i < serverState.online.length; ++i) {
			list.push({
				id : serverState.online[i],
				username : serverState.player[serverState.online[i]].username,
			});
		}
		socket.emit('online-player', list);
	});

	socket.on('get-room-list', function() {
		var list = [];
		for (var i = 0; i < serverState.roomList.length; ++i) {
			var roomId = serverState.roomList[i];
			var room = serverState.room[roomId];
			list.push({
				id : room.id,
				title : room.title,
				hostId : room.hostId,
				guestId : room.guestId,
				hostname : serverState.player[room.hostId].username,
				full : (room.guestId != -1)
			});
		}
		socket.emit('room-list', list);
	});

	socket.on('create-room', function(msg) {
		var room = {
			id : serverState.nextRoomId,
			title : msg,
			hostId : currentId,
			guestId : -1,
			mapSplit : true,
			chosenMap : 0,
		}
		//console.log("room created: " + room.id);

		serverState.room[room.id] = room;
		serverState.roomList.push(room.id);

		currentPlayer.room = room;
		currentPlayer.state = 'room';

		serverState.nextRoomId++;

		var msg = {
			id : room.id,
			title : room.title,
			hostId : room.hostId,
			guestId : room.guestId,
			hostname : currentPlayer.username,
			chosenMap : 0,
			mapSplit : true,
			full : false,
		};

		socket.emit('room-created', msg);

		broadcastToLobby('new-room', msg)
	});

	socket.on('join-room', function(roomId) {
		var r = serverState.room[roomId];
		if (r) {
			if (r.guestId != -1) {
				socket.emit('room-full', roomId);
			} else {
				r.guestId = currentId;
				currentPlayer.room = r;
				currentPlayer.state = 'room';
				socket.emit('room-joined', r);

				var roomOwner = serverState.player[r.hostId];
				roomOwner.socket.emit('room-visitor', {
					id: currentId,
					username: currentPlayer.username,
				});

				broadcastToLobby('room-full', roomId);
			}
		} else {
			socket.emit('room-unavailable', roomId);
		}
	});

	socket.on('map-change', function(mid) {
		currentPlayer.room.chosenMap = mid;
		sendToOtherPlayerInRoom('map-change', mid);
	});

	socket.on('map-split-change', function(mapSplit) {
		currentPlayer.room.mapSplit = mapSplit;
		sendToOtherPlayerInRoom('map-split-change', mapSplit);
	})

	socket.on('disconnect', function() {
		// clean up code

		// remove from online list
		var tmp = [];
		for (var i = 0; i < serverState.online.length; ++i) {
			if (serverState.online[i] == currentId) continue;
			tmp.push(serverState.online[i]);
		}
		serverState.online = tmp;


		handleRoomExited(currentPlayer);

		// broadcast to all
		io.emit('offline', currentId);

		// remove from player
		delete serverState.player[currentId];
	});

	socket.on('exit-room', function() {
		handleRoomExited(currentPlayer);
	});


	function broadcastToRoom(event, msg) {
		if (currentPlayer.room) {
			var guestId = currentPlayer.room.guestId;
			var hostId = currentPlayer.room.hostId;
			if (guestId != -1) {
				if(serverState.player[guestId]) {
					serverState.player[guestId].socket.emit(event, msg);
				}
			}
			if (serverState.player[hostId]){
				serverState.player[hostId].socket.emit(event, msg);
			}
		}
	}

	function sendToOtherPlayerInRoom(event, msg) {
		if (currentPlayer.room) {
			var guestId = currentPlayer.room.guestId;
			var hostId = currentPlayer.room.hostId;
			if (guestId != currentId) {
				if(serverState.player[guestId]){
					serverState.player[guestId].socket.emit(event, msg);
				}
			} else {
				if (serverState.player[hostId]) {
					serverState.player[hostId].socket.emit(event, msg);
				}
			}
		}
	}

	function handleRoomExited(currentPlayer) {
		if (!currentPlayer) return;


		// let the room know
		if (currentPlayer.room) {

			// he is owner
			if (currentPlayer.room.hostId == currentId) {
				if (currentPlayer.room.guestId != -1) {
					// hand over to guest
					var guestId = currentPlayer.room.guestId;
					var guest = serverState.player[guestId];
					guest.room.hostId = guestId;
					guest.room.guestId = -1;
					guest.socket.emit('room-owner', guest.room.id);
					broadcastToLobby('room-available', guest.room.id);
				} else {
					// delete the room
					var tmp = [];
					for (var i = 0; i < serverState.roomList.length; ++i) {
						if (serverState.roomList[i] == currentPlayer.room.id) {
							continue;
						}
						tmp.push(serverState.roomList[i]);
					}
					serverState.roomList = tmp;
					broadcastToLobby('room-deleted', currentPlayer.room.id);
					delete serverState.room[currentPlayer.room.id];
				}
			} else {
				// he is a guest
				currentPlayer.room.guestId = -1;
				broadcastToRoom('room-exited', currentId);
			}
		}
	}

	// play
	socket.on('request-start-game', function() {
		if (!currentPlayer.room) return;
		if (currentPlayer.room.guestId != -1) {
			// send map, team a team b info
			var t = Math.random() < 0.5 ? 0 : 1;
			broadcastToRoom('start-game', {
				'host' : t,
				'guest' : (t+1)%2,
			});
		}
	});


	// game synch
	socket.on('commands', function(msg) {
	//setTimeout(function() {
			sendToOtherPlayerInRoom('commands', msg);
	//}, Math.random()*500+400);
	});
});

function broadcastToLobby(event, msg) {
	for (var i = 0; i < serverState.online.length; ++i) {
		var player = serverState.player[serverState.online[i]];
		if (player.state == 'lobby') {
			player.socket.emit(event, msg);
		}
	}
}


http.listen(app.get('port'), function() {
	//console.log('HTTPServer is up.');
});
