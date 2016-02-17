document.addEventListener("DOMContentLoaded", function() {
	initializeApp();
});

var socket = io();

var asset = {
	assetImageList : [
		"asset/pig_running.png", 
		"asset/pig_standby.png", 
		"asset/pig_angry.png", 
		"asset/pig_eating.png",
		"asset/pig_death.png",
		"asset/boar_running.png", 
		"asset/boar_standby.png", 
		"asset/boar_attacking.png", 
		"asset/boar_eating.png",
		"asset/boar_death.png",
		"asset/tower.png", 
		"asset/tower_death.png",
		"asset/castle.png",
		"asset/castle_death.png",
		"asset/rice_field.png", 
		"asset/rice_field_death.png",
		"asset/super_rice_field.png",
		"asset/pig_ranch.png",
		"asset/pig_ranch_death.png",
		"asset/pig_hq.png",
		"asset/pig_hq_death.png",
		"asset/block.png", 
		"asset/fence.png",
		"asset/super_fence.png",
		"asset/fence_death.png",
		"asset/arrow.png",
		"asset/arrow_death.png",
		"asset/javelin.png",
		"asset/javelin_death.png",
		"asset/throne.png",
		"asset/mouse.png",
		"asset/mouse_shadow.png",
		"asset/tower_icon.png",
		"asset/ranch_icon.png",
		"asset/farm_icon.png",
		"asset/fence_icon.png",
		"asset/upgrade_icon.png",
		"asset/castle_icon.png",
		"asset/pighq_icon.png",
		"asset/wall_icon.png",
		"asset/farm_icon.png",
		"asset/garden_icon.png",
		"asset/deselect_icon.png",
		"asset/pig_coin.png",
		"asset/numbers.png",
		"asset/locked_icon.png",
		"asset/grass01.jpg", 
	],
	images : {},
	assetSoundList : [
	],
	sounds : {},
	loadedAssetCount : 0,
};

var COMMAND = {
	'BUILD_TOWER' : 0,
	'BUILD_FARM' : 1,
	'BUILD_PIG_RANCH' : 2,
	'BUILD_FENCE' : 3,
	'UPGRADE_TOWER' : 4,
	'UPGRADE_PIG_RANCH' : 5,
	'BUY' : 6,
	'DESELECT': 7,
	'BUILD_CASTLE' : 8,
	'BUILD_GARDEN' : 9,
	'BUILD_PIG_HQ' : 10,
	'BUILD_WALL' : 11,
	'SYNCHRONIZED' : 12,
}

var PRICES = {
	'BUILD_TOWER' : 50,
	'BUILD_FARM' : 5,
	'BUILD_PIG_RANCH' : 30,
	'BUILD_FENCE' : 1,
	'UPGRADE_TOWER' : 600,
	'UPGRADE_PIG_RANCH' : 800,
	'BUILD_CASTLE' : 240,
	'BUILD_GARDEN' : 35,
	'BUILD_PIG_HQ' : 220,
	'BUILD_WALL' : 40,
}

var CONSTANTS = {
	BACKGROUND_MONEY_RATE : 300, // timesteps per 1 coin
	MAX_COINS : 9999,
}

var gameState = {

};

var clientState = {
	camera : [0, 0],
	mouse : [0, 0],
	mouseImg : null,
	team : 0,
	menuBar : null,
	gameEventHandlerResetFunction : null,
	state : 'NONE',	// game state
	appState : 'LOADING_FRAME', // app state
	online : [],
	player : {},
	room : {},
	roomList : [],
	playingWithId : null,
	currentRoom : null,
	isHost : false,
	isGameOngoing : false,
}

var appFrames = {};

function initializeApp() {
	clientState.canvas = document.getElementById("canvas");
	clientState.g = clientState.canvas.getContext("2d");

	appFrames['LOADING_FRAME'] = document.getElementById('loading-frame');
	appFrames['LOGIN_FRAME'] = document.getElementById('login-frame');
	appFrames['LOBBY_FRAME'] = document.getElementById('lobby-frame');
	appFrames['ROOM_FRAME'] = document.getElementById('room-frame');
	appFrames['GAME_FRAME'] = document.getElementById('game-frame');


	initializeAsset();
}

function initializeAsset() {
	var grayMargin = 3;
	for (var i = 0; i < asset.assetImageList.length; ++i) {
		var img = new Image();
		asset.images[asset.assetImageList[i]] = img;
		img.onload = (function(name) {
			return function() {
				asset.loadedAssetCount++;
				// create an overlay for team B
				var b = document.createElement('canvas');
				b.width=asset.images[name].width;
				b.height=asset.images[name].height;
				var bg = b.getContext('2d');
				bg.save();
				bg.drawImage(asset.images[name], 0, 0, asset.images[name].width, asset.images[name].height, 0, 0, asset.images[name].width, asset.images[name].height);
				// bg.globalCompositeOperation = "source-atop";
				// bg.fillStyle = "rgba(0,10,0,0.15)";
				// bg.fillRect(0,0,b.width,b.height);
				var imgData = bg.getImageData(0, 0, b.width, b.height);
				for (var i=0;i<imgData.data.length;i+=4){
					if (imgData.data[i]-imgData.data[i+1] <= grayMargin &&
						imgData.data[i+1]-imgData.data[i+2] <= grayMargin &&
						(imgData.data[i]<100 || imgData.data[i+3] < 255)) continue;
					imgData.data[i] = Math.min(255, imgData.data[i]*1.1);
					imgData.data[i+1] = Math.min(255, imgData.data[i+1]*1.3);
					imgData.data[i+2] = Math.min(255, imgData.data[i+2]*0.8);
				}
				bg.putImageData(imgData,0,0);
				bg.restore();
				asset.images[name+'/b'] = b;
				assetProgressHandler();
			}
		})(asset.assetImageList[i]);
		img.src = asset.assetImageList[i];
	}
}

