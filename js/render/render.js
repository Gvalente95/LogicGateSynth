function render() {
	if (_hovLine) _hovLine = null;
	if (_NcStack.length) renderNcUi();
	else {
		if (bgrImg) ctx.drawImage(bgrImg, -_canvas.width * .2 - _camera.scroll[0] * .1, -_canvas.height * .2 - _camera.scroll[1] * .1, _canvas.width * 1.4, _canvas.height * 1.4);
		else ctx.clearRect(0, 0, _canvas.width, _canvas.height);
		for (const g of _nodes)
				g.render(ctx);
	}
	if (_selBox.active)
		_selBox.render();
	_menu.render(ctx);
	if (_debug && _hovElement) {
		const n = _hovElement;
		var p = [n.pos[0] + n.size[0] + 20, n.pos[1]];
		const bgrClr = 'rgba(255, 255, 255, 0.75)';
		drawText(ctx, [p[0], p[1]], n.pos, 'black', bgrClr, 24, false);
		p[1] += 34;
		for (const h of n.handles) {
			const inpTxt = h.isInput ? "< INP" : "OUTP > ";
			const attachTxt = h.attach ? h.attach.parent.type : "(none)";
			if (h.isInput)
				drawText(ctx, [p[0], p[1]], attachTxt + " " + inpTxt, 'black', bgrClr, 24, false);
			else
				drawText(ctx, [p[0], p[1]], inpTxt + " " + attachTxt, 'black', bgrClr, 24, false);
			p[1] += 34;
		}
	}
}

function renderNcUi() {
	ctx.fillStyle = "rgba(3, 31, 29, 1)";
	ctx.fillRect(0, 0, _canvas.width, _canvas.height);
	const nc = _NcStack[_NcStack.length - 1];
	drawText(ctx, [80, 80], "X", "white", "rgba(255, 3, 3, 1)", 40);
	drawText(ctx, [_canvas.width / 2, 200], nc.name, "white", null, 80);
	if (pointInRect(_mouse.pos, [50, 50], [60, 60])) {
		document.body.style.cursor = "pointer";
		if (_mouse.clicked)
			prevNcStack();
	}
	for (let i = 0; i < nc.innerInHandles.length; i++) {
		const h = nc.innerInHandles[i];
		const n = nc.ins[i];
		var start = h.start;
		var end = [h.isInput ? 0 : _canvas.width, h.end[1]];
		var clr = "rgba(255, 255, 255, 0.05)";
		if (n && n.output) clr = "rgba(255, 255, 255, 1)";
		drawLine(ctx, toWorld(start), toWorld(end), clr, 8, 0);
	}
	for (const h of nc.innerOutHandles) {
		var start = h.start;
		var end = [h.isInput ? 0 : _canvas.width, h.end[1]];
		var clr = "rgba(49, 184, 45, 0.05)";
		if (h.parent.output) clr = "rgba(255, 255, 255, 1)";
		drawLine(ctx, toWorld(start), toWorld(end), clr, 8, 0);
	}
	for (const s of _nodes) {s.render(ctx, s.pos, s.size, s.color);}
}
