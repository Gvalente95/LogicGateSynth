class Mouse{
	constructor(pos) {
		this.pos = pos;
		this.delta = [0, 0];
		this.clickDur = 0;
		this.clickStart = 0;
		this.clicked = false;
		this.pressed = false;
	}
}

_canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
});

window.addEventListener("contextmenu", (e) => {
	e.preventDefault();
	_menu.toggleContextMenu(_mouse.pos, null);
});

window.addEventListener("mousedown", (e) => {
	_mouse.pos = getMousePosCanvas(e);
	if (_paused)
		return;
	if (_selGroup && _input.keys['alt'])
		duplicateSelGroup();
	else if (_hovElement && !_selElement)
		_selElement = _hovElement;
	else if (_hovHandle && !_selHandle) {
		_hovHandle.dettach();
		_selHandle = _hovHandle;
		clearSelGroup();
	}
	if (!_selElement && !_selHandle && !_menu.contextMenuActive && e.button === 0)
		_selBox = _mouse.pos;
	_mouse.pressed = true;
	_mouse.clickStart = performance.now();
	_mouse.clicked = true;
	setTimeout(() => _mouse.clicked = false, 150);
});

window.addEventListener("mouseup", (e) => {
	if (_paused)
		return;
	_mouse.clickDur = performance.now() - _mouse.clickStart;
	let wasClick = _mouse.clickDur < 200;

	if (e.button !== 2)
		_menu.toggleContextMenu(false);
	if (_selBox) _selBox = null;
	if (_selHandle && !wasClick) {
		let other = Handle.get(_selHandle.end, _selHandle);
		if (!other || !_selHandle.tryAttachTo(other)) {
			_menu.toggleContextMenu([_mouse.pos[0] - 60, _mouse.pos[1]]);
			_hangHandle = _selHandle;
		}
	}
	if (_selElement && wasClick && e.button !== 2) {
		if (_selElement.type === "BOOL")
			_selElement.setOutput(!_selElement.output ? 1 : 0);
		else if (_selElement.type === "VALUE")
			setNodeOutput(_selElement);
	}
	_selElement = null;
	_selHandle = null;
	_mouse.pressed = false;
	_mouse.clicked = false;
});

window.addEventListener("mousemove", (e) => {
	const p = getMousePosCanvas(e);
	_mouse.delta[0] = p[0] - _mouse.pos[0];
	_mouse.delta[1] = p[1] - _mouse.pos[1];
	_mouse.pos = p;
	if (_paused)
		return;
	_hovElement = Node.get();
	_hovHandle = Handle.get(_mouse.pos, _selHandle);
	if (!_selBox && _selGroup && _mouse.pressed) {
		for (const e of _selGroup) {
			if (e !== _selElement)
				e.place([e.pos[0] + _mouse.delta[0], e.pos[1] + _mouse.delta[1]]);
		}
	}
	if (_selHandle)
		_selHandle.place(_selHandle.start, _mouse.pos);
	else if (_selElement) {
		const next = [_selElement.pos[0] + _mouse.delta[0], _selElement.pos[1] + _mouse.delta[1]];
		_selElement.place(next);
	}
	_mouse.delta = [0, 0];

	document.body.style.cursor = (_selElement || _selHandle) ? "grab" :  (_hovElement || _hovHandle) ? "move" : "default";
});


function _copyFactory(e){
	const cls = e.constructor?.name;
	if (cls === "GateNode") return new GateNode(e.type, [...e.pos]);
	if (cls === "OppNode") return new OppNode(e.type, [...e.pos]);
	try { return new e.constructor(e.type, [...e.pos]); } catch(e1){
		try { return new e.constructor([...e.pos]); } catch(e2){ return null; }
	}
}

function getNodesCopy(nodes){
	const map = new Map();
	const out = [];
	for (const e of nodes){
		const ne = _copyFactory(e);
		if (!ne) continue;
		ne.output = e.output;
		ne.size = [...e.size];
		if (ne.place) ne.place([...e.pos]);
		map.set(e, ne);
		out.push(ne);
	}
	for (const e of _nodes){
		const ne = map.get(e);
		if (!e.handles || !ne?.handles) continue;
		for (let i = 0; i < e.handles.length; i++){
			const h = e.handles[i];
			if (!h || !h.attach || h.isInput) continue;
			const other = h.attach;
			const op = other.parent;
			if (!map.has(op)) continue;
			const nh = ne.handles[i];
			const nop = map.get(op);
			const j = op.handles.indexOf(other);
			const noh = nop.handles[j];
			nh?.tryAttachTo?.(noh);
		}
	}
	for (const n of out) n.updateOutput?.();
	return out;
}


function duplicateSelGroup(displace = null) {
	newSelGroup = getNodesCopy(_selGroup);
	for (const e of newSelGroup) {
		e.highlight(true);
		_nodes.push(e);
		if (displace)
			e.place([e.pos[0] + displace[0], e.pos[1] + displace[1]]);
	}
	clearSelGroup();
	_selGroup = newSelGroup;
	duplicateSel();
}

function duplicateSel(displace = null) {
	const toCopy = _hovElement ? _hovElement : _selElement;
	if (!toCopy)
		return;
	const Type = toCopy.constructor;
	const e = new Type(toCopy.type, toCopy.pos);
	e.output = toCopy.output;
	if (displace)
		e.place([e.pos[0] + displace[0], e.pos[1] + displace[1]]);
	_selElement = e;
	_nodes.push(_selElement);
}