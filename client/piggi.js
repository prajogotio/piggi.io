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
		"asset/destroy.png",
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
		"asset/snow.png",
		"asset/pigidow.jpg", 
		"asset/snowy-yosemite.jpg",
		"asset/furpig-valley.jpg",
		"asset/plus.png",
		"asset/minus.png",
		"asset/numbers-red.png",
		"asset/numbers-green.png",
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
	'VICTORY' : 13,
	'DESTROY' : 14,
}

var PRICES = {
	'BUILD_TOWER' : 50,
	'BUILD_FARM' : 5,
	'BUILD_PIG_RANCH' : 50,
	'BUILD_FENCE' : 5,
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
	FPS : 1000/30,
	SCALER : 1.5,
	SEND_DELAY : 30,
	MAX_FLOCKS_PER_TEAM : 50,
	ALLOWED_DELAY : 300,
	RECOVERED_DELAY : 150,
	CLOSE_BY : 1,
	FAR_AWAY : 2,
}

var maps = [];

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
	isSinglePlayer : true,
	id : 0,
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
					imgData.data[i] = Math.min(255, imgData.data[i]*1.25);
					imgData.data[i+1] = Math.min(255, imgData.data[i+1]*0.50);
					imgData.data[i+2] = Math.min(255, imgData.data[i+2]*0.50);
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
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	clientState.mouseImg = asset.images["asset/mouse.png"];
	clientState.mouseShadowImg = asset.images["asset/mouse_shadow.png"];
	clientState.mouse[0] = clientState.canvas.width/2;
	clientState.mouse[1] = clientState.canvas.height/2;
	generateMaps();

	registerAppEventHandler();

	startBackgroundAnimation();
	appMoveToState('LOGIN_FRAME');
}

function startGame() {
	if (gameState.scheduler) {
		clearInterval(gameState.scheduler);
	}
	if (gameState.gameEventHandlerResetFunction) {
		gameState.gameEventHandlerResetFunction();
	}

	gameState = {};

	appFrames['GAME_FRAME'].style.setProperty('display', 'block');
	createNewGame(clientState.currentRoom.chosenMap);
	gameState.mapSplit = clientState.currentRoom.mapSplit;


	clientState.menuBar = new MenuBar();

	clientState.camera[0] = gameState.thrones[clientState.team].pos.x-clientState.canvas.width/2;
	clientState.camera[1] = gameState.thrones[clientState.team].pos.y-clientState.canvas.height/2;

	clientState.gameEventHandlerResetFunction = registerGameEventHandler();
	
	createSnapshot();
	gameState.snapshot.timestep = -1;

	gameState.scheduler = setInterval(function() {
		// game routine
		//testModule();

		if (gameState.timestep - gameState.lastSynchronized > CONSTANTS.ALLOWED_DELAY) {
			showNoticeBox('Enemy is lagging');
			gameState.isLagging = true;
			//console.log('start of lag', gameState.timestep);
		}

		if (gameState.isLagging && gameState.timestep - gameState.lastSynchronized > CONSTANTS.RECOVERED_DELAY) {
			handleCommands();
			updateCamera();
			if (gameState.hasFogOfWar) {
				updateFogOfWar();
			}
			renderGame();
			if (gameState.hasFogOfWar) {
				renderFogOfWar();
			}
			renderMenuBar();
			drawMouse();
			return;
		} else {
			gameState.isLagging = false;
			hideNoticeBox();
		}

		if (!gameState.isGameOver) {
			testModule();
			handleCommands();
			updateGame();
		}

		updateCamera();

		if (gameState.hasFogOfWar) {
			updateFogOfWar();
		}
	

		renderGame();


		if (gameState.hasFogOfWar) {
			renderFogOfWar();
		}

		renderMenuBar();
		drawMouse();

		if (!gameState.isGameOver) {
			sendCommandLog();
		}
	}, CONSTANTS.FPS);
}

function createNewGame(mid) {
	var map = maps[mid];
	var mapWidth = map.width;
	var mapHeight = map.height;
	var mapURI = map.asset;
	var state = {
		map : {
			width : mapWidth,
			height : mapHeight,
			data : new Int32Array(mapWidth*mapHeight).fill(1),
			entry : new Array(mapWidth*mapHeight).fill(null),
			imgBuffer : asset.images[mapURI],
			size : 64,
			lastUpdated : 0,

			specialEffect : map.specialEffect ? map.specialEffect() : null,
		
			fogOfWar : new Int32Array(mapWidth*mapHeight).fill(1),
		},
		

		deadflocks : [],
		deadarrows : [],
		deadbuildings : [],

		flocks : [],
		buildings : [],
		arrows : [],

		numbers : [],

		timestep : 0,

		// team information
		thrones : [],
		ranchTier : [1, 1],
		towerTier : [1, 1],
		coins : [600, 600],

		lastSynchronized : -1,
		lastSent : 0,
		localCommandLog : [],
		commandBackLog : [[], []],

		declaredVictory : [false, false],
		isGameOver : false,
		madeDeclaration : false,
		isRedoing : false,


		numberOfFlocks : [0, 0],
		mapSplit : true,
		hasFogOfWar : clientState.currentRoom ? clientState.currentRoom.fogOfWar : false,
		isLagging : false
	}

	gameState = state;

	for (var i = 0; i < map.thrones.length; ++i) {
		state.thrones.push(new Throne(map.thrones[i][0], map.thrones[i][1], i));
	}
}

