function MenuBar() {
	// gameState conscious
	// clientState conscious
	this.currentState = 'BUILD';
	this.icons = [
	];

	var types = [
		TowerIcon,
		RanchIcon,
		FarmIcon,
		FenceIcon,
		UpgradeIcon,
		CastleIcon,
		PigHQIcon,
		GardenIcon,
		WallIcon,
		DeselectIcon,
	]
	this.ICON_SIZE = 80;
	for (var i = 0; i < 2; ++i) {
		for (var j = 0; j < 5; ++j) {
			this.icons.push(new types[i*5+j]((this.ICON_SIZE+2)*j+(this.ICON_SIZE/2)+3, (this.ICON_SIZE+2)*i+3+this.ICON_SIZE/2, this.ICON_SIZE));
		}
	}
	this.tower = this.icons[0];
	this.ranch = this.icons[1];
	this.farm = this.icons[2];
	this.fence = this.icons[3];
	this.upgrade = this.icons[4];
	this.castle = this.icons[5];
	this.pighq = this.icons[6];
	this.garden = this.icons[7];
	this.wall = this.icons[8];
	this.deselect = this.icons[9];

	this.coinInfoSize = 40;
	this.width = (this.ICON_SIZE+2)*5+4;
	this.height = (this.ICON_SIZE+2)*2+4;
	this.updatePosition();

}

MenuBar.prototype.updatePosition = function() {
	var screenWidth = clientState.canvas.width;
	var screenHeight = clientState.canvas.height;

	this.x = screenWidth/2;
	this.y = screenHeight-this.height/2;
}

MenuBar.prototype.render = function(g) {
	g.save();
	this.updatePosition();

	g.translate(this.x-this.width/2, this.y-this.height/2);

	g.fillStyle = "rgba(0,0,0,0.2)";
	g.fillRect(0, 0, this.width, this.height);

	// icons
	for (var i = 0; i < this.icons.length; ++i) {
		this.icons[i].update();
		this.icons[i].render(g);
	}

	// coins
	var coinSize = 40;
	var cW = coinSize+coinSize*0.5*4+4+4;
	var cH = coinSize+4;
	g.translate(-cW, this.height-cH);
	g.fillRect(0,0,cW,cH);
	g.drawImage(asset.images['asset/pig_coin.png'],0,0,128,128,2,2,coinSize,coinSize);
	g.translate(coinSize+4, 0);
	g.fillStyle = "rgba(255,245,200,0.5)";
	g.fillRect(1,3,cW-coinSize-4-2,cH-6);
	g.translate(4,4);
	var c = generateNumber(gameState.coins[clientState.team], 32);
	g.translate(cW-coinSize-8-c.width-coinSize*0.5/2,0);
	c.render(g);
	g.restore();
}	

MenuBar.prototype.containsPoint = function(x, y) {
	return this.x-this.width/2 <= x && x <= this.x+this.width/2
		&& this.y-this.height/2 <= y && y <= this.y+this.height/2;
}

MenuBar.prototype.onclick = function(x, y) {
	// coordinate relative to corner of menubar
	var mx = x-(this.x-this.width/2);
	var my = y-(this.y-this.height/2);
	for (var i = 0; i < this.icons.length; ++i) {
		if (this.icons[i].containsPoint(mx,my)) {
			this.icons[i].onclick();
			return;
		}
	}
}

MenuBar.prototype.reset = function() {
	for (var i = 0; i < this.icons.length; ++i) {
		this.icons[i].state = 'INACTIVE';
	}
	this.deselect.state = 'UNCLICKABLE';
}

function MenuIcon(asset, x, y, size) {
	this.sprite = new Sprite(asset, 0, 0, 128, 128, 1, 100);
	this.state = 'INACTIVE';
	// relative to menubar
	this.x = x;
	this.y = y;
	this.width = size;
	this.height = size;
	this.isLocked = false;
}

MenuIcon.prototype.render = function(g) {
	g.save();
	if (this.state == 'INACTIVE' ){
		g.fillStyle = "rgba(255,255,255,0.5)";
	} else if (this.state == 'ACTIVE') {
		g.fillStyle = "rgba(255,255,100,0.8)";
	}
	g.translate(this.x-this.width/2,this.y-this.height/2);
	g.fillRect(0,0,this.width,this.height);
	this.sprite.render(g, this.width, this.height);
	if (this.isLocked) {
		g.drawImage(asset.images["asset/locked_icon.png"], 0, 0, 128, 128, 0, 0, this.width, this.height);
	}
	if (this.state == 'UNCLICKABLE' || this.state == 'LOCKED') {
		g.fillStyle = "rgba(0,0,0,0.5)";
		g.fillRect(0,0,this.width,this.height);
	}



	g.restore();
}

MenuIcon.prototype.update = function() {

}

