function Sprite(imgBuffer, offsetX, offsetY, width, height, numOfFrames, deltaPerFrame) {
	this.DELTA_PER_FRAME = Math.ceil(deltaPerFrame / CONSTANTS.SCALER);
	this.delta = 0;
	this.currentFrame = 0;
	this.numOfFrames = numOfFrames;
	this.imgBuffer = imgBuffer;
	this.offsetX = offsetX;
	this.offsetY = offsetY;
	this.width = width;
	this.height = height;
	this.autoReset = true;
}

Sprite.prototype.render = function(g, renderWidth, renderHeight) {
	var frameOffsetX = this.offsetX + this.currentFrame * this.width;
	g.drawImage(this.imgBuffer, frameOffsetX, this.offsetY, this.width, this.height, 0, 0, renderWidth, renderHeight);
}

Sprite.prototype.update = function() {
	if (this.delta >= this.DELTA_PER_FRAME) {
		this.delta = 0;
		this.currentFrame++;
		if (this.autoReset) {
			this.currentFrame %= this.numOfFrames;
		} else {
			this.currentFrame = Math.min(this.currentFrame, this.numOfFrames-1);
		}
	}
	this.delta++;
}

Sprite.prototype.reset = function() {
	this.delta = 0;
	this.currentFrame = 0;
}

Sprite.prototype.createSnapshot = function() {
	this.snapshot = {
		delta : this.delta,
		currentFrame : this.currentFrame,
	}
}

Sprite.prototype.rollback = function() {
	this.delta = this.snapshot.delta;
	this.currentFrame = this.snapshot.currentFrame;
}