function updateCamera() {
	var mouse = clientState.mouse;
	var camera = clientState.camera;

	var dM = 10*CONSTANTS.SCALER;
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
	var yoverflowMargin = Math.max(0, (clientState.canvas.width - gameState.map.height*gameState.map.size)/2)
	var xoverflowMargin = Math.max(0, (clientState.canvas.width - gameState.map.width*gameState.map.size)/2);
	if (camera[0] < -xoverflowMargin) camera[0] = -xoverflowMargin;
	if (camera[1] < -yoverflowMargin) camera[1] = -yoverflowMargin;
	camera[0] = Math.min(camera[0], gameState.map.size*gameState.map.width+xoverflowMargin-clientState.canvas.width);
	camera[1] = Math.min(camera[1], gameState.map.size*gameState.map.height+overflowMargin+yoverflowMargin-clientState.canvas.height);

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
	
	if (gameState.mapSplit) {
		g.save();
		// if map split, draw line
		var y = gameState.map.height/2 * gameState.map.size;
		g.fillStyle = 'rgba(255,200,0,0.2)';
		g.fillRect(0, y-4, gameState.map.size*gameState.map.width, 8);
		g.restore();
	}

	// render the rest
	var all = [gameState.thrones, gameState.deadbuildings, gameState.buildings, gameState.deadflocks, gameState.deadarrows, gameState.flocks, gameState.arrows, gameState.numbers];

	for(var i = 0; i < all.length; ++i) {
		for(var j = 0; j < all[i].length; ++j){
			all[i][j].render(g);
		}
	}

	var tmp = [];
	for (var i = 0; i < gameState.numbers.length; ++i) {
		if (gameState.numbers[i].isAlive) tmp.push(gameState.numbers[i]);
	}
	gameState.numbers = tmp;

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

	if (gameState.map.specialEffect) {
		gameState.map.specialEffect(g);
	}

	g.restore();


	stateDependentRendering(g);

}

function drawMouse() {
	// must have pointer lock
	if (!clientState.mouseTrapped) {
		showNoticeBox("Click on the screen to move the piggi mouse.");
	}

	var g = clientState.g;
	g.save();
	g.translate(clientState.mouse[0], clientState.mouse[1]);
	g.save();
	g.globalAlpha = 0.2;
	g.drawImage(clientState.mouseShadowImg, 0, 0, 128, 128, 3, 10, 30, 30);
	g.restore();
	if (clientState.state == 'DESTROY') {
		g.drawImage(asset.images['asset/destroy.png'], 0, 0, 128, 128, 0, 0, 32, 32);
	} else {
		g.drawImage(clientState.mouseImg, 0, 0, 128, 128, 0, 0, 32, 32);
	}
	g.restore();
}

