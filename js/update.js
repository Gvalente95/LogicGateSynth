let _obstaclesDirty = true;
let _screenObstacles = [];

function markObstaclesDirty() {
	_obstaclesDirty = true;
}

function updateScreenObstacles() {
	if (!_obstaclesDirty) return;
	_screenObstacles.length = 0;
	for (let i = 0; i < _nodes.length; i++) {
		const e = _nodes[i];
		_screenObstacles.push({
			x: e.pos[0] - _camera.scroll[0],
			y: e.pos[1] - _camera.scroll[1],
			w: e.size[0],
			h: e.size[1],
		});
	}
	_obstaclesDirty = false;
}

var _fps = 0; var _tick = 0;
var _timeSinceFrame = 0; var _now = performance.now();
function updateTime() {
	_now = performance.now();
	_tick++;
	if (_now - _timeSinceFrame >= 1000) {
		_fps = _tick;
		_tick = 0;
		_timeSinceFrame = _now;
	}
	_frame++;
}

function update() {
	updateTime();
	_mouse.update();
	for (const n of _nodes) n.update();
	updateScreenObstacles();
	render();
	_mouse.moved = false;
	requestAnimationFrame(update);
}
