function render() {
	ctx.clearRect(0, 0, _canvas.width, _canvas.height);
	for (const g of _nodes) {
		g.render(ctx);
	}
	if (_selBox) {
		renderSelBox();
	}
	_menu.render(ctx);
}

function renderSelBox() {
	clearSelGroup();
	let startX = _mouse.pos[0] < _selBox[0] ? _mouse.pos[0] : _selBox[0];
	let startY = _mouse.pos[1] < _selBox[1] ? _mouse.pos[1] : _selBox[1];
	let w = Math.abs(_mouse.pos[0] - _selBox[0]);
	let h = Math.abs(_mouse.pos[1] - _selBox[1]);
	ctx.fillStyle = "rgba(105, 125, 208, 0.27)";
	ctx.fillRect(startX, startY, w, h);

	for (const e of _nodes) {
		if (rectCollide(e.pos, e.size, [startX, startY], [w, h])) {
			_selGroup.push(e);
			e.highlight(true);
		}
	}
}