function assetProgressHandler() {
	var lp = document.getElementById('loading-caption');
	lp.innerHTML = Math.floor(asset.loadedAssetCount / (asset.assetImageList.length + asset.assetSoundList.length) * 100) + '%';
	if (asset.loadedAssetCount == asset.assetImageList.length + asset.assetSoundList.length) {
		allAssetsLoadedHandler();
	}
}

function allAssetsLoadedHandler() {
	clientState.mouseImg = asset.images["asset/mouse.png"];
	clientState.mouseShadowImg = asset.images["asset/mouse_shadow.png"];
	clientState.mouse[0] = clientState.canvas.width/2;
	clientState.mouse[1] = clientState.canvas.height/2;

	registerAppEventHandler();

	//startGame();
	appMoveToState('LOGIN_FRAME');
}

function startGame() {
	appFrames['GAME_FRAME'].style.setProperty('display', 'block');
	// example game
	gameState = createNewGame(20, 32, "asset/grass01.jpg");
	gameState.thrones.push(new Throne(0, 0, 0), new Throne(30, 18, 1));

	clientState.menuBar = new MenuBar();

	//clientState.camera[0] = gameState.thrones[clientState.team].pos.x-clientState.canvas.width/2;
	//clientState.camera[1] = gameState.thrones[clientState.team].pos.y-clientState.canvas.height/2;

	clientState.gameEventHandlerResetFunction = registerGameEventHandler();
	
	createSnapshot();
	gameState.scheduler = setInterval(function() {
		// game routine
		testModule();
		handleCommands();
		updateGame();
		updateCamera();
		renderGame();

		renderMenuBar();
		drawMouse();

		sendCommandLog();
	}, 1000/60);
}

function createNewGame(mapWidth, mapHeight, mapURI) {
	var state = {
		map : {
			width : mapWidth,
			height : mapHeight,
			data : new Int32Array(mapWidth*mapHeight).fill(1),
			entry : new Array(mapWidth*mapHeight).fill(null),
			imgBuffer : asset.images[mapURI],
			size : 64,
			lastUpdated : 0,
		},
		

		deadflocks : [],
		deadarrows : [],
		deadbuildings : [],

		flocks : [],
		buildings : [],
		arrows : [],

		timestep : 0,

		// team information
		thrones : [],
		ranchTier : [1, 1],
		towerTier : [1, 1],
		coins : [1000, 1000],

		lastSynchronized : 0,
		lastSent : 0,
		localCommandLog : [],
		commandBackLog : [[], []],
	}
	return state;
}

function updateCamera() {
	var mouse = clientState.mouse;
	var camera = clientState.camera;

	var dM = 10;
	var margin = 4;
	if (mouse[0] <= margin) {
		camera[0] -= dM;
	}
	if (mouse[0] >= canvas.width-margin-32) {
		camera[0] += dM;
	}
	if (mouse[1] <= margin) {
		camera[1] -= dM;
	}
	if (mouse[1] >= canvas.height-margin-32) {
		camera[1] += dM;
	}
	var overflowMargin = 180;
	if (camera[0] < 0) camera[0] = 0;
	if (camera[1] < 0) camera[1] = 0;
	camera[0] = Math.min(camera[0], gameState.map.size*gameState.map.width-clientState.canvas.width);
	camera[1] = Math.min(camera[1], gameState.map.size*gameState.map.height+overflowMargin-clientState.canvas.height);
}

function renderGame() {
	var g = clientState.g;
	var camera = clientState.camera;
	var canvas = clientState.canvas;
	var map = gameState.map;

	g.clearRect(0, 0, canvas.width, canvas.height);
	g.fillStyle = 'rgba(0,0,0,0.8)';
	g.fillRect(0, 0, canvas.width, canvas.height);
	// render map
	g.drawImage(map.imgBuffer,
		Math.max(0,camera[0]),
		Math.max(0,camera[1]),
		Math.min(canvas.width, camera[0]+canvas.width), 
		Math.min(canvas.height, camera[1]+canvas.height),
		Math.max(0,-camera[0]),
		Math.max(0,-camera[1]),
		Math.min(canvas.width, camera[0]+canvas.width), 
		Math.min(canvas.height, camera[1]+canvas.height));
	g.save();
	g.translate(-camera[0], -camera[1]);
	

	// render the rest
	var all = [gameState.thrones, gameState.deadbuildings, gameState.buildings, gameState.deadflocks, gameState.deadarrows, gameState.flocks, gameState.arrows];

	for(var i = 0; i < all.length; ++i) {
		for(var j = 0; j < all[i].length; ++j){
			all[i][j].render(g);
		}
	}

	// for (var i = 0; i < gameState.flocks.length; ++i) {
	// 	if(gameState.flocks[i].lockOnTarget) {
	// 		g.fillStyle = "red";
	// 		g.fillRect(gameState.flocks[i].lockOnTarget.pos.x,gameState.flocks[i].lockOnTarget.pos.y, 10, 10);
	// 		for (var j=0;j<gameState.flocks[i].targetStack.length;++j){
	// 			g.fillStyle = "orange";
	// 			g.fillRect(gameState.flocks[i].targetStack[j].x, gameState.flocks[i].targetStack[j].y, 8, 8);
	// 		}
	// 	}
	// }

	g.restore();


	stateDependentRendering(g);

}