MenuIcon.prototype.containsPoint = function(x, y) {
	// x and y relative to menubar
	return MenuBar.prototype.containsPoint.call(this, x, y);
}

MenuIcon.prototype.onclick = function() {
	if (this.state == 'UNCLICKABLE' || this.state == 'LOCKED') return;
	for (var i = 0; i < clientState.menuBar.icons.length; ++i) {
		clientState.menuBar.icons[i].state = 'LOCKED';
	}
	clientState.menuBar.deselect.state = 'INACTIVE';
	this.state = 'ACTIVE';
}


function PriceMenuIcon(asset, x, y, size, commandType) {
	MenuIcon.call(this, asset, x, y, size);
	this.commandType = commandType;
	this.isAlive = true;
	this.buildingSize = 1;
}
PriceMenuIcon.prototype = Object.create(MenuIcon.prototype);
PriceMenuIcon.prototype.update = function() {
	if (this.state == 'LOCKED' || this.state == 'ACTIVE' || !this.isAlive) return;
	if (PRICES[this.commandType] <= gameState.coins[clientState.team]) {
		this.state = 'INACTIVE';
	} else {
		this.state = 'UNCLICKABLE';
	}
}
PriceMenuIcon.prototype.onclick = function() {
	MenuIcon.prototype.onclick.call(this);
	if (this.state == 'ACTIVE') {
		issueCommand(COMMAND.BUY, [clientState.team, COMMAND[this.commandType], PRICES[this.commandType], this.buildingSize]);
		clientState.menuBar.deselect.lockedCoins = PRICES[this.commandType];
	}
}

PriceMenuIcon.prototype.render = function(g) {
	MenuIcon.prototype.render.call(this, g);
	this.renderPrice(g, PRICES[this.commandType]);
}

PriceMenuIcon.prototype.renderPrice = function(g, price) {
	g.save();
	g.translate(this.x-this.width/2,this.y-this.height/2);
	var c = generateNumber(price, 14);
	g.translate(this.width-c.width-2, this.height-c.height-2);
	g.fillStyle = "rgba(0,0,0,0.5)";
	g.fillRect(0,0,c.width,c.height);
	c.render(g);
	g.translate(-16,0);
	g.fillRect(0,0,16,14);
	g.drawImage(asset.images["asset/pig_coin.png"],0,0,128,128,0,0,14,14);
	g.restore();
}


function TowerIcon(x, y, size) {
	PriceMenuIcon.call(this, asset.images["asset/tower_icon.png"], x, y, size, 'BUILD_TOWER');
	this.buildingSize = 2;
	this.tier = gameState.towerTier;
	this.tierCommand = 'UPGRADE_TOWER';
}
TowerIcon.prototype = Object.create(PriceMenuIcon.prototype);
TowerIcon.prototype.update = function() {
	if (clientState.menuBar.upgrade.state == 'ACTIVE') {
		if (this.tier[clientState.team]==2 || PRICES[this.commandType] > gameState.coins[clientState.team]) {
			this.state = 'UNCLICKABLE';
			return;
		}
		this.state = 'INACTIVE';
	} else {
		PriceMenuIcon.prototype.update.call(this);
	}
}
TowerIcon.prototype.onclick = function() {
	if (clientState.menuBar.upgrade.state == 'ACTIVE') {
		if (this.state == 'UNCLICKABLE') {
			return;
		}
		issueCommand(COMMAND[this.tierCommand], [clientState.team]);
		clientState.menuBar.reset();
	} else {
		PriceMenuIcon.prototype.onclick.call(this);
	}
}
TowerIcon.prototype.render = function(g) {
	if (clientState.menuBar.upgrade.state == 'ACTIVE') {
		MenuIcon.prototype.render.call(this, g);
		PriceMenuIcon.prototype.renderPrice.call(this, g, PRICES[this.tierCommand]);
	} else {
		PriceMenuIcon.prototype.render.call(this, g);
	}
}

function RanchIcon(x, y, size) {
	PriceMenuIcon.call(this, asset.images["asset/ranch_icon.png"], x, y, size, 'BUILD_PIG_RANCH');
	this.buildingSize = 2;
	this.tier = gameState.ranchTier;
	this.tierCommand = 'UPGRADE_PIG_RANCH';
}
RanchIcon.prototype = Object.create(PriceMenuIcon.prototype);
RanchIcon.prototype.update = function() {
	TowerIcon.prototype.update.call(this);
}
RanchIcon.prototype.onclick = function() {
	TowerIcon.prototype.onclick.call(this);
}
RanchIcon.prototype.render = function(g) {
	TowerIcon.prototype.render.call(this, g);
}


function FarmIcon(x, y, size) {
	PriceMenuIcon.call(this, asset.images["asset/farm_icon.png"], x, y, size, 'BUILD_FARM');
	this.buildingSize = 1;
}
FarmIcon.prototype = Object.create(PriceMenuIcon.prototype);


