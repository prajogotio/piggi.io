// characters
// asset and gameState conscious

function Pig(pos, team) {
	FlockPrite.call(this, 100, pos, 32);
	this.setSprite(this.STANDBY, new Sprite(asset.images[addSuffix("asset/pig_standby.png", team)], 0, 0, 128, 128, 4, 20));
	this.setSprite(this.MOVING, new Sprite(asset.images[addSuffix("asset/pig_running.png", team)], 0, 0, 128, 128, 6, 12));
	this.setSprite(this.ATTACKING, new Sprite(asset.images[addSuffix("asset/pig_angry.png", team)], 0, 0, 128, 128, 3, 20));
	this.setSprite(this.EATING, new Sprite(asset.images[addSuffix("asset/pig_eating.png", team)], 0, 0, 128, 128, 2, 30));
	this.setSprite(this.DEAD, new Sprite(asset.images[addSuffix("asset/pig_death.png", team)], 0, 0, 128, 128, 1, 100));
	this.sprites[this.ATTACKING].autoReset = false;
	this.team = team;
	this.healthPoints = this.maxHealthPoints = 200;
	this.strength = 30;
}

Pig.prototype = Object.create(FlockPrite.prototype);

Pig.prototype.update = function(flock, map) {
	FlockPrite.prototype.update.call(this, flock, map);
	if (!this.isAlive) {
		return;
	}
	if (this.lockOnTarget == null) {
		var enemy = this.team+1;
		enemy %= 2;
		this.setLockOnTarget(gameState.thrones[enemy], map);
	}
}


function Boar(pos, team) {
	FlockPrite.call(this, 100, pos, 32);
	this.setSprite(this.STANDBY, new Sprite(asset.images[addSuffix("asset/boar_standby.png", team)], 0, 0, 128, 128, 2, 30));
	this.setSprite(this.MOVING, new Sprite(asset.images[addSuffix("asset/boar_running.png", team)], 0, 0, 128, 128, 10, 12));
	this.setSprite(this.ATTACKING, new Sprite(asset.images[addSuffix("asset/boar_attacking.png", team)], 0, 0, 128, 128, 3, 20));
	this.setSprite(this.EATING, new Sprite(asset.images[addSuffix("asset/boar_eating.png", team)], 0, 0, 128, 128, 2, 30));
	this.setSprite(this.DEAD, new Sprite(asset.images[addSuffix("asset/boar_death.png", team)], 0, 0, 128, 128, 1, 100));
	this.sprites[this.ATTACKING].autoReset = false;
	this.team = team;
	this.healthPoints = this.maxHealthPoints = 1200;
	this.strength = 180;
	this.ATTACK_DELAY = 60;
}

Boar.prototype = Object.create(Pig.prototype);



function Tower(row, col, team) {
	Building.call(this, 128, 640);
	this.setSprite(this.NORMAL, new Sprite(asset.images[addSuffix("asset/tower.png",team)], 0, 0, 128, 128, 2, 25));
	this.setSprite(this.DEAD, new Sprite(asset.images[addSuffix("asset/tower_death.png",team)], 0, 0, 128, 128, 1, 100));
	registerBuildingToMap(this, gameState.map, row, col);

	this.type = this.ATTACK_TYPE;
	this.attackRadius = 300;
	this.ATTACK_DELAY = 200/CONSTANTS.SCALER;
	this.healthPoints = this.maxHealthPoints = 500;
	this.strength = 80;
	this.team = team;
	this.MAX_INTERACTION = 12;

	this.weapon = Arrow;
}

Tower.prototype = Object.create(Building.prototype);

Tower.prototype.update = function(flock, map) {
	Building.prototype.update.call(this, flock, map);
	if (!this.isAlive) return;
	if (this.updateCount - this.lastAttack <= this.ATTACK_DELAY) {
		return;
	}
	this.lastAttack = this.updateCount;

	for (var i = 0; i < flock.length; ++i) {
		if (!flock[i].isAlive) continue;
		if (flock[i].team == this.team) continue;
		if (flock[i].pos.minus(this.pos).length() <= this.attackRadius) {
			gameState.arrows.push(new this.weapon(this, flock[i], this.strength));
			return;
		}
	}
}