function drawMouse() {
	var g = clientState.g;
	g.save();
	g.translate(clientState.mouse[0], clientState.mouse[1]);
	g.save();
	g.globalAlpha = 0.2;
	g.drawImage(clientState.mouseShadowImg, 0, 0, 128, 128, 3, 10, 30, 30);
	g.restore();
	g.drawImage(clientState.mouseImg, 0, 0, 128, 128, 0, 0, 32, 32);
	g.restore();
}

function stateDependentRendering(g) {
	if (clientState.state == 'BUILDING') {
		var pos = computeMapLocation(clientState.mouse[0]+clientState.camera[0],clientState.mouse[1]+clientState.camera[1]);
		g.save();
		g.fillStyle = (isLandOccupied(pos[0],pos[1],clientState.buildingSize) ? "red":"green");
		g.globalAlpha = 0.5;
		g.fillRect(pos[1]*gameState.map.size-clientState.camera[0],pos[0]*gameState.map.size-clientState.camera[1],clientState.buildingSize*gameState.map.size,clientState.buildingSize*gameState.map.size);
		g.restore();
	}
}

function updateGame() {
	if (gameState.timestep % CONSTANTS.BACKGROUND_MONEY_RATE == 0) {
		for (var i = 0; i < gameState.coins.length; ++i) {
			gameState.coins[i] += 1;
		}
	}

	var all = [gameState.deadbuildings, gameState.deadflocks, gameState.deadarrows, gameState.flocks, gameState.buildings, gameState.arrows, gameState.thrones];

	for(var i = 0; i < all.length; ++i) {
		for(var j = 0; j < all[i].length; ++j){
			all[i][j].update(gameState.flocks, gameState.map);
		}
	}

	garbageCollection();
	for (var i = 0; i < gameState.coins.length; ++i) {
		gameState.coins[i] = Math.min(gameState.coins[i], CONSTANTS.MAX_COINS);
	}

	if (gameState.timestep == gameState.lastSynchronized) {
		createSnapshot();
	}

	gameState.timestep++;
}


function garbageCollection() {
	// remove garbage collectible death
	var tmp = [];
	for(var i = 0; i < gameState.deadflocks.length; ++i) {
		if (!gameState.deadflocks[i].garbageCollectible()) {
			tmp.push(gameState.deadflocks[i]);
		} else {
			gameState.deadflocks[i].cleanUp(gameState.flocks, gameState.map);
		}
	}
	gameState.deadflocks = tmp;

	tmp = [];
	for(var i = 0; i < gameState.deadarrows.length; ++i) {
		if (!gameState.deadarrows[i].garbageCollectible()) {
			tmp.push(gameState.deadarrows[i]);
		} else {
			gameState.deadarrows[i].cleanUp(gameState.flocks, gameState.map);
		}
	}
	gameState.deadarrows = tmp;

	tmp = [];
	for(var i = 0; i < gameState.deadbuildings.length; ++i) {
		if (!gameState.deadbuildings[i].garbageCollectible()) {
			tmp.push(gameState.deadbuildings[i]);
		} else {
			gameState.deadbuildings[i].cleanUp(gameState.flocks, gameState.map);
		}
	}
	gameState.deadbuildings = tmp;




	// collect death
	tmp = [];
	for(var i = 0; i < gameState.flocks.length; ++i) {
		if (gameState.flocks[i].isAlive) {
			tmp.push(gameState.flocks[i]);
		} else {
			gameState.deadflocks.push(gameState.flocks[i]);
		}
	}
	gameState.flocks = tmp;

	tmp = [];
	for(var i = 0; i < gameState.arrows.length; ++i) {
		if (gameState.arrows[i].isAlive) {
			tmp.push(gameState.arrows[i]);
		} else {
			gameState.deadarrows.push(gameState.arrows[i]);
		}
	}
	gameState.arrows = tmp;

	tmp = [];
	for(var i = 0; i < gameState.buildings.length; ++i) {
		if (gameState.buildings[i].isAlive) {
			tmp.push(gameState.buildings[i]);
		} else {
			gameState.deadbuildings.push(gameState.buildings[i]);
		}
	}
	gameState.buildings = tmp;
}


