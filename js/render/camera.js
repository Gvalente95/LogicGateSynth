class Camera{
	constructor() {
		this.scroll = [0, 0];
		let limit = [_canvas.width * 2, _canvas.height * 2];
		this.minX = -limit[0];
		this.maxX = limit[0];
		this.minY = -limit[1];
		this.maxY = limit[1];
	}

	clearPosition() {
		this.scroll = [0, 0];
	}

	move(dx, dy) {
		this.scroll[0] = clamp(this.scroll[0] + dx, this.minX, this.maxX);
		this.scroll[1] = clamp(this.scroll[1] + dy, this.minY, this.maxY);
		markObstaclesDirty();
		_mouse.updatePos();
	}
}

function toScrn(pos) {
	let scrolledPos = [pos[0] - _camera.scroll[0], pos[1] - _camera.scroll[1]];
	return (scrolledPos);
}

function toWorld(pos) {
	let scrolledPos = [pos[0] + _camera.scroll[0], pos[1] + _camera.scroll[1]];
	return (scrolledPos);
}