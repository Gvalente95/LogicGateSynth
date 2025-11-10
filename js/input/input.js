class Input{
	constructor() {
		this.keys = {};
		this.lastKey = null;
	}
}

window.addEventListener("keydown", (e) => {
	_input.lastKey = e;
	let key = e.key.toLowerCase();
	_input.keys[key] = true;
	if (_paused)
		return;
	if (_selGroup.length) {
		if (key === 'd') {
			duplicateSelGroup([_mouse.pos[0] - _selGroup[0].pos[0], _mouse.pos[1] - _selGroup[0].pos[1]]);
		}
		else if (e.code === "Backspace" || key === 'x') {
			if (_hovElement)
				_hovElement.onRemove();
			removeSelGroup();
		}
	}
	if (key === 'g')
		griddify();
	_menu.clear();
	if (_input.keys["meta"] && key === 'a') {
		for (const e of _nodes) {
			if (_selGroup.includes(e))
				continue;
			e.highlight(true);
			_selGroup.push(e);
		}
	}
});

window.addEventListener("keyup", (e) => {
	_input.keys[e.key.toLowerCase()] = false;
});


function griddify() {
	for (const e of _nodes) {
		e.place(snapToGrid(e.pos, 200));
	}
}