function registerAppEventHandler() {
	var camera = clientState.camera;
	var canvas = clientState.canvas;
	var map = gameState.map;

	canvas.addEventListener("mousedown", mouseDownCallback);

	// Hook pointer lock state change events
	document.addEventListener('pointerlockchange', changeCallback, false);
	document.addEventListener('mozpointerlockchange', changeCallback, false);
	document.addEventListener('webkitpointerlockchange', changeCallback, false);

	function checkIfPointerLocked() {
		return document.pointerLockElement === canvas ||
		  document.mozPointerLockElement === canvas ||
		  document.webkitPointerLockElement === canvas;
	}

	function changeCallback() {
		if(!checkIfPointerLocked()){
			// Pointer Lock
			canvas.requestPointerLock = canvas.requestPointerLock ||
					     canvas.mozRequestPointerLock ||
					     canvas.webkitRequestPointerLock;
			// Ask the browser to lock the pointer
			canvas.requestPointerLock();
		}
		if (checkIfPointerLocked()) {
		  // Pointer was just locked
		  // Enable the mousemove listener
		  document.addEventListener("mousemove", moveCallback, false);
		  clientState.mouse = [canvas.width/2, canvas.height/2];
		} else {
		  // Pointer was just unlocked
		  // Disable the mousemove listener
		  document.removeEventListener("mousemove", moveCallback, false);
		}
	}

	function moveCallback(e) {
		
		var mouse = clientState.mouse;
		var camera = clientState.camera;

	  	var movementX = e.movementX;
		movementY = e.movementY;

		mouse[0] = Math.min(Math.max(0, mouse[0] + movementX*1.2), canvas.width-32);
		mouse[1] = Math.min(Math.max(0, mouse[1] + movementY*1.2), canvas.height-32);
	}

	function mouseDownCallback(e) {
		if(!checkIfPointerLocked()){
			// Pointer Lock
			canvas.requestPointerLock = canvas.requestPointerLock ||
					     canvas.mozRequestPointerLock ||
					     canvas.webkitRequestPointerLock;
			// Ask the browser to lock the pointer
			canvas.requestPointerLock();
		}
	}


	var loginInput = document.getElementById('login-input');
	loginInput.addEventListener('keydown', function(e) {
		if (e.which == 13) {
			var name = loginInput.value;
			socket.emit('login-name', name);
			appMoveToState('LOBBY_FRAME');
			return false;
		}
	});

	document.getElementById('create-room').addEventListener('click', function() {
		document.getElementById('create-room-form').style.display = 'block';
		document.getElementById('room-title').value = '';
		document.getElementById('room-title').focus();
	});

	document.getElementById('create-room-cancel').onclick = function() {
		document.getElementById('create-room-form').style.display = 'none';
	}
	document.getElementById('room-title').addEventListener('keydown', function(e) {
		if (e.which==13) {
			createRoom(document.getElementById('room-title').value);
			document.getElementById('create-room-form').style.display = 'none';
			return false;
		}
	});
	document.getElementById('create-room-submit').addEventListener('click', function(e) {
		createRoom(document.getElementById('room-title').value);
		document.getElementById('create-room-form').style.display = 'none';
	});

	document.getElementById('start-game-button').addEventListener('click', function() {
		if (clientState.isHost) {
			socket.emit('request-start-game');
		}
	})


	socket.on('online', function(msg) {
		clientState.online.push(msg.id);
		clientState.player[msg.id] = msg;
		displayOnlineList(msg);
	});

	socket.on('new-room', function(msg) {
		clientState.room[msg.id] = msg;
		clientState.roomList.push(msg.id);
		displayRoomList(msg);
	});

	socket.on('room-list', function(msg) {
		clientState.roomList = [];
		clientState.room = {};
		for (var i = 0; i < msg.length; ++i) {
			clientState.roomList.push(msg[i].id);
			clientState.room[msg[i].id] = msg[i];
		}
		displayRoomList();
	});

	socket.on('online-player', function(msg) {
		clientState.online = [];
		for (var i = 0; i < msg.length; ++i) {
			clientState.online.push(msg[i].id);
			clientState.player[msg[i].id] = msg[i];
		}
		displayOnlineList();
	});

	socket.on('offline', function(msg) {
		removeFromOnlineList(msg);
		displayOnlineList();
	});

	socket.on('room-created', function(msg) {
		clientState.room[msg.id] = msg;
		clientState.roomList.push(msg.id);
		clientState.currentRoom = msg;
		clientState.isHost = true;
		appMoveToState('ROOM_FRAME');
	});

	socket.on('room-full', function(roomId) {
		clientState.room[roomId].full = true;
		refreshRoomItem(clientState.room[roomId]);
		
		if (clientState.enteringRoomId == msg) {
			displayErrorMessage('Room is currently full');
		}
	});

	socket.on('room-available', function(roomId) {
		clientState.room[roomId].full = false;
		refreshRoomItem(clientState.room[roomId]);
	});

	socket.on('room-exited', function(playerId){
		if (clientState.room) {
			if (clientState.room.guestId == playerId) {
				clientState.room.guestId = -1;
				refreshRoomPlayerList();
			}
		}
	});

	socket.on('room-unavailable', function(roomId) {
		if (clientState.enteringRoomId == roomId) {
			displayErrorMessage('Room is currently unavailable');
			hideWaitingScreen();
		}
	});

	socket.on('room-joined', function(roomId) {
		if (roomId == clientState.enteringRoomId) {
			clientState.room = clientState.room[roomId];
			clientState.playingWithId = clientState.room.hostId;
			appMoveToState('ROOM_FRAME');
			hideWaitingScreen();
		}
	});

	socket.on('room-visitor', function(guestId) {
		if (clientState.room) {
			clientState.room.guestId = guestId;
			clientState.playingWithId = guestId;	
			refreshRoomPlayerList();	
		}
	});

	socket.on('room-deleted', function(roomId) {
		var tmp = [];
		for (var i = 0; i < clientState.roomList.length; ++i) {
			var rid = clientState.roomList[i];
			if (rid == roomId) continue;
			tmp.push(rid);
		}
		clientState.roomList = tmp;
		delete clientState.room[roomId];
		displayRoomList();
	});

	socket.on('room-owner', function(roomId) {
		if (clientState.room) {
			if (clientState.room.id == roomId) {
				clientState.isHost = true;
				clientState.guestId = -1;
			}
		}
	});

	socket.on('start-game', function(msg) {
		if (clientState.isHost) {
			clientState.team = msg.host;
		} else {
			clientState.team = msg.guest;
		}
		clientState.isGameOngoing = true;
		startGame();
	});

	socket.on('commands', function(msg) {
		if (clientState.isGameOngoing) {
			handleReceiveCommandEvent(msg);
		}
	});

}