function stateDependentRendering(g) {
	if (clientState.state == 'BUILDING') {
		var pos = computeMapLocation(clientState.mouse[0]+clientState.camera[0],clientState.mouse[1]+clientState.camera[1]);
		g.save();
		g.fillStyle = (isLandOccupied(pos[0],pos[1],clientState.buildingSize, clientState.team) || !isLandViewable(pos[0],pos[1],clientState.buildingSize) ? "red":"green");
		g.globalAlpha = 0.5;
		g.fillRect(pos[1]*gameState.map.size-clientState.camera[0],pos[0]*gameState.map.size-clientState.camera[1],clientState.buildingSize*gameState.map.size,clientState.buildingSize*gameState.map.size);
		g.restore();
	} else if (clientState.state == 'DESTROY') {
		var pos = computeMapLocation(clientState.mouse[0]+clientState.camera[0],clientState.mouse[1]+clientState.camera[1]);
		g.save();
		g.fillStyle = (!isBuildingDestroyable(pos[0],pos[1],clientState.team) ? "red":"green");
		g.globalAlpha = 0.5;
		g.fillRect(pos[1]*gameState.map.size-clientState.camera[0],pos[0]*gameState.map.size-clientState.camera[1],gameState.map.size,gameState.map.size);
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

	if (gameState.timestep == gameState.lastSynchronized && !clientState.isSinglePlayer) {
		createSnapshot();
		// var hash = 0;
		// for (var i = 0; i < gameState.snapshot.flocks.length; ++i) {
		// 	hash += gameState.snapshot.flocks[i].velocity.x+gameState.snapshot.flocks[i].velocity.y+gameState.snapshot.flocks[i].pos.x+gameState.snapshot.flocks[i].pos.y+gameState.snapshot.flocks[i].healthPoints;
		// }
		// for (var i = 0; i < gameState.snapshot.arrows.length; ++i) {
		// 	hash += gameState.snapshot.arrows[i].velocity.x+gameState.snapshot.arrows[i].velocity.y+gameState.snapshot.arrows[i].pos.x+gameState.snapshot.arrows[i].pos.y;
		// }
		// for (var i = 0; i < gameState.snapshot.thrones.length; ++i) {
		// 	hash += gameState.snapshot.thrones[i].healthPoints;
		// }
		// console.log(gameState.snapshot.timestep, hash);
	}

	

	

	if (clientState.isSinglePlayer) {
		if (!gameState.thrones[0].isAlive) {
			gameState.declaredVictory[1] = true;
		}
		if (!gameState.thrones[1].isAlive) {
			gameState.declaredVictory[0] = true;
		}
		if (gameState.declaredVictory[0] || gameState.declaredVictory[1]) {
			gameOver();
			return;
		}
	}

	gameState.timestep++;

	// victory check must be on the next timestep
	var other = (clientState.team + 1)%2;
	if (!gameState.thrones[other].isAlive && !gameState.madeDeclaration) {
		gameState.madeDeclaration = true;
		issueCommand(COMMAND.VICTORY, [clientState.team]);
	}

	if (gameState.snapshot) {
		if (gameState.snapshot.declaredVictory[0] || gameState.snapshot.declaredVictory[1]) {
			gameOver();
			return;
		}
	}
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
		if (checkIfPointerLocked()) {
		  // Pointer was just locked
		  // Enable the mousemove listener
		  hideNoticeBox();
		  document.addEventListener("mousemove", moveCallback, false);
		  clientState.mouse = [canvas.width/2, canvas.height/2];
		  clientState.mouseTrapped = true;
		} else {
		  // Pointer was just unlocked
		  // Disable the mousemove listener
		  document.removeEventListener("mousemove", moveCallback, false);
		  clientState.mouseTrapped = false;
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
			if (clientState.currentRoom.isSinglePlayer) {
				startSinglePlayerGame();
			} else {
				if (clientState.currentRoom.guestId == -1) return;
				socket.emit('request-start-game');
				displayWaitingScreen();
			}
		}
	});

	document.getElementById('exit-button').addEventListener('click', function() {
		clientState.isHost = false;
		socket.emit('exit-room');
		appMoveToState('LOBBY_FRAME');
	});

	document.getElementById('prev-map').addEventListener('click', function() {
		var mid = clientState.currentRoom.chosenMap - 1;
		if (mid < 0) mid += maps.length;
		clientState.currentRoom.chosenMap = mid;
		if (!clientState.currentRoom.isSinglePlayer){
			socket.emit('map-change', mid);
		}
		refreshRoom();
	});

	document.getElementById('next-map').addEventListener('click', function() {
		var mid = (clientState.currentRoom.chosenMap + 1) % maps.length;
		clientState.currentRoom.chosenMap = mid;
		if (!clientState.currentRoom.isSinglePlayer){
			socket.emit('map-change', mid);
		}
		refreshRoom();
	});

	document.getElementById('tutorial').addEventListener('click', function() {
		showTutorial();
	});	

	document.getElementById('single-player').addEventListener('click', function() {
		clientState.currentRoom = {
			id : 0,
			title : 'Single Player',
			chosenMap : 0,
			mapSplit : true,
			fogOfWar : true,
			isSinglePlayer : true,
			hostId : clientState.id,
		}
		clientState.isHost = true;
		appMoveToState('ROOM_FRAME');
	});

	document.getElementById('tutorial-ok-button').addEventListener('click', function() {
		hideTutorial();
	})

	document.getElementById('map-split').addEventListener('change', function() {
		if (!clientState.isHost){
			refreshRoom();
			return;
		}
		clientState.currentRoom.mapSplit = this.checked;
		if (!clientState.currentRoom.isSinglePlayer){
			socket.emit('map-split-change', this.checked);
		}
		refreshRoom();
	});

	document.getElementById('map-fog').addEventListener('change', function() {
		if (!clientState.isHost){
			refreshRoom();
			return;
		}
		clientState.currentRoom.fogOfWar = this.checked;
		if (!clientState.currentRoom.isSinglePlayer){
			socket.emit('map-fog-change', this.checked);
		}
		refreshRoom();
	});


	socket.on('id', function(id) {
		clientState.id = id;
	});

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
		clientState.currentRoom.chosenMap = 0;
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
		if (clientState.currentRoom) {
			if (clientState.currentRoom.guestId == playerId) {
				clientState.currentRoom.guestId = -1;
				refreshRoom();
			}
		}
	});

	socket.on('room-unavailable', function(roomId) {
		if (clientState.enteringRoomId == roomId) {
			displayErrorMessage('Room is currently unavailable');
			hideWaitingScreen();
		}
	});

	socket.on('room-joined', function(room) {
		if (room.id == clientState.enteringRoomId) {
			clientState.room[room.id] = room;
			clientState.currentRoom = room;
			clientState.currentRoom.guestId = clientState.id;
			clientState.playingWithId = clientState.currentRoom.hostId;
			appMoveToState('ROOM_FRAME');
			hideWaitingScreen();
		}
	});

	socket.on('room-visitor', function(msg) {
		guestId = msg.id;
		username = msg.username;
		if (clientState.currentRoom) {
			clientState.currentRoom.guestId = guestId;
			clientState.player[guestId] = {
				username: username,
				id: guestId,
			}
			clientState.playingWithId = guestId;
			refreshRoom();	
		}
	});

	socket.on('map-change', function(mid) {
		clientState.currentRoom.chosenMap = mid;
		refreshRoom();
	});
	
	socket.on('map-split-change', function(mapSplit) {
		clientState.currentRoom.mapSplit = mapSplit;
		refreshRoom();
	});

	socket.on('map-fog-change', function(fogOfWar) {
		clientState.currentRoom.fogOfWar = fogOfWar;
		refreshRoom();
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
		if (clientState.currentRoom) {
			if (clientState.currentRoom.id == roomId) {
				clientState.isHost = true;
				clientState.currentRoom.guestId = -1;
				clientState.currentRoom.hostId = clientState.id;
				refreshRoom();
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
		clientState.isSinglePlayer = false;
		appMoveToState('GAME_FRAME');
		hideWaitingScreen();
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
				if (!isLandOccupied(pos[0], pos[1], clientState.buildingSize, clientState.team) && isLandViewable(pos[0], pos[1], clientState.buildingSize)) {
					clientState.state = 'NONE';
					clientState.menuBar.reset();
					issueCommand(clientState.currentCommand, [pos[0], pos[1], clientState.team]);
				}
			} else if (clientState.state == 'DESTROY') {
				var pos = computeMapLocation(x, y);
				if (isBuildingDestroyable(pos[0], pos[1], clientState.team)) {
					clientState.state = 'NONE';
					issueCommand(COMMAND.DESTROY, [pos[0], pos[1], clientState.team]);
					clientState.menuBar.reset();
				}
			}
		}
		else if (e.buttons == 2) {
			// RIGHT CLICK
			if (clientState.state == 'BUILDING' || clientState.state == 'DESTROY') {
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



	}
	

	

	return function removeAllGameEventListener() {
		document.removeEventListener("mousedown", mouseDownCallback);
		document.removeEventListener("keydown", keyDownHandler);
	}
}

function isLandOccupied(row, col, size, team) {
	// map split?
	if (gameState.mapSplit){
		if (team == 0) {
			if (row >= gameState.map.height/2) return true;
		}
		if (team == 1) {
			if (row < gameState.map.height/2) return true;
		}
	}

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

function isLandViewable(row, col, size) {
	if (!gameState.hasFogOfWar) return true;

	for (var r = row; r < row+size; ++r) {
		for (var c = col; c < col+size; ++c) {
			if (r < 0 || c < 0 || r >= gameState.map.height || c >= gameState.map.width) return false;
			var idx = r * gameState.map.width + c;
			if (gameState.map.fogOfWar[idx] == 0) return false;
		}
	}
	return true;
}

function computeMapLocation(x, y) {
	return [Math.floor(y/gameState.map.size), Math.floor(x/gameState.map.size)];
}

function issueCommand(type, params) {
	if (gameState.isLagging) return;
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
		if (isLandOccupied(params[0], params[1], 2, params[2])) {
			gameState.coins[params[2]] += PRICES['BUILD_TOWER'];
			return;
		}

		gameState.buildings.push(new Tower(params[0], params[1], params[2]));
	}
	else if (type == COMMAND.BUILD_FARM) {
		if (isLandOccupied(params[0], params[1], 1, params[2])) {
			gameState.coins[params[2]] += PRICES['BUILD_FARM'];
			return;
		}
		gameState.buildings.push(new Farm(params[0], params[1], params[2]));
	}
	else if (type == COMMAND.BUILD_FENCE) {
		if (isLandOccupied(params[0], params[1], 1, params[2])) {
			gameState.coins[params[2]] += PRICES['BUILD_FENCE'];
			return;
		}
		gameState.buildings.push(new Fence(params[0], params[1], params[2]));
	}
	else if (type == COMMAND.BUILD_PIG_RANCH) {
		if (isLandOccupied(params[0], params[1], 2, params[2])) {
			gameState.coins[params[2]] += PRICES['BUILD_PIG_RANCH'];
			return;
		}
		gameState.buildings.push(new PigRanch(params[0], params[1], params[2]));
	}

	else if (type == COMMAND.BUILD_CASTLE) {
		if (isLandOccupied(params[0], params[1], 2, params[2])) {
			gameState.coins[params[2]] += PRICES['BUILD_CASTLE'];
			return;
		}
		gameState.buildings.push(new Castle(params[0], params[1], params[2]));
	}
	else if (type == COMMAND.BUILD_GARDEN) {
		if (isLandOccupied(params[0], params[1], 1, params[2])) {
			gameState.coins[params[2]] += PRICES['BUILD_GARDEN'];
			return;
		}
		gameState.buildings.push(new Garden(params[0], params[1], params[2]));
	}
	else if (type == COMMAND.BUILD_WALL) {
		if (isLandOccupied(params[0], params[1], 1, params[2])) {
			gameState.coins[params[2]] += PRICES['BUILD_WALL'];
			return;
		}
		gameState.buildings.push(new Wall(params[0], params[1], params[2]));
	}
	else if (type == COMMAND.BUILD_PIG_HQ) {
		if (isLandOccupied(params[0], params[1], 2, params[2])) {
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
		gameState.lastSynchronized = timestep;
	}

	else if (type == COMMAND.VICTORY) {
		// params[0] : winning team
		var other = (params[0]+1)%2;
		if (gameState.declaredVictory[0] || gameState.declaredVictory[1]) {
			return;
		}
		if (gameState.thrones[other].isAlive) {
			gameState.madeDeclaration = false;
			return;
		}
		gameState.declaredVictory[params[0]] = true;
	}

	else if (type == COMMAND.DESTROY) {
		// params[0] r, params[1] c, params[2] team
		if (isBuildingDestroyable(params[0], params[1], params[2])) {
			var entry = gameState.map.entry[params[0]*gameState.map.width+params[1]];
			entry.receiveDamage(1e9);
		}
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


function handleCommands() {
	if (gameState.isGameOver) return;
	gameState.trueTime = gameState.timestep;

	var other = (clientState.team + 1) % 2;
	if (gameState.commandBackLog[other].length > 0 && gameState.commandBackLog[other][0][0] < gameState.timestep) {
		// rollback because we have not executed enemy's commands on
		// previous timesteps!
		var currentTimestep = gameState.timestep;
		rollback();

		gameState.isRedoing = true;

		// gameState.timestep should point to latest synchronized time
		var i = 0, j = 0;	// i and j will point to the next unexecuted command
		var si = 0, sj = 0; // everything less than si and sj are synchronized
		var backlog = gameState.commandBackLog;

		gameState.timestep++;

		// console.log(currentTimestep, gameState.timestep);
		// for (var i = 0; i < gameState.commandBackLog[0].length;++i){
		// 	console.log('0 [',gameState.commandBackLog[0][i][0],']');
		// }
		// for (var i = 0; i < gameState.commandBackLog[1].length;++i){
		// 	console.log('1 [',gameState.commandBackLog[1][i][0],']');
		// }

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
		}
		var otherIdx = (other == 0 ? i : j);
		var local = clientState.team;
		var localIdx = 0;
		var maxT = (0 < otherIdx ? backlog[other][otherIdx-1][0] : -1);
		while (localIdx < backlog[local].length) {
			if (backlog[local][localIdx][0] <= maxT) {
				localIdx++;
			} else {
				break;
			}
		}
		gameState.commandBackLog[other] = gameState.commandBackLog[other].splice(otherIdx);
		gameState.commandBackLog[local] = gameState.commandBackLog[local].splice(localIdx);
		
		// console.log('rem')
		// for (var i = 0; i < gameState.commandBackLog[0].length;++i){
		// 	console.log('0 [',gameState.commandBackLog[0][i][0],']');
		// }
		// for (var i = 0; i < gameState.commandBackLog[1].length;++i){
		// 	console.log('1 [',gameState.commandBackLog[1][i][0],']');
		// }

		gameState.isRedoing = false;

	}
	if (gameState.isLagging) return;

	// we will execute the new time frame
	var i = 0, j = 0;	// i and j will point to the next unexecuted command
	var si = 0, sj = 0;
	var synchronizationPoint = false;
	var backlog = gameState.commandBackLog;
	while (i < backlog[0].length) {
		if (backlog[0][i][0] == gameState.timestep) {
			
			executeCommand(backlog[0][i]);
			si = i+1;
		}
		++i;
	}
	while (j < backlog[1].length) {
		if (backlog[1][j][0] == gameState.timestep) {

			executeCommand(backlog[1][j]);
			sj = j+1;
		}
		++j;
	}

	if (backlog[other].length > 0) {
		var otherIdx = (other == 0 ? si : sj);
		var local = clientState.team;
		var localIdx = 0;
		var maxT = (0 < otherIdx ? backlog[other][otherIdx-1][0] : -1);
		while (localIdx < backlog[local].length) {
			if (backlog[local][localIdx][0] <= maxT) {
				localIdx++;
			} else {
				break;
			}
		}
		gameState.commandBackLog[other] = gameState.commandBackLog[other].splice(otherIdx);
		gameState.commandBackLog[local] = gameState.commandBackLog[local].splice(localIdx);
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
	// clean up
	appFrames[clientState.appState].style.setProperty('display', 'none');
	if (clientState.appState == 'GAME_FRAME') {
		appFrames[clientState.appState].style.setProperty('z-index', '0');
	}

	appFrames[state].style.setProperty('display', 'block');

	clientState.appState = state;
	// prepare
	if (state == 'LOGIN_FRAME') {
		document.getElementById('login-input').focus();
	}
	else if (state == 'LOBBY_FRAME') {
		document.getElementById('create-room-form').style.display = 'none';
		socket.emit('get-online-player');
		socket.emit('get-room-list');
	}
	else if (state == 'ROOM_FRAME') {
		refreshRoom();
	}
	else if (state == 'GAME_FRAME') {
		appFrames[clientState.appState].style.setProperty('z-index', '5');
	}

}

function createRoom(roomTitle) {
	socket.emit('create-room', roomTitle);
}

function displayRoomList(toAppend) {
	if (toAppend) {
		document.getElementById('room-list').insertBefore(generateRoomItem(toAppend), document.getElementById('room-list').lastChild);
	} else {
		document.getElementById('room-list').innerHTML = '';
		for (var i = 0; i < clientState.roomList.length; ++i) {
			var rid = clientState.roomList[i];
			var room = clientState.room[rid];
			document.getElementById('room-list').appendChild(generateRoomItem(room));
		}
		var clearfix = document.createElement('div');
		clearfix.setAttribute('class', 'clear-fix');
		document.getElementById('room-list').appendChild(clearfix);

	}
}

function generateRoomItem(room) {
	var div = document.createElement('div');
	var html = "<div class='room-item-title'>["+room.id+"] ";
		html += room.title+"</div>";
		html += "<div class='room-item-owner'>Owner: ["+room.hostId+"] ";
		html += room.hostname+"</div>";
		html += "<div class='room-item-status'>Status: "+(room.full?'<span class="full">Full</span>':'<span class="avail">Available</span>')+"</div>";
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
	var html = "<div class='room-item-title'>["+room.id+"] ";
		html += room.title+"</div>";
		html += "<div class='room-item-owner'>Owner: ["+room.hostId+"] ";
		html += room.hostname+"</div>";
		html += "<div class='room-item-status'>Status: "+(room.full?'<span class="full">Full</span>':'<span class="avail">Available</span>')+"</div>";
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
	var html = "<div class='id'>"+player.id+"</div>";
		html += "<div class='name'>"+player.username+"</div>";
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
	// enemy has quit
	gameState.declaredVictory[clientState.team] = true;
	gameOver();
}

function displayErrorMessage(msg) {
	
}

function displayWaitingScreen() {
	document.getElementById('waiting-screen').style.display = 'block';
}

function hideWaitingScreen() {
	document.getElementById('waiting-screen').style.display = 'none';
}

function refreshRoom() {
	document.getElementById('room-frame-title').innerHTML = "Room Title : [" + clientState.currentRoom.id + "] " + clientState.currentRoom.title;
	document.getElementById('start-game-button').style.display = clientState.isHost ? 'block' : 'none';
	document.getElementById('map-options').style.display = clientState.isHost ? 'block' : 'none';
	document.getElementById('map-split').checked = clientState.currentRoom.mapSplit;
	document.getElementById('map-fog').checked = clientState.currentRoom.fogOfWar;

	if (!clientState.currentRoom.isSinglePlayer) {
		document.getElementById('room-frame-guest').innerHTML = (clientState.currentRoom.guestId == -1 ? 'Waiting.' : '['+clientState.currentRoom.guestId+'] '+clientState.player[clientState.currentRoom.guestId].username);
		if (clientState.currentRoom.guestId == -1) {
			document.getElementById('guest-title').style.setProperty('background-color', 'rgba(255,100,100,0.5)');
			document.getElementById('start-game-button').style.setProperty('opacity', '0.5');
		} else {
			document.getElementById('guest-title').style.setProperty('background-color', 'rgba(133,255,133,0.5)');
			document.getElementById('start-game-button').style.setProperty('opacity', '1.0');
		}
	} else {
		document.getElementById('room-frame-guest').innerHTML = 'Simple Piggi AI';
		document.getElementById('guest-title').style.setProperty('background-color', 'rgba(133,255,133,0.5)');
			document.getElementById('start-game-button').style.setProperty('opacity', '1.0');
	}

	document.getElementById('room-frame-host').innerHTML = '['+clientState.currentRoom.hostId+'] '+clientState.player[clientState.currentRoom.hostId].username;

	var canvas = document.getElementById('map-info-canvas');
	var g = canvas.getContext('2d');
	var map = maps[clientState.currentRoom.chosenMap];
	g.drawImage(asset.images[map.asset], 0, 0, asset.images[map.asset].width, asset.images[map.asset].width, 0, 0, canvas.width, canvas.height);
	document.getElementById('map-title').innerHTML = "Location : " + map.title;
	document.getElementById('map-dimension').innerHTML = "Size : " + map.width + " x " + map.height;
}




function sendCommandLog(forceSend) {
	if (clientState.isSinglePlayer) return;
	if (!forceSend && gameState.timestep - gameState.lastSent <= CONSTANTS.SEND_DELAY) return;
	
	gameState.lastSent = gameState.timestep;
	gameState.localCommandLog.push([forceSend ? gameState.trueTime : gameState.timestep-1, COMMAND.SYNCHRONIZED, []]);
	socket.emit('commands', gameState.localCommandLog);
	// if (forceSend) {
	// 	console.log("Uda selse game", gameState.localCommandLog);
	// }
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
		declaredVictory : [false, false],
		madeDeclaration : false,
		numberOfFlocks : [0, 0],
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
	//console.log(gameState.timestep);
	//console.log(gameState.flocks.length, gameState.snapshot ? gameState.snapshot.flocks.length: -1);
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
		snapshot.declaredVictory[i] = gameState.declaredVictory[i];
		snapshot.numberOfFlocks[i] = gameState.numberOfFlocks[i];
	}
	snapshot.madeDeclaration = gameState.madeDeclaration;

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
		gameState.declaredVictory[i] = snapshot.declaredVictory[i];
		gameState.numberOfFlocks[i] = snapshot.numberOfFlocks[i];
	}
	gameState.madeDeclaration = snapshot.madeDeclaration;

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
var x = 0, y = 2;
function testModule() {
	if(false){
		if(clientState.team == 0){
			if (gameState.timestep % CONSTANTS.SEND_DELAY == 2) {
				if (Math.random() < 0.3) {
					var k = 0;
					for (var i = 0; i < 100000000; ++i) {
						k *= 100139103;
					}
				}
				issueCommand(COMMAND.BUILD_FENCE, [x, y, 0]);
				x++,y++;
			}
		}
		return;
	}

	for(var t = 0; t < 2; ++t) {
		if (clientState.team == t) {
			// if (t == 1 && gameState.timestep == 123) {
			// 	for (var i = 0; i < 50000;++i) {
			// 		console.log('make it happen')
			// 	}
			// }
			if (exec[t] >= cmd[t].length) {
				delay[t] = 300;
				if (gameState.timestep - lastupdate[t] <= delay[t]) continue;
				lastupdate[t] = gameState.timestep;
				if (true){
					var r = Math.floor(Math.random()*gameState.map.height*gameState.map.size);
					var c = Math.floor(Math.random()*gameState.map.width*gameState.map.size);
					var t = Math.random();
					var bs = 1;
					if (t < 0.2) {
						t = COMMAND.BUILD_PIG_RANCH;
						bs = 2;
					} else if (t < 0.4) {
						t = COMMAND.BUILD_TOWER;
						bs = 2;
					} else if (t < 0.8) {
						t = COMMAND.BUILD_FARM;
					} else {
						t = COMMAND.BUILD_FENCE;
					}
					if (!isLandOccupied(r, c, bs, clientState.team)) {
						issueCommand(t, [r, c, clientState.team]);
					}
				}
				break;
			}
			if (gameState.timestep - lastupdate[t] <= delay[t]) continue;
			lastupdate[t] = gameState.timestep;
			issueCommand(cmd[t][exec[t]][0], cmd[t][exec[t]][1]);
			exec[t]++;
		}
	}
}


function startBackgroundAnimation() {
	appFrames['GAME_FRAME'].style.setProperty('display', 'block');
	// example game
	createNewGame(0);
	gameState.flocks.push(new Pig(new Vec2(canvas.width/2, canvas.height/2), 0));

	//clientState.camera[0] = gameState.thrones[clientState.team].pos.x-clientState.canvas.width/2;
	//clientState.camera[1] = gameState.thrones[clientState.team].pos.y-clientState.canvas.height/2;

	
	var lastChosen = -10000;
	var changeDelay = 1000;
	gameState.thrones[1].isAlive = false;
	gameState.hasFogOfWar = false;
	gameState.mapSplit = false;
	gameState.scheduler = setInterval(function() {
		if (gameState.timestep - lastChosen > changeDelay){
			gameState.flocks[0].setLockOnTarget({
				isAlive : true,
				MOVING_TARGET:true,
				pos : new Vec2(Math.random()*gameState.map.width*gameState.map.size, Math.random()*gameState.map.height*gameState.map.size)
			}, gameState.map);
			lastChosen = gameState.timestep;
		}
		updateGame();
		clientState.camera[0] = gameState.flocks[0].pos.x-clientState.canvas.width/2;
		clientState.camera[1] = gameState.flocks[0].pos.y-clientState.canvas.height/2;
		updateCamera();
		renderGame();
	}, CONSTANTS.FPS);
}

function gameOver() {
	if (!clientState.isGameOngoing) return;
	sendCommandLog(true);
	gameState.isGameOver = true;
	clientState.isGameOngoing = false;
	showGameOverScreen();
}

function gameCleanUp() {
	clientState.team = 0;
	clientState.state = 'NONE';
	clientState.isSinglePlayer = false;
	if(gameState.scheduler){
		clearInterval(gameState.scheduler);
	}
	if (gameState.gameEventHandlerResetFunction) {
		gameState.gameEventHandlerResetFunction();
	}
	hideNoticeBox();
}

function showGameOverScreen() {
	if (gameState.declaredVictory[clientState.team]) {
		document.getElementById("notice-text1").innerHTML = "You Win!";
	} else {
		document.getElementById("notice-text1").innerHTML = "You Lose.";
	}
	
	if (clientState.mouseTrapped) {
		document.getElementById("notice-text2").innerHTML = "Press any key to exit.";
	} else {
		document.getElementById("notice-text2").innerHTML = "Click here to exit.";
	}
	document.addEventListener("click", clickHandler);
	document.addEventListener("keydown", keyHandler);
	function clickHandler() {
		document.exitPointerLock = document.exitPointerLock    ||
                           document.mozExitPointerLock ||
                           document.webkitExitPointerLock;

		document.exitPointerLock();
		gameCleanUp();
		document.removeEventListener("click", clickHandler);
		document.removeEventListener("keydown", keyHandler);
		document.getElementById("game-over-notice").style.display = 'none';
		appMoveToState('ROOM_FRAME');
		startBackgroundAnimation();
	}

	function keyHandler() {
		document.exitPointerLock = document.exitPointerLock    ||
                           document.mozExitPointerLock ||
                           document.webkitExitPointerLock;

		document.exitPointerLock();
		gameCleanUp();
		document.removeEventListener("click", clickHandler);
		document.removeEventListener("keydown", keyHandler);
		document.getElementById("game-over-notice").style.display = 'none';
		appMoveToState('ROOM_FRAME');
		startBackgroundAnimation();
	}
	document.getElementById("game-over-notice").style.display = 'block';
}

function showNoticeBox(txt) {
	document.getElementById('game-notice-box').innerHTML = txt;
	document.getElementById('game-notice-box').style.display = 'block';
}

function hideNoticeBox() {
	document.getElementById('game-notice-box').style.display = 'none';
}

function isBuildingDestroyable(r, c, team) {
	var entry = gameState.map.entry[r*gameState.map.width+c];
	return entry && entry.team == team && entry.destroyable;
}

function generateMaps() {
	maps.push({
		title : 'Pigidow',
		asset : 'asset/pigidow.jpg',
		width : 20,
		height : 32,
		thrones : [[0,0], [30,18]],
		specialEffect : null,
	});
	maps.push({
		title : 'Snowy Yosemite',
		asset : 'asset/snowy-yosemite.jpg',
		width : 25,
		height : 40,
		thrones : [[0, 12], [38, 13]],
		specialEffect : snowGenerator,
	});
	maps.push({
		title : 'Furpig Valley',
		asset : "asset/furpig-valley.jpg",
		width : 4,
		height : 20,
		thrones : [[0,1],[18,1]],
		specialEffect : null,
	})
}

function snowGenerator() {
	var snow = [];
	var MAX_DELTA = 300;
	return function render(g) {
		if (Math.random() < 0.4) {
			var x = Math.random() * gameState.map.width*gameState.map.size;
			var y = Math.random() * gameState.map.height*gameState.map.size;
			snow.push({pos : new Vec2(x,y), delta:0});
		}
		var tmp = [];
		for (var i = 0; i < snow.length; ++i) {
			if (snow[i].delta >= MAX_DELTA) {
				continue;
			}
			tmp.push(snow[i]);
			if(snow[i].delta % 20 == 0) {
				var dx = (Math.random() < 0.5 ? -1 : 1) * Math.random();
				var dy = Math.random();
				var v = new Vec2(dx,dy).normalize().times(0.8);
				snow[i].v = v;
			}
			snow[i].pos = snow[i].pos.plus(snow[i].v);
			g.drawImage(asset.images['asset/snow.png'], 0, 0, 128, 128, snow[i].pos.x, snow[i].pos.y, 32, 32);
			snow[i].delta++;
		}
		snow = tmp;
	}
}

function showTutorial() {
	document.getElementById('tutorial-div').style.display = 'block';
}

function hideTutorial() {
	document.getElementById('tutorial-div').style.display = 'none';
}

function startSinglePlayerGame() {
	appMoveToState('GAME_FRAME');
	if (gameState.scheduler) {
		clearInterval(gameState.scheduler);
	}
	if (gameState.gameEventHandlerResetFunction) {
		gameState.gameEventHandlerResetFunction();
	}

	gameState = {};

	appFrames['GAME_FRAME'].style.setProperty('display', 'block');
	clientState.isGameOngoing = true;
	clientState.isSinglePlayer = true;

	createNewGame(clientState.currentRoom.chosenMap);
	gameState.mapSplit = clientState.currentRoom.mapSplit;
	clientState.menuBar = new MenuBar();

	clientState.team = 0;

	clientState.camera[0] = gameState.thrones[clientState.team].pos.x-clientState.canvas.width/2;
	clientState.camera[1] = gameState.thrones[clientState.team].pos.y-clientState.canvas.height/2;

	clientState.gameEventHandlerResetFunction = registerGameEventHandler();
	
	createSnapshot();
	gameState.snapshot.timestep = -1;
	gameState.AI = {};
	gameState.AI.farms = 0;
	gameState.AI.fences = 0;
	gameState.AI.ranches = 0;
	gameState.AI.towers = 0;

	gameState.scheduler = setInterval(function() {
		// game routine
		if (!gameState.isGameOver) {
			updateAI();
			handleCommands();
			updateGame();
		}
		updateCamera();
		if (gameState.hasFogOfWar){
			updateFogOfWar();
		}
		renderGame();

		if (gameState.hasFogOfWar) {
			renderFogOfWar();
		}

		renderMenuBar();
		drawMouse();

		if (!gameState.isGameOver) {
			sendCommandLog();
		}
	}, CONSTANTS.FPS);
}

function updateAI() {
	var r = gameState.thrones[1].row;
	var empty = false;
	if (gameState.timestep % 30) return;
	for (var i = gameState.map.height; i >= 0; --i) {
		for (var j = 0; j < gameState.map.width; j++) {
			if (!isLandOccupied(i-1, j, 2, 1)) {
				empty = true;
				if(Math.random() < 0.9){
					if(Math.random() < 0.9){
						if (gameState.coins[1] > PRICES['BUILD_PIG_RANCH']) {
							gameState.AI.ranches++;
							gameState.coins[1] -= PRICES['BUILD_PIG_RANCH'];
							issueCommand(COMMAND.BUILD_PIG_RANCH, [i-1, j, 1]);
							break;
						}
					} else {
						if (gameState.coins[1] > PRICES['BUILD_TOWER']) {
							gameState.AI.towers++;
							gameState.coins[1] -= PRICES['BUILD_TOWER'];
							issueCommand(COMMAND.BUILD_TOWER, [i-1, j, 1]);
							break;
						}
					}
				}
				if ((gameState.AI.farms+gameState.AI.fences)/(gameState.AI.ranches+gameState.AI.towers+1) > 10) break;
			} 
			if (!isLandOccupied(i, j, 1, 1)) {
				empty = true;
				if (Math.random() < 0.8) {
					if(Math.random() < 0.7){
						if (gameState.AI.farms < 200 && gameState.coins[1] > PRICES['BUILD_FARM']) {

							gameState.AI.farms++;
							gameState.coins[1] -= PRICES['BUILD_FARM'];
							issueCommand(COMMAND.BUILD_FARM, [i, j, 1]);
							break;
						}
					} else if (Math.random() < 0.001) {
						if (gameState.coins[1] > PRICES['BUILD_FENCE']) {
							gameState.AI.fences++;
							gameState.coins[1] -= PRICES['BUILD_FENCE'];
							issueCommand(COMMAND.BUILD_FENCE, [i, j, 1]);
							break;
						}
					}
				}
			}
			if (empty) break;
		}
		if(empty) break;
	}
}


function updateFogOfWar() {
	gameState.map.fogOfWar.fill(0);

	function checkAndSet(r, c) {
		for (var k = r-4; k <= r+4; ++k) {
			for (var m = c-4; m <= c+4; ++m) {
				if (k < 0 || m < 0 || k >= gameState.map.height || m >= gameState.map.width) continue;
				var dist = Math.abs(k-r)+Math.abs(m-c);
				if (dist > 6) continue;
				var idx = k * gameState.map.width + m;
				gameState.map.fogOfWar[idx] = (dist <= 4 ? CONSTANTS.CLOSE_BY : (gameState.map.fogOfWar[idx] == 0 ? CONSTANTS.FAR_AWAY : gameState.map.fogOfWar[idx]));
			}
		}
	}

	for (var i = 0; i < gameState.flocks.length; ++i) {
		if (gameState.flocks[i].team != clientState.team) continue;
		var r = Math.floor(gameState.flocks[i].pos.y/gameState.map.size);
		var c = Math.floor(gameState.flocks[i].pos.x/gameState.map.size);
		checkAndSet(r, c);
	}

	for (var i = 0; i < gameState.deadflocks.length; ++i) {
		if (gameState.deadflocks[i].team != clientState.team) continue;
		var r = Math.floor(gameState.deadflocks[i].pos.y/gameState.map.size);
		var c = Math.floor(gameState.deadflocks[i].pos.x/gameState.map.size);
		checkAndSet(r, c);
	}

	for (var i = 0; i < gameState.buildings.length; ++i) {
		if (gameState.buildings[i].team != clientState.team) continue;
		var size = gameState.buildings[i].size/gameState.map.size;
		for (var r = gameState.buildings[i].row; r < gameState.buildings[i].row + size; ++r) {
			for(var c = gameState.buildings[i].col; c < gameState.buildings[i].col + size; ++c) {
				checkAndSet(r, c);
			}
		}
	}

	for (var i = 0; i < gameState.deadbuildings.length; ++i) {
		if (gameState.deadbuildings[i].team != clientState.team) continue;
		var size = gameState.deadbuildings[i].size/gameState.map.size;
		for (var r = gameState.deadbuildings[i].row; r < gameState.deadbuildings[i].row + size; ++r) {
			for(var c = gameState.deadbuildings[i].col; c < gameState.deadbuildings[i].col + size; ++c) {
				checkAndSet(r, c);
			}
		}
	}

	var throne = gameState.thrones[clientState.team];
	var size = throne.size/gameState.map.size;
	for (var r = throne.row; r < throne.row + size; ++r) {
		for(var c = throne.col; c < throne.col + size; ++c) {
			checkAndSet(r, c);
		}
	}

}


function renderFogOfWar() {
	var g = clientState.g;
	var r = Math.max(0, Math.floor(clientState.camera[1]/gameState.map.size));
	var c = Math.max(0, Math.floor(clientState.camera[0]/gameState.map.size));
	var width = Math.floor(clientState.canvas.width/gameState.map.size)+1;
	var height = Math.floor(clientState.canvas.height/gameState.map.size)+1;
	g.save();
	g.translate(-clientState.camera[0], -clientState.camera[1]);
	

	for (var row = r; row <= r+height; ++row) {
		for (var col = c; col <= c+width; ++col) {
			if (row < 0 || col < 0 || row >= gameState.map.height || col >= gameState.map.width) continue;
			var idx = row * gameState.map.width + col;
			if (gameState.map.fogOfWar[idx] != CONSTANTS.CLOSE_BY) {
				var x = col*gameState.map.size;
				var y = row*gameState.map.size;
				if (gameState.map.fogOfWar[idx] == 0) {
					g.fillStyle = 'rgba(0,0,0,0.6)';
				} else {
					g.fillStyle = 'rgba(0,0,0,0.4)';
				}
				g.fillRect(x, y, gameState.map.size, gameState.map.size);
			}
		}
	}

	g.restore();
}