function FenceIcon(x, y, size) {
	PriceMenuIcon.call(this, asset.images["asset/fence_icon.png"], x, y, size, 'BUILD_FENCE');
	this.buildingSize = 1;
}
FenceIcon.prototype = Object.create(PriceMenuIcon.prototype);


function UpgradeIcon(x, y, size) {
	MenuIcon.call(this, asset.images["asset/upgrade_icon.png"], x, y, size);
}
UpgradeIcon.prototype = Object.create(MenuIcon.prototype);
UpgradeIcon.prototype.update = function() {
	if (this.state == 'ACTIVE' || this.state == 'LOCKED') {
		return;
	}
	if (gameState.towerTier[clientState.team]+gameState.ranchTier[clientState.team]>=4) {
		this.state = 'UNCLICKABLE';
		return;
	}
	var smaller = 1e9;
	if (gameState.towerTier[clientState.team]==1) {
		smaller = Math.min(smaller, PRICES['UPGRADE_TOWER']);
	}

	if (gameState.ranchTier[clientState.team]==1) {
		smaller = Math.min(smaller, PRICES['UPGRADE_PIG_RANCH']);
	}

	if (smaller > gameState.coins[clientState.team]) {
		this.state = 'UNCLICKABLE';
	} else {
		this.state = 'INACTIVE';
	}
}


function CastleIcon(x, y, size) {
	PriceMenuIcon.call(this, asset.images["asset/castle_icon.png"], x, y, size, 'BUILD_CASTLE');
	this.buildingSize = 2;
	this.isLocked = true;
}
CastleIcon.prototype = Object.create(PriceMenuIcon.prototype);
CastleIcon.prototype.update = function() {
	if (gameState.towerTier[clientState.team] == 1) {
		this.state = 'UNCLICKABLE';
		return;
	}
	this.isLocked = false;
	PriceMenuIcon.prototype.update.call(this);
}

function PigHQIcon(x, y, size) {
	PriceMenuIcon.call(this, asset.images["asset/pighq_icon.png"], x, y, size, 'BUILD_PIG_HQ');
	this.buildingSize = 2;
	this.isLocked = true;
}
PigHQIcon.prototype = Object.create(PriceMenuIcon.prototype);
PigHQIcon.prototype.update = function() {
	if (gameState.ranchTier[clientState.team] == 1) {
		this.state = 'UNCLICKABLE';
		return;
	}
	this.isLocked = false;
	PriceMenuIcon.prototype.update.call(this);
}

function GardenIcon(x, y, size) {
	PriceMenuIcon.call(this, asset.images["asset/garden_icon.png"], x, y, size, 'BUILD_GARDEN');
	this.buildingSize = 1;
	this.isLocked = true;
}
GardenIcon.prototype = Object.create(PriceMenuIcon.prototype);
GardenIcon.prototype.update = function() {
	if (gameState.ranchTier[clientState.team] == 1) {
		this.state = 'UNCLICKABLE';
		return;
	}
	this.isLocked = false;
	PriceMenuIcon.prototype.update.call(this);
}

function WallIcon(x, y, size) {
	PriceMenuIcon.call(this, asset.images["asset/wall_icon.png"], x, y, size, 'BUILD_WALL');
	this.buildingSize = 1;
	this.isLocked = true;
}
WallIcon.prototype = Object.create(PriceMenuIcon.prototype);
WallIcon.prototype.update = function() {
	if (gameState.towerTier[clientState.team] == 1) {
		this.state = 'UNCLICKABLE';
		return;
	}
	this.isLocked = false;
	PriceMenuIcon.prototype.update.call(this);
}

function DeselectIcon(x, y, size) {
	MenuIcon.call(this, asset.images["asset/deselect_icon.png"], x, y, size);
	this.state = 'UNCLICKABLE';
	this.lockedCoins = 0;
}
DeselectIcon.prototype = Object.create(MenuIcon.prototype);
DeselectIcon.prototype.onclick = function() {
	for (var i = 0; i < clientState.menuBar.icons.length; ++i) {
		clientState.menuBar.icons[i].state = 'INACTIVE';
	}
	this.state = 'UNCLICKABLE';
	issueCommand(COMMAND.DESELECT, [clientState.team, this.lockedCoins]);
	this.lockedCoins = 0;
	clientState.state = 'NONE';
}
DeselectIcon.prototype.update = function() {

}



function generateNumber(x, size) {
	var d = [];
	while (x>0) {
		d.push(x%10);
		x = Math.floor(x/10);
	}
	if(d.length == 0) d = [0];
	d.reverse();
	var dW = size*0.5;
	return {
		render : function(g) {
			for(var i=0;i<d.length;++i){
				g.drawImage(asset.images["asset/numbers.png"], d[i]*128, 0, 128, 128, i*dW-(size-dW)/2, 0, size, size);
			}
		},
		width : dW*d.length,
		height : size,
	}
}