function registerGameEventHandler() {
	var camera = clientState.camera;
	var canvas = clientState.canvas;
	var map = gameState.map;

	canvas.addEventListener("mousedown", mouseDownCallback);
	document.addEventListener('keydown', keyDownHandler);
	
	function mouseDownCallback(e) {
		// world x, y
		var x = clientState.mouse[0]+clientState.camera[0];
		var y = clientState.mouse[1]+clientState.camera[1];

		// screen x, y
		var sx = clientState.mouse[0];
		var sy = clientState.mouse[1];
		if (e.buttons == 1) {
			// LEFTCLICK
			
			// trap event if click is on menubar
			if (clientState.menuBar.containsPoint(sx, sy)) {
				clientState.menuBar.onclick(sx, sy);
				return;
			}


			if (clientState.state == 'BUILDING') {
				// commit building
				var pos = computeMapLocation(x, y);
				if (!isLandOccupied(pos[0], pos[1], clientState.buildingSize)) {
					clientState.state = 'NONE';
					clientState.menuBar.reset();
					issueCommand(clientState.currentCommand, [pos[0], pos[1], clientState.team]);
				}
			}
		}
		else if (e.buttons == 2) {
			// RIGHT CLICK
			if (clientState.state == 'BUILDING') {
				// cancel 
				clientState.menuBar.deselect.onclick();
			}
		}
	}

	function keyDownHandler(e) {
		var x = clientState.mouse[0]+clientState.camera[0];
		var y = clientState.mouse[1]+clientState.camera[1];
		
		
		if (e.which == 84) {
			// 'T'
			// generate tower
			// clientState.state = 'BUILDING';
			// clientState.currentCommand = COMMAND.BUILD_TOWER;
			// clientState.buildingSize = 2;
			clientState.menuBar.tower.onclick();
		}

		else if (e.which == 65) {
			// 'A'
			// generate farm
			// clientState.state = 'BUILDING';
			// clientState.currentCommand = COMMAND.BUILD_FARM;
			// clientState.buildingSize = 1;
			clientState.menuBar.farm.onclick();
		}

		else if (e.which == 70) {
			// 'F'
			// generate fence
			// clientState.state = 'BUILDING';
			// clientState.currentCommand = COMMAND.BUILD_FENCE;
			// clientState.buildingSize = 1;
			clientState.menuBar.fence.onclick();
		}

		else if (e.which == 82) {
			// 'R'
			// generate ranch
			// clientState.state = 'BUILDING';
			// clientState.currentCommand = COMMAND.BUILD_PIG_RANCH;
			// clientState.buildingSize = 2;
			clientState.menuBar.ranch.onclick();
		}

		else if (e.which == 67) {
			// 'C'
			// castle
			clientState.menuBar.castle.onclick();
		}

		else if (e.which == 72) {
			// 'H'
			clientState.menuBar.pighq.onclick();
		}

		else if (e.which == 71) {
			// 'G'
			clientState.menuBar.garden.onclick();
		}

		else if (e.which == 87) {
			// 'W'
			clientState.menuBar.wall.onclick();
		}

		else if (e.which == 85) {
			// 'U'
			// upgrade state
			// clientState.state = 'UPGRADE';
			clientState.menuBar.upgrade.onclick();
		}

		else if (e.which == 68) {
			// 'D'
			clientState.menuBar.deselect.onclick();
		}


		else if (e.which == 66) {
			// HELPER, REMOVE LATER
			// generate pig
			clearInterval(gameState.scheduler);
			//gameState.flocks.push(new Pig(new Vec2(x,y), clientState.team));
		}


	}
	

	

	return function removeAllGameEventListener() {
		document.removeEventListener("mousedown", mouseDownCallback);
		document.removeEventListener("keydown", keyDownHandler);
	}
}

function isLandOccupied(row, col, size) {
	// is there building
	for(var i = 0; i < size; ++i){
		for (var j = 0; j < size; ++j){
			if (row+i < 0 || col+j < 0 || row+i >= gameState.map.height || col+j >= gameState.map.width) return true;
			if (gameState.map.entry[(row+i)*gameState.map.width+(col+j)]) {
				return true;
			}
		}
	}
	// is there flocks
	for(var i = 0; i < gameState.flocks.length; ++i) {
		for(var dr = 0; dr < size; ++dr){
			for(var dc = 0; dc < size; ++dc) {
				if (gameState.flocks[i].collidesWithCell(gameState.map, [row+dr, col+dc])) return true;
			}
		}
	}
	return false;
}

function computeMapLocation(x, y) {
	return [Math.floor(y/gameState.map.size), Math.floor(x/gameState.map.size)];
}

function issueCommand(type, params) {
	gameState.localCommandLog.push([gameState.timestep, type, params]);
	gameState.commandBackLog[clientState.team].push([gameState.timestep, type, params]);
}