function Castle(row, col, team) {
	Building.call(this, 128, 640);
	this.setSprite(this.NORMAL, new Sprite(asset.images[addSuffix("asset/castle.png",team)], 0, 0, 128, 128, 2, 25));
	this.setSprite(this.DEAD, new Sprite(asset.images[addSuffix("asset/castle_death.png",team)], 0, 0, 128, 128, 1, 100));
	registerBuildingToMap(this, gameState.map, row, col);

	this.type = this.ATTACK_TYPE;
	this.attackRadius = 400;
	this.ATTACK_DELAY = 120/CONSTANTS.SCALER;
	this.strength = 250;
	this.healthPoints = this.maxHealthPoints = 1800;
	this.team = team;
	this.MAX_INTERACTION = 12;

	this.weapon = Javelin;
}

Castle.prototype = Object.create(Tower.prototype);


function Farm(row, col, team) {
	Building.call(this, 64, 128);

	this.setSprite(this.NORMAL, new Sprite(asset.images[addSuffix("asset/rice_field.png",team)], 0, 0, 128, 128, 6, 200));
	this.setSprite(this.DEAD, new Sprite(asset.images[addSuffix("asset/rice_field_death.png",team)], 0, 0, 128, 128, 1, 100));
	registerBuildingToMap(this, gameState.map, row, col);
	// farm is non blocking entity
	gameState.map.data[row*gameState.map.width+col] = 1;

	this.team = team;

	this.interactionType = this.EAT_TYPE;
	this.SHOW_HEALTHBAR = false;
	this.healthPoints = 200;
	this.PERSISTENCE = 300/CONSTANTS.SCALER;
	this.MAX_INTERACTION = 2;
	this.radius = 0;

	this.coinsToHarvest = 1;
	this.lastProduce = 0;
	this.PRODUCE_DELAY = 200/CONSTANTS.SCALER;
}

Farm.prototype = Object.create(Building.prototype);

Farm.prototype.createSnapshot = function() {
	PigRanch.prototype.createSnapshot.call(this);
}


Farm.prototype.rollback = function() {
	PigRanch.prototype.rollback.call(this);
}

Farm.prototype.update = function(flock, map) {
	Building.prototype.update.call(this, flock, map);
	if (this.updateCount-this.lastProduce <= this.PRODUCE_DELAY) {
		return;
	}
	this.lastProduce = this.updateCount;
	gameState.coins[this.team] += this.coinsToHarvest;
}


function Garden(row, col, team) {
	Building.call(this, 64, 128);

	this.setSprite(this.NORMAL, new Sprite(asset.images[addSuffix("asset/super_rice_field.png",team)], 0, 0, 128, 128, 6, 200));
	this.setSprite(this.DEAD, new Sprite(asset.images[addSuffix("asset/rice_field_death.png",team)], 0, 0, 128, 128, 1, 100));
	registerBuildingToMap(this, gameState.map, row, col);
	// farm is non blocking entity
	gameState.map.data[row*gameState.map.width+col] = 1;

	this.team = team;

	this.interactionType = this.EAT_TYPE;
	this.SHOW_HEALTHBAR = false;
	this.healthPoints = 550;
	this.PERSISTENCE = 300/CONSTANTS.SCALER;
	this.MAX_INTERACTION = 2;
	this.radius = 0;

	this.coinsToHarvest = 3;
	this.PRODUCE_DELAY = 250/CONSTANTS.SCALER;
}

Garden.prototype = Object.create(Farm.prototype);



function Fence(row, col, team) {
	Building.call(this, 64, 100);
	this.setSprite(this.NORMAL, new Sprite(asset.images[addSuffix("asset/fence.png",team)], 0, 0, 128, 128, 1, 100));
	this.setSprite(this.DEAD, new Sprite(asset.images[addSuffix("asset/fence_death.png",team)], 0, 0, 128, 128, 1, 100));
	registerBuildingToMap(this, gameState.map, row, col);

	this.team = team;
	this.type = this.ATTACK_TYPE;
	this.activity = this.PASSIVE;
	this.SHOW_HEALTHBAR = false;
	this.PERSISTENCE = 20;
	this.healthPoints = 100;
	this.MAX_INTERACTION = 2;
}

Fence.prototype = Object.create(Building.prototype);

Fence.prototype.canInteract = function(flock) {
	// can't attack fence if it is not blocking the pig
	// from reaching the target
	return Building.prototype.canInteract.call(this, flock) && (flock.lockOnTarget != null && flock.targetStack.length == 0);
}


