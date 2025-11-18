
function renderDebugElement(n, p, bgrClr = 'rgba(255, 255, 255, 0.75)') {
	if (n.constructor.name === 'Handle') {
		drawText(ctx, [p[0], p[1]], `parent: ${n.parent.type} start[${n.start} end[${n.end}]`, 'black', bgrClr, 24, false);
		drawText(ctx, [p[0], p[1] + 33], `attach: ${n.attach ? n.attach.parent.type : "null"}`, 'black', bgrClr, 24, false);
		if (n.lineIsHighlight) drawText(ctx, [p[0], p[1] + 66], "isHighlight = true", 'black', bgrClr, 24, false);
		return;
	}
	drawText(ctx, [p[0], p[1]], n.type + " [x" + n.pos[0] + ", y" + n.pos[1] + "]" + " Output: " + n.output, 'black', bgrClr, 24, false);
	const sepH = 33;
	p[1] += sepH;
	for (let i = n.handles.length - 1; i >= 0; i--) {
		const h = n.handles[i];
		const inpTxt = h.isInput ? "> INP" : "OUTP(" + h.parent.output +  ") >";
		const attachTxt = h.attach ? ((h.attach.parent.name !== undefined ? h.attach.parent.name : h.attach.parent.type) + ": " + h.attach.parent.output) : "(none)";
		if (h.isInput)
			drawText(ctx, [p[0], p[1]], attachTxt + " " + inpTxt, 'black', bgrClr, 24, false);
		else
			drawText(ctx, [p[0], p[1]], inpTxt + " " + attachTxt, 'black', bgrClr, 24, false);
		p[1] += sepH;
	}
	if (n.sys !== undefined) {
		p[1] += 5;
		p[0] += sepH;
		const bgClr = 'rgba(181, 244, 255, 0.5)';
		for (const sn of n.sys) {
			var endP = renderDebugElement(sn, p, bgClr);
			p[1] = endP[1] + 10;
		}
	}
	return p;
}

function renderNcUi() {
	ctx.fillStyle = "rgba(3, 31, 29, 1)";
	ctx.fillRect(0, 0, _canvas.width, _canvas.height);
	const nc = _NcStack[_NcStack.length - 1];
	drawText(ctx, [80, 80], "X", "white", "rgba(255, 3, 3, 1)", 40);
	var pos = [_canvas.width / 2, 200];
	var textSize = 80;

	pos[0] -= drawText(ctx, pos, _NcStack[_NcStack.length - 1].name, "white", null, textSize);
	for (let i = _NcStack.length - 2; i >= 0; i--){
		textSize = Math.max(textSize - 15, 10);
		pos[0] -= drawText(ctx, pos, _NcStack[i].name + " > ", "white", null, textSize);
	}

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
		drawLine(ctx, toScrn(start), toScrn(end), clr, 8, 0);
	}
	for (const h of nc.innerOutHandles) {
		var start = h.start;
		var end = [h.isInput ? 0 : _canvas.width, h.end[1]];
		var clr = "rgba(49, 184, 45, 0.05)";
		if (h.parent.output) clr = "rgba(255, 255, 255, 1)";
		drawLine(ctx, toScrn(start), toScrn(end), clr, 8, 0);
	}
	for (const s of _nodes) s.render(ctx);
}

function fillGrid() {
	ctx.fillStyle = 'rgba(148, 195, 226, 1)';
	ctx.fillRect(0, 0, _canvas.width, _canvas.height);
	const sqSize = 150;
	const w = _canvas.width / sqSize;
	const h = _canvas.height / sqSize;

	ctx.fillStyle = 'rgba(17, 17, 17, 0.34)';
	const ww = 1;
	for (let x = -w; x < w * 2; x++){
		ctx.fillRect(x * sqSize - _camera.scroll[0], 0, ww, _canvas.height);
	}
	for (let y = -h; y < h * 2; y++){
		ctx.fillRect(0, y * sqSize - _camera.scroll[1], _canvas.width, ww);
	}
}

function renderNodes() {
	for (const g of _nodes) g.renderHandles(ctx);
	for (const g of _nodes) g.render(ctx);
}

function render() {
	if (_hovLine) {
		_hovLine = null;
	}
	if (_NcStack.length) renderNcUi();
	else {
		if (bgrImg) ctx.drawImage(bgrImg, -_canvas.width * .2 - _camera.scroll[0] * .1, -_canvas.height * .2 - _camera.scroll[1] * .1, _canvas.width * 1.4, _canvas.height * 1.4);
		else fillGrid();
		renderNodes();
	}
	if (_selBox.active)
		_selBox.render();
	_menu.render(ctx);
	if (_debug) {
		var n = _hovElement || _hovHandle;
		if (n) renderDebugElement(n, toScrn([n.pos[0] + n.size[0] + 40, n.pos[1]]));
	}
	drawText(ctx, [_canvas.width - 50, _canvas.height - 50], "FPS: " + _fps, 'grey');
	if (_debug) {
		drawText(ctx, [500, 500], `MOUSE P${_mouse.pos} W${_mouse.world} S${_mouse.screen}`, 'white', 'black', 24, true);
	}
	// drawBezierLine([0, 0], [800, 800], [0, 800]);
}