function executeCommand(c, isRedoingCommandLog) {
	var timestep = c[0];
	var type = c[1];
	var params = c[2];
	if (type == COMMAND.BUILD_TOWER) {
		// params[0] row
		// params[1] col
		// params[2] team info
		// if cannot build, return money
		if (isLandOccupied(params[0], params[1], 2)) {
			gameState.coins[params[2]] += PRICES['BUILD_TOWER'];
			return;
		}

		gameState.buildings.push(new Tower(params[0], params[1], params[2]));
	}
	else if (type == COMMAND.BUILD_FARM) {
		if (isLandOccupied(params[0], params[1], 1)) {
			gameState.coins[params[2]] += PRICES['BUILD_FARM'];
			return;
		}
		gameState.buildings.push(new Farm(params[0], params[1], params[2]));
	}
	else if (type == COMMAND.BUILD_FENCE) {
		if (isLandOccupied(params[0], params[1], 1)) {
			gameState.coins[params[2]] += PRICES['BUILD_FENCE'];
			return;
		}
		gameState.buildings.push(new Fence(params[0], params[1], params[2]));
	}
	else if (type == COMMAND.BUILD_PIG_RANCH) {
		if (isLandOccupied(params[0], params[1], 2)) {
			gameState.coins[params[2]] += PRICES['BUILD_PIG_RANCH'];
			return;
		}
		gameState.buildings.push(new PigRanch(params[0], params[1], params[2]));
	}

	else if (type == COMMAND.BUILD_CASTLE) {
		if (isLandOccupied(params[0], params[1], 2)) {
			gameState.coins[params[2]] += PRICES['BUILD_CASTLE'];
			return;
		}
		gameState.buildings.push(new Castle(params[0], params[1], params[2]));
	}
	else if (type == COMMAND.BUILD_GARDEN) {
		if (isLandOccupied(params[0], params[1], 1)) {
			gameState.coins[params[2]] += PRICES['BUILD_GARDEN'];
			return;
		}
		gameState.buildings.push(new Garden(params[0], params[1], params[2]));
	}
	else if (type == COMMAND.BUILD_WALL) {
		if (isLandOccupied(params[0], params[1], 1)) {
			gameState.coins[params[2]] += PRICES['BUILD_WALL'];
			return;
		}
		gameState.buildings.push(new Wall(params[0], params[1], params[2]));
	}
	else if (type == COMMAND.BUILD_PIG_HQ) {
		if (isLandOccupied(params[0], params[1], 2)) {
			gameState.coins[params[2]] += PRICES['BUILD_PIG_HQ'];
			return;
		}
		gameState.buildings.push(new PigHQ(params[0], params[1], params[2]));
	}

	else if (type == COMMAND.UPGRADE_PIG_RANCH) {
		// effect: pig upgraded
		// ranch : upgraded
		// farm : upgraded
		// can only upgrade once
		// params[0] is team info
		if (gameState.ranchTier[params[0]] == 2) return;
		if (gameState.coins[params[0]] < PRICES.UPGRADE_PIG_RANCH) return;
		gameState.coins[params[0]] -= PRICES.UPGRADE_PIG_RANCH;
		gameState.ranchTier[params[0]] = 2;

	}

	else if (type == COMMAND.UPGRADE_TOWER) {
		// fence : upgraded
		// tower : upgraded
		// can only upgrade once
		// params[0] is team info
		if (gameState.towerTier[params[0]] == 2) return;
		if (gameState.coins[params[0]] < PRICES.UPGRADE_TOWER) return;
		gameState.coins[params[0]] -= PRICES.UPGRADE_TOWER;
		gameState.towerTier[params[0]] = 2;

	} 

	else if (type == COMMAND.BUY) {
		// params[0] : team info
		// params[1] : command type (BUILD_...)
		// params[2] : price to lock
		// params[3] : building size
		var team = params[0];
		var buildCmd = params[1];
		var price = params[2];
		if (gameState.coins[team] >= price) {
			gameState.coins[team] -= price;

			if (isClientInTeam(team) && !isRedoingCommandLog){
				clientState.currentCommand = buildCmd;
				clientState.state = 'BUILDING';
				clientState.buildingSize = params[3];
			}
		}
	}

	else if (type == COMMAND.DESELECT) {
		// params[0] : team info
		// params[1] : price to release
		gameState.coins[params[0]] += params[1];
	}

	else if (type == COMMAND.SYNCHRONIZED) {
		gameState.lastSynchronized = gameState.timestep;
	}
}

function handleLocalCommand() {
	var localLog = gameState.localCommandLog;
	for (var i = 0; i < localLog.length; ++i) {
		if (localLog[i][0] < gameState.timestep) {
			continue;
		}
		executeCommand(localLog[i]);
	}
}


function handleCommands () {
	var other = (clientState.team + 1) % 2;
	if (gameState.commandBackLog[other].length > 0 && gameState.commandBackLog[other][0][0] < gameState.timestep) {
		// rollback because we have not executed enemy's commands on
		// previous timesteps!
		var currentTimestep = gameState.timestep;
		rollback();

		// gameState.timestep should point to latest synchronized time
		var i = 0, j = 0;	// i and j will point to the next unexecuted command
		var si = 0, sj = 0; // everything less than si and sj are synchronized
		var backlog = gameState.commandBackLog;
		
		gameState.timestep++;
		var i = 0, j = 0;
		for (var time = gameState.timestep; time < currentTimestep; ++time) {
			while (i < backlog[0].length && backlog[0][i][0] == time) {
				executeCommand(backlog[0][i], true);
				++i;
			}
			while (j < backlog[1].length && backlog[1][j][0] == time) {
				executeCommand(backlog[1][j], true);
				++j;
			}
			updateGame();
			if (gameState.lastSynchronized == time) {
				si = i;
				sj = j;
			}
		}

		gameState.commandBackLog[0] = gameState.commandBackLog[0].splice(si);
		gameState.commandBackLog[1] = gameState.commandBackLog[1].splice(sj);

	}


	// we will execute the new time frame
	var i = 0, j = 0;	// i and j will point to the next unexecuted command
	var si = 0, sj = 0;
	var synchronizationPoint = false;
	var backlog = gameState.commandBackLog;
	while (i < backlog[0].length) {
		if (backlog[0][i][0] == gameState.timestep) {
			
			executeCommand(backlog[0][i]);
			si = i+1;
			if (backlog[0][i][1] == COMMAND.SYNCHRONIZED) {
				synchronizationPoint = true;
			}
		}
		++i;
	}
	while (j < backlog[1].length) {
		if (backlog[1][j][0] == gameState.timestep) {

			executeCommand(backlog[1][j]);
			sj = j+1;
			if (backlog[1][j][1] == COMMAND.SYNCHRONIZED) {
				synchronizationPoint = true;
			}
		}
		++j;
	}
	if (synchronizationPoint) {
		gameState.commandBackLog[0] = gameState.commandBackLog[0].splice(si);
		gameState.commandBackLog[1] = gameState.commandBackLog[1].splice(sj);
	}
}