function Wall(row, col, team) {
	Building.call(this, 64, 100);
	this.setSprite(this.NORMAL, new Sprite(asset.images[addSuffix("asset/super_fence.png",team)], 0, 0, 128, 128, 1, 100));
	this.setSprite(this.DEAD, new Sprite(asset.images[addSuffix("asset/fence_death.png",team)], 0, 0, 128, 128, 1, 100));
	registerBuildingToMap(this, gameState.map, row, col);

	this.team = team;
	this.type = this.ATTACK_TYPE;
	this.activity = this.PASSIVE;
	this.SHOW_HEALTHBAR = false;
	this.PERSISTENCE = 20;
	this.healthPoints = this.maxHealthPoints = 400;
	this.MAX_INTERACTION = 2;
}

Wall.prototype = Object.create(Fence.prototype);


function PigRanch(row, col, team) {
	Building.call(this, 128, 300);
	this.setSprite(this.NORMAL, new Sprite(asset.images[addSuffix("asset/pig_ranch.png",team)], 0, 0, 128, 128, 2, 100));
	this.setSprite(this.DEAD, new Sprite(asset.images[addSuffix("asset/pig_ranch_death.png",team)], 0, 0, 128, 128, 1, 100));
	registerBuildingToMap(this, gameState.map, row, col);


	this.team = team;
	this.type = this.ATTACK_TYPE;
	this.healthPoints = 350;
	this.maxHealthPoints = 350;
	this.MAX_INTERACTION = 8;

	this.lastProduce = 0;
	this.PRODUCE_DELAY = 600/CONSTANTS.SCALER;
	this.pigsPerProduction = 1;

	this.product = Pig;
	this.productPrice = 20;
}

PigRanch.prototype = Object.create(Building.prototype);

PigRanch.prototype.update = function(flock, map) {
	Building.prototype.update.call(this, flock, map);
	if (!this.isAlive) return;
	if (this.updateCount - this.lastProduce <= this.PRODUCE_DELAY) {
		return;
	}
	if (gameState.coins[this.team] < this.productPrice) return;
	gameState.coins[this.team] -= this.productPrice;
	this.lastProduce = this.updateCount;

	var exitPoints = [[2, 0], [2, 1], 
					  [-1, 0], [-1, 1],
					  [0, -1], [1, -1],
					  [0, 2], [1, 2]];
	for (var i = 0; i < exitPoints.length; ++i) {
		var r = exitPoints[i][0] + this.row;
		var c = exitPoints[i][1] + this.col;
		if (r < 0 || c < 0 || r >= gameState.map.height || c >= gameState.map.width) continue;
		if (gameState.map.data[r*gameState.map.width+c] == 1) {
			for (var j = 0; j < this.pigsPerProduction; ++j) {
				gameState.flocks.push(new this.product(new Vec2((c+0.5)*gameState.map.size, (r+0.5)*gameState.map.size), this.team));
			}
			return;
		}
	}
}

PigRanch.prototype.createSnapshot = function() {
	Building.prototype.createSnapshot.call(this);
	this.snapshot.lastProduce = this.lastProduce;

}

PigRanch.prototype.rollback = function () {
	Building.prototype.rollback.call(this);
	this.lastProduce = this.snapshot.lastProduce;
}

function PigHQ(row, col, team) {
	Building.call(this, 128, 300);
	this.setSprite(this.NORMAL, new Sprite(asset.images[addSuffix("asset/pig_hq.png",team)], 0, 0, 128, 128, 2, 100));
	this.setSprite(this.DEAD, new Sprite(asset.images[addSuffix("asset/pig_hq_death.png",team)], 0, 0, 128, 128, 1, 100));
	registerBuildingToMap(this, gameState.map, row, col);


	this.team = team;
	this.type = this.ATTACK_TYPE;
	this.healthPoints = this.maxHealthPoints = 1250;
	this.MAX_INTERACTION = 8;

	this.lastProduce = 0;
	this.PRODUCE_DELAY = 600/CONSTANTS.SCALER;
	this.pigsPerProduction = 1;

	this.product = Boar;
	this.productPrice = 200;
}

PigHQ.prototype = Object.create(PigRanch.prototype);

