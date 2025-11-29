class Mouse{
	constructor(pos) {
		this.pos = pos;
		this.world = pos;
		this.screen = pos;
		this.delta = [0, 0];
		this.clickDur = 0;
		this.clickStart = 0;
		this.moved = false;
		this.clicked = false;
		this.dbClicked = false;
		this.pressed = false;
		this.dragging = false;
	}

	update() {
		if (this.pressed && !_renameScroll) {
			const spd = 30; const brd = 10;
			var dx = 0, dy = 0;
			dx = (-(this.pos[0] <= brd) + (this.pos[0] >= _canvas.width - brd)) * spd;
			dy = (-(this.pos[1] <= brd) + (this.pos[1] >= _canvas.height - brd)) * spd;
			if (dx || dy) _camera.move(dx, dy);
		}
	}

	updatePos(p = this.pos) {
		if (p[0] === this.pos[0] && p[1] === this.pos[1]) {
			this.world = toWorld(this.pos);
			this.screen = toScrn(this.pos);
			return;
		}
		this.delta[0] = p[0] - this.pos[0];
		this.delta[1] = p[1] - this.pos[1];
		this.world = toWorld(this.pos);
		this.screen = toScrn(this.pos);
		this.pos = p;
		_mouse.moved = this.delta[0] || this.delta[1];
	}

	reset() {
		if (this.moved) {
			this.delta = [0, 0];
			this.moved = false;
		}
		this.clicked = false;
	}
}

_canvas.addEventListener('wheel', (e) => {
	e.preventDefault();
	if (_input.keys['shift'] || _input.keys['meta'] || _input.keys['alt'])
		setScale(clamp(_scale + -e.deltaY * .005, .4, 2));
	else
		_camera.move(e.deltaX, e.deltaY);
});

window.addEventListener("contextmenu", (e) => {
	e.preventDefault();
	if (!_hovElement && !_selBox.nodes.length)
		_selBox.reset();
	if (!_NcStack.length || _hovElement) {
		_menu.toggleContextMenu(_mouse.pos, _hovElement);
		_mouse.pressed = 0;
	}
});

window.addEventListener("mousedown", (e) => {
	if (_paused)
		return;
	_mouse.pos = getMousePosCanvas(e);
	if (_renameNode) Node.setProperty();
	if (_selBox.nodes && _input.keys['alt'])
		_selBox.dupplicateNodes([-20, -20]);
	else if (_hovElement) {
		if (!_selBox.contains(_hovElement))
			_selBox.reset();
		_nodes.splice(_nodes.indexOf(_hovElement), 1);
		_nodes.push(_hovElement);
		_selElement = _hovElement;
	}
	else if (_hovHandle && !_selHandle && !_NcStack.length && e.button === 0) {
		_hovHandle.dettach();
		_selHandle = _hovHandle;
	}
	if (!_selElement && !_selHandle && !_menu.contextMenuActive && e.button === 0)
		_selBox.init();
	else if ((_input.keys['shift'] || _input.keys['meta']) && _hovElement && e.button === 0) {
		if (!_selBox.tryClearNode(_hovElement))
			_selBox.tryPush(_hovElement);
	}
	_mouse.pressed = true;
	_mouse.clickStart = performance.now();
	_mouse.dbClicked = _mouse.clicked;
	_mouse.clicked = true;
	setTimeout(() => _mouse.clicked = false, 150);
});

window.addEventListener("mouseup", (e) => {
	if (_paused)
		return;
	_mouse.clickDur = performance.now() - _mouse.clickStart;
	let wasClick = _mouse.clickDur < 200;

	if (wasClick) {
		_au.playSound(_au.click);
	}
	if (wasClick && e.button !== 2 && !_input.keys['alt']) {
		let hov = _hovElement;
		if (hov) {
			_menu.toggleContextMenu(false);
			if (!_input.keys['shift']) {
				if (hov.type === "BOOL") {
					hov.setOutput(hov.output ? 0 : 1);
					for (const n of _selBox.nodes)
						if (n.type === 'BOOL') n.setOutput(n.output ? 0 : 1);
				}
				else if (hov.onInspect !== undefined)
					hov.onInspect();
				else if (_mouse.dbClicked && hov)
					_menu.toggleContextMenu(_mouse.pos, hov);
			}
		}
		else if (_menu.contextMenuActive)
			_menu.toggleContextMenu(false);
		// else _menu.toggleContextMenu(_mouse.pos);
	}
	_selBox.active = false;
	if (_selHandle && !wasClick) {
		var other = _hovHandle;
		if (!_hovHandle || !_selHandle.tryAttachTo(_hovHandle))
			other = Handle.get(_mouse.pos, _selHandle);
		if (!other || !_selHandle.tryAttachTo(other)) {
			_menu.toggleContextMenu([_mouse.pos[0] - 60, _mouse.pos[1]]);
			_hangHandle = _selHandle;
		}
	}
	_selHandle = null;
	_selElement = null;
	if (_renameScroll) {
		Node.setProperty();
		_renameScroll = false;
	}
	_mouse.pressed = false;
	_mouse.dbClicked = false;
});

function dragSelOutput() {
	const n = _renameNode;
	const p = _renameProperty;
	var newVal;
	if (n.isFloat) {
		const val = Number(n.output) || 0;
		const speed = (Math.min(n.maxValue, 100) - Math.max(n.minValue, -100)) * .005;
		var add = _mouse.delta[0] * speed;
		newVal = val + add;
		n[p] = clamp(Number(newVal.toFixed(3)), n.minValue, n.maxValue);
	}
	else {
		if (!_mouse.delta[0]) return;
		let step = (n.maxValue - n.minValue) * 0.01;
		let direction = Math.sign(_mouse.delta[0]);
		let amount = Math.max(1, Math.round(step));
		let add = direction * amount;
		let val = Number(n[p]) || 0;
		let newVal = val + add;
		n[p] = clamp(newVal, n.minValue, n.maxValue);
	}
	Node.setProperty();
	_renameNode = n;
	_renameAll = false;
	_renameScroll = true;
}

function setHoverElements() {
	_hovElement = Node.get();
	if (_renameHov) _hovHandle = null;
	else {
		if (_hovLine) _hovHandle = _hovLine;
		else _hovHandle = Handle.get(_mouse.pos, _selHandle, false);
	}
	_renameHov = null;
	if (_hovElement && _menu.contextMenuActive && _mouse.pressed)
		_menu.toggleContextMenu(null);
	if (!_selBox.active && _mouse.pressed && !_selHandle)
		_selBox.moveNodes();
	if (_selHandle) {
		markObstaclesDirty();
		const other = Handle.get(_mouse.pos, _selHandle, false);
		if (!other || !_selHandle.canAttachTo(other))
			_selHandle.place(_selHandle.start, _mouse.world);
		else _selHandle.place(_selHandle.start, other.start);
	}
	if (_renameNode && _renameProperty === 'output' && _mouse.pressed)
		dragSelOutput();
	else if (_selElement) {
		const next = [_selElement.pos[0] + _mouse.delta[0], _selElement.pos[1] + _mouse.delta[1]];
		_selElement.place(next);
	}
}

window.addEventListener("mousemove", (e) => {
	const p = getMousePosCanvas(e);
	_mouse.updatePos(p);
	if (_paused)
		return;
	setHoverElements();
	if (_selBox.active) _selBox.update();
	_mouse.moved = true;
	document.body.style.cursor = (_selElement || _selHandle) ? "grab" :  (_hovElement || _hovHandle) ? "move" : "default";
});