function renderMenuBar() {
	clientState.menuBar.render(clientState.g);
}

function isClientInTeam(team) {
	return clientState.team == team;
}



// APP GUI codes
function appMoveToState(state) {
	appFrames[clientState.appState].style.setProperty('display', 'none');
	appFrames[state].style.setProperty('display', 'block');
	clientState.appState = state;

	if (state == 'LOGIN_FRAME') {
		document.getElementById('login-input').focus();
	}
	else if (state == 'LOBBY_FRAME') {
		socket.emit('get-online-player');
		socket.emit('get-room-list');
	}
	else if (state == 'ROOM_FRAME') {

	}

}

function createRoom(roomTitle) {
	socket.emit('create-room', roomTitle);
}

function displayRoomList(toAppend) {
	if (toAppend) {
		document.getElementById('room-list').appendChild(generateRoomItem(toAppend));
	} else {
		document.getElementById('room-list').innerHTML = '';
		for (var i = 0; i < clientState.roomList.length; ++i) {
			var rid = clientState.roomList[i];
			var room = clientState.room[rid];
			document.getElementById('room-list').appendChild(generateRoomItem(room));
		}
	}
}

function generateRoomItem(room) {
	var div = document.createElement('div');
	var html = "<div>"+room.id+"</div>";
		html += "<div>"+room.title+"</div>";
		html += "<div>"+room.hostId+"</div>";
		html += "<div>"+room.hostname+"</div>";
		html += "<div>"+(room.full?'Full':'')+"</div>";
	div.innerHTML = html;
	div.onclick = function() {
		if (room.full) {
			displayErrorMessage("Room is currently full.");
		}
		clientState.enteringRoomId = room.id;
		socket.emit('join-room', room.id);
		displayWaitingScreen();
	}
	div.setAttribute('class', 'room-item');
	room.div = div;
	return div;
}

function refreshRoomItem(room) {
	var div = room.div;
	var html = "<div>"+room.id+"</div>";
		html += "<div>"+room.title+"</div>";
		html += "<div>"+room.hostId+"</div>";
		html += "<div>"+room.hostname+"</div>";
		html += "<div>"+(room.full?'Full':'')+"</div>";
	div.innerHTML = html;
}

function displayOnlineList(toAppend) {
	if (toAppend) {
		document.getElementById('online-user-list').appendChild(generateOnlineListItem(toAppend));
	} else {
		document.getElementById('online-user-list').innerHTML = '';
		for (var i = 0; i < clientState.online.length; ++i) {
			var id = clientState.online[i];
			document.getElementById('online-user-list').appendChild(generateOnlineListItem(clientState.player[id]));
		}
	}
}


function generateOnlineListItem(player) {
	var div = document.createElement('div');
	var html = "<div>"+player.id+"</div>";
		html += "<div>"+player.username+"</div>";
	div.innerHTML = html;
	div.setAttribute('class', 'online-list-item');
	player.div = div;
	return div;
}

function removeFromOnlineList(id) {
	var tmp = [];
	for (var i = 0; i < clientState.online.length; ++i){
		if (clientState.online[i] == id) continue;
		tmp.push(clientState.online[i]);
	}
	clientState.online = tmp;

	if (clientState.playingWithId == id) {
		gameHandlePlayerQuitEvent();
	}

	delete clientState.player[id];
}

function gameHandlePlayerQuitEvent() {

}

function displayErrorMessage(msg) {
	
}

function displayWaitingScreen() {
	document.getElementById('waiting-screen').style.display = 'block';
}

function hideWaitingScreen() {
	document.getElementById('waiting-screen').style.display = 'none';
}

function refreshRoomPlayerList() {

}




function sendCommandLog() {
	var DT = 500; // synchronize every timesteps
	if (gameState.timestep - gameState.lastSent <= DT) return;
	gameState.lastSent = gameState.timestep;
	gameState.localCommandLog.push([gameState.timestep-1, COMMAND.SYNCHRONIZED, []]);
	socket.emit('commands', gameState.localCommandLog);
	gameState.localCommandLog = [];

}

function synchronize(cmd) {
	

}

function createSnapshot() {
	var snapshot = {
		map : {
			data : new Int32Array(gameState.map.width*gameState.map.height).fill(1),
			entry : new Array(gameState.map.width*gameState.map.height).fill(null),
			lastUpdated : 0,
		},
		deadflocks : [],
		deadarrows : [],
		deadbuildings : [],
		flocks : [],
		buildings : [],
		arrows : [],
		timestep : 0,
		thrones : [],
		ranchTier : [1, 1],
		towerTier : [1, 1],
		coins : [10, 10],
	}

	// map data
	for (var i = 0; i < gameState.map.width * gameState.map.height; ++i) {
		snapshot.map.data[i] = gameState.map.data[i];
	}

	// map entry
	for (var i = 0; i < gameState.map.width * gameState.map.height; ++i) {
		snapshot.map.entry[i] = gameState.map.entry[i];
	}

	snapshot.map.lastUpdated = gameState.map.lastUpdated;

	for (var i = 0; i < gameState.deadflocks.length; ++i) {
		snapshot.deadflocks.push(gameState.deadflocks[i]);
		gameState.deadflocks[i].createSnapshot();
	}

	for (var i = 0; i < gameState.deadbuildings.length; ++i) {
		snapshot.deadbuildings.push(gameState.deadbuildings[i]);
		gameState.deadbuildings[i].createSnapshot();
	}

	for (var i = 0; i < gameState.deadarrows.length; ++i) {
		snapshot.deadarrows.push(gameState.deadarrows[i]);
		gameState.deadarrows[i].createSnapshot();
	}

	snapshot.timestep = gameState.timestep;

	for (var i = 0; i < gameState.flocks.length; ++i) {
		snapshot.flocks.push(gameState.flocks[i]);
		gameState.flocks[i].createSnapshot();
	}

	for (var i = 0; i < gameState.buildings.length; ++i) {
		snapshot.buildings.push(gameState.buildings[i]);
		gameState.buildings[i].createSnapshot();
	}

	for (var i = 0; i < gameState.arrows.length; ++i) {
		snapshot.arrows.push(gameState.arrows[i]);
		gameState.arrows[i].createSnapshot();
	}

	for (var i = 0; i < gameState.thrones.length; ++i) {
		snapshot.thrones.push(gameState.thrones[i]);
		gameState.thrones[i].createSnapshot();
	}

	for (var i = 0; i < gameState.ranchTier.length; ++i) {
		snapshot.ranchTier[i] = gameState.ranchTier[i];
		snapshot.towerTier[i] = gameState.towerTier[i];
		snapshot.coins[i] = gameState.coins[i];
	}

	gameState.snapshot = snapshot;

}