function Throne(row, col, team) {
	Building.call(this, 128, 1000);
	this.setSprite(this.NORMAL, new Sprite(asset.images[addSuffix("asset/throne.png",team)], 0, 0, 128, 128, 6, 40));
	this.setSprite(this.DEAD, new Sprite(asset.images[addSuffix("asset/throne.png",team)], 0, 0, 128, 128, 1, 100));
	registerBuildingToMap(this, gameState.map, row, col);

	this.team = team;
	this.type = this.ATTACK_TYPE;
	this.SHOW_HEALTHBAR = true;
	this.PERSISTENCE = 700;
	this.healthPoints = this.maxHealthPoints = 10000;
	this.MAX_INTERACTION = 10000;
	this.destroyable = false;
}

Throne.prototype = Object.create(Building.prototype);



function Arrow(owner, target, damage) {
	FlockPrite.call(this, 0, owner.pos.copy(), 32);
	this.setSprite(this.STANDBY, new Sprite(asset.images[addSuffix("asset/arrow.png",owner.team)], 0, 0, 128, 128, 1, 100));
	this.setSprite(this.DEAD, new Sprite(asset.images[addSuffix("asset/arrow_death.png",owner.team)], 0, 0, 128, 128, 1, 100));
	this.target = target;
	this.owner = owner;
	this.startPoint = owner.pos.copy();
	this.destination = target.pos.copy();
	this.damage = damage;
	this.orientation = getAngle(target.pos.minus(owner.pos));
	this.updateCount = 0;
	this.maxDelta = 40/CONSTANTS.SCALER;
}

Arrow.prototype = Object.create(FlockPrite.prototype);

Arrow.prototype.update = function() {
	this.updateCount++;
	if (!this.isAlive) {
		return;
	}
	//visual effect
	var DEAD_MARGIN = 17;
	this.pos = this.destination.minus(this.startPoint).times(Math.min(this.updateCount,this.maxDelta-DEAD_MARGIN)/(this.maxDelta-DEAD_MARGIN)).plus(this.startPoint);
	
	if (this.updateCount+DEAD_MARGIN >= this.maxDelta) {
		this.state = this.DEAD;
		this.target.receiveDamage(this.damage);
		// damage delivered
		this.damage = 0;
	}
	if (this.updateCount >= this.maxDelta) {
		this.isAlive = false;
		this.timeOfDeath = this.updateCount;
	}
}

Arrow.prototype.createSnapshot = function() {
	FlockPrite.prototype.createSnapshot.call(this);
	this.snapshot.updateCount = this.updateCount;
}

Arrow.prototype.rollback = function() {
	FlockPrite.prototype.rollback.call(this);
	this.updateCount = this.snapshot.updateCount;
}


function Javelin(owner, target, damage) {
	FlockPrite.call(this, 0, owner.pos.copy(), 45);
	this.setSprite(this.STANDBY, new Sprite(asset.images[addSuffix("asset/javelin.png",owner.team)], 0, 0, 128, 128, 1, 100));
	this.setSprite(this.DEAD, new Sprite(asset.images[addSuffix("asset/javelin_death.png",owner.team)], 0, 0, 128, 128, 1, 100));
	this.target = target;
	this.owner = owner;
	this.startPoint = owner.pos.copy();
	this.destination = target.pos.copy();
	this.damage = damage;
	this.orientation = getAngle(target.pos.minus(owner.pos));
	this.updateCount = 0;
	this.maxDelta = 40/CONSTANTS.SCALER;
}

Javelin.prototype = Object.create(Arrow.prototype);



function registerBuildingToMap(building, map, row, col) {
	var size = Math.floor(building.size/map.size);
	for (var i = 0; i < size;++i){
		for (var j = 0; j < size; ++j) {
			map.data[(row+i)*map.width+col+j] = 0;
			map.entry[(row+i)*map.width+col+j] = building;
		}
	}
	building.pos.x = (col+size/2)*map.size;
	building.pos.y = (row+size/2)*map.size;
	building.row = row;
	building.col = col;
	map.lastUpdated = gameState.timestep;
}


function removeBuildingFromMap(building, map) {
	var size = Math.floor(building.size/map.size);
	for (var i = 0; i < size;++i){
		for (var j = 0; j < size; ++j) {
			map.data[(building.row+i)*map.width+building.col+j] = 1;
			map.entry[(building.row+i)*map.width+building.col+j] = null;
		}
	}
	map.lastUpdated = gameState.timestep;
}




function addSuffix(name, team) {
	if (team != clientState.team) {
		name += '/b';
	}
	return name;
}


