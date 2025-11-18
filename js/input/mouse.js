class Mouse{
	constructor(pos) {
		this.pos = pos;
		this.world = pos;
		this.delta = [0, 0];
		this.clickDur = 0;
		this.clickStart = 0;
		this.moved = false;
		this.clicked = false;
		this.dbClicked = false;
		this.pressed = false;
		this.dragging = false;
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
	_mouse.pressed = false;
	_mouse.dbClicked = false;
});

function setHoverElements() {
	_hovElement = Node.get();
	if (_hovLine) _hovHandle = _hovLine;
	else _hovHandle = Handle.get(_mouse.pos, _selHandle, false);
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
	if (_renameNode && _renameProperty === 'output' && _mouse.pressed) {
		const DEC = 3;
		const val = Number(_renameNode.output) || 0;
		const speed = (Math.min(_renameNode.maxValue, 100) - Math.max(_renameNode.minValue, -100)) * .005;
		var add = _mouse.delta[0] * speed;
		if (_input.keys['shift']) add = _mouse.delta[0];
		const newVal = val + add;
		var nv = Number(newVal.toFixed(DEC));
		nv = clamp(nv, _renameNode.minValue, _renameNode.maxValue);
		_renameNode[_renameProperty] = nv;
		const prv = _renameNode;
		Node.setProperty();
		_renameNode = prv;
		_renameAll = false;
	}
	else if (_selElement) {
		const next = [_selElement.pos[0] + _mouse.delta[0], _selElement.pos[1] + _mouse.delta[1]];
		_selElement.place(next);
	}
}

window.addEventListener("mousemove", (e) => {
	const p = getMousePosCanvas(e);
	_mouse.delta[0] = p[0] - _mouse.pos[0];
	_mouse.delta[1] = p[1] - _mouse.pos[1];
	_mouse.moved = true;
	_mouse.pos = p;
	_mouse.world = [p[0] + _camera.scroll[0], p[1] + _camera.scroll[1]];
	if (_paused)
		return;
	setHoverElements();
	if (_selBox.active) _selBox.update();
	_mouse.delta = [0, 0];
	_mouse.moved = true;
	setTimeout(() => _mouse.moved = false, 50);
	document.body.style.cursor = (_selElement || _selHandle) ? "grab" :  (_hovElement || _hovHandle) ? "move" : "default";
});