function rollback() {
	snapshot = gameState.snapshot;

	// map data
	for (var i = 0; i < gameState.map.width * gameState.map.height; ++i) {
		gameState.map.data[i] = snapshot.map.data[i];
	}

	// map entry
	for (var i = 0; i < gameState.map.width * gameState.map.height; ++i) {
		gameState.map.entry[i] = snapshot.map.entry[i];
	}

	gameState.map.lastUpdated = snapshot.map.lastUpdated;

	gameState.deadflocks = snapshot.deadflocks;
	for (var i = 0; i < gameState.deadflocks.length; ++i) {
		gameState.deadflocks[i].rollback();
	}

	gameState.flocks = snapshot.flocks;
	for (var i = 0; i < gameState.flocks.length; ++i) {
		gameState.flocks[i].rollback();
	}

	gameState.deadbuildings = snapshot.deadbuildings;
	for (var i = 0; i < gameState.deadbuildings.length; ++i) {
		gameState.deadbuildings[i].rollback();
	}

	gameState.buildings = snapshot.buildings;
	for (var i = 0; i < gameState.buildings.length; ++i) {
		gameState.buildings[i].rollback();
	}

	gameState.deadarrows = snapshot.deadarrows;
	for (var i = 0; i < gameState.deadarrows.length; ++i) {
		gameState.deadarrows[i].rollback();
	}
	
	gameState.arrows = snapshot.arrows;
	for (var i = 0; i < gameState.arrows.length; ++i) {
		gameState.arrows[i].rollback();
	}
	
	

	gameState.timestep = snapshot.timestep;

	gameState.thrones = snapshot.thrones;

	for (var i = 0; i < gameState.thrones.length; ++i) {
		gameState.thrones[i].rollback();
	}

	for (var i = 0; i < gameState.ranchTier.length; ++i) {
		gameState.ranchTier[i] = snapshot.ranchTier[i];
		gameState.towerTier[i] = snapshot.towerTier[i];
		gameState.coins[i] = snapshot.coins[i];
	}

}

function handleReceiveCommandEvent(cmd) {
	var other = (clientState.team+1)%2;
	gameState.commandBackLog[other] = gameState.commandBackLog[other].concat(cmd);
}



var cmd = [
	[
		[COMMAND.BUILD_PIG_RANCH, [0, 2, 0]],
		[COMMAND.BUILD_PIG_RANCH, [2, 2, 0]],
		[COMMAND.BUILD_FARM, [0, 4, 0]],
		[COMMAND.BUILD_FARM, [0, 5, 0]],
		[COMMAND.BUILD_FARM, [0, 6, 0]],
		[COMMAND.BUILD_FARM, [1, 4, 0]],
		[COMMAND.BUILD_FARM, [1, 5, 0]],
		[COMMAND.BUILD_FARM, [1, 6, 0]],
		[COMMAND.BUILD_FARM, [2, 4, 0]],
		[COMMAND.BUILD_FARM, [2, 5, 0]],
		[COMMAND.BUILD_TOWER, [6, 1, 0]],
	],

	[
		[COMMAND.BUILD_PIG_RANCH, [0, 6, 1]],
		[COMMAND.BUILD_PIG_RANCH, [2, 6, 1]],
		[COMMAND.BUILD_FARM, [0, 8, 1]],
		[COMMAND.BUILD_FARM, [0, 9, 1]],
		[COMMAND.BUILD_FARM, [0, 10, 1]],
		[COMMAND.BUILD_FARM, [1, 8, 1]],
		[COMMAND.BUILD_FARM, [1, 9, 1]],
		[COMMAND.BUILD_FARM, [1, 10, 1]],
		[COMMAND.BUILD_FARM, [2, 8, 1]],
		[COMMAND.BUILD_FARM, [2, 9, 1]],
		[COMMAND.BUILD_TOWER, [6, 10, 1]],
		[COMMAND.BUILD_TOWER, [4, 10, 1]],
		[COMMAND.BUILD_TOWER, [9, 10, 1]],
	] 
]
var lastupdate = [0, 0]
var delay = [100, 150]
var exec = [0, 0]
function testModule() {
	for(var t = 0; t < 2; ++t) {
		if (clientState.team == t) {
			if (exec[t] >= cmd[t].length) break;
			if (gameState.timestep - lastupdate[t] <= delay[t]) continue;
			lastupdate[t] = gameState.timestep;
			issueCommand(cmd[t][exec[t]][0], cmd[t][exec[t]][1]);
			exec[t]++;
		}
	}
}