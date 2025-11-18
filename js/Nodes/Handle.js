class Handle {
	constructor(start, end, parent, isInput) {
		this.attach = null;
		this.lineIsHighlight = false;
		this.isInput = isInput;
		this.parent = parent;
		this.start = start;
		this.end = end;
		this.size = [40, 40];
		this.pos = this.start;
		this.relStart = [start[0] - parent.pos[0], start[1] - parent.pos[1]];
		this.relEnd = [end[0] - parent.pos[0], end[1] - parent.pos[1]];
	}

	getCurEnd() { return [this.parent.pos[0] + this.relEnd[0], this.parent.pos[1] + this.relEnd[1]] }
	getCurStart() { return [this.parent.pos[0] + this.relStart[0], this.parent.pos[1] + this.relStart[1]] }

	canAttachTo(other) {
		return (this.parent !== other.parent && this.isInput !== other.isInput);
	}

	dettach() {
		const other = this.attach;
		if (!other) return;
		this.attach = null;
		other.attach = null;
		this.place();
		other.place();
		this.parent?.updateHandles();
		other.parent?.updateHandles();
		this.parent?.updateInput?.();
		other.parent?.updateInput?.();
	}

	tryAttachTo(other) {
		if (!this.canAttachTo(other)) return false;
		if (this.attach) this.dettach();
		if (other.attach) other.dettach();
		this.attach = other;
		other.attach = this;
		this.place(this.start, other.start);
		this.parent?.updateHandles();
		other.parent?.updateHandles();
		this.parent?.updateInput?.();
		other.parent?.updateInput?.();
		return true;
	}

	render(ctx, color = "white", width = this.lineIsHighlight ? 8 : 4) {
		if (this === _selHandle) color = addColor(color, "white", .4);
		var hasOutput = true;
		if ((!this.isInput && !this.parent.output) || (this.isInput && !this.attach?.parent?.output)) {
			color = setAlpha(color, ".4");
			hasOutput = false;
		}
		let start = toScrn(this.start);
		let end = toScrn(this.end);
		if (this.isInput) {
			var tmp = start;
			start = end;
			end = tmp;
		}
		var mouseAt = false;
		var shouldCheck = true; // = _mouse.moved
		if (this === _selHandle && _hovHandle && this.canAttachTo(_hovHandle))
			mouseAt = drawLine(ctx, start, toScrn(_hovHandle.end), color, width, 0, shouldCheck, hasOutput);
		else if (!(this === _hovHandle && _selHandle && _selHandle.canAttachTo(this))){
			let handleSize = this.attach !== null ? 0 : (_hovHandle === this && !_selHandle) ? 3 : 2;
			mouseAt = drawLine(ctx, start, end, color, width, handleSize, shouldCheck, hasOutput);
		}
		if (_selBox.active) {
			if (mouseAt) _selBox.tryPushLine(this);
			else _selBox.tryClearNode(this);
		}
		if (mouseAt) {
			if (_input.keys["x"] || _input.keys["backspace"]) {
				if (_NcStack.length) announce("Can't delete while inspecting");
				else this.dettach(this.attach);
			}
			_hovLine = this;	
		}
	}

	highlightLine(newHighlight) {
		this.lineIsHighlight = newHighlight;
	}

	update() {
		this.parent?.updateInput?.();
		this.attach?.parent?.updateInput?.();
	}

	place(start = this.getCurStart(), end = this.getCurEnd()) {
		if (this.end == end && this.start == start) {
			this.parent?.updateInput?.(this);
			this.attach?.parent?.updateInput?.(this);
		}
		else {
			this.start = start;
			this.end = end;
			this.pos = this.start;
			if (this.attach) this.attach.end = end;
		}
	}

	// static get(pos = _mouse.world, self = null, getAttach = false) {
	// 	for (let i = _nodes.length - 1; i >= 0; i--){
	// 		const g = _nodes[i];
	// 		if (g.handles === undefined || !g.handles)
	// 			continue;
	// 		var radX = 16;
	// 		var radY = 16;
	// 		for (const l of g.handles) {
	// 			if (self === l) continue;
	// 			let we = l.end;
	// 			if (Math.abs((we[0] + 4) - pos[0]) <= radX && Math.abs((we[1] + 4) - pos[1]) <= radY)
	// 				return (l.attach && getAttach) ? l.attach : l;
	// 			let ws = l.start;
	// 			if (Math.abs((ws[0] + 4) - pos[0]) <= radX && Math.abs((ws[1] + 4) - pos[1]) <= radY)
	// 				return (l.attach && getAttach) ? l.attach : l;
	// 		}
	// 	}
	// 	return null;
	// }

	static get(pos = _mouse.pos, self = null, getAttach = false) {
		for (let i = _nodes.length - 1; i >= 0; i--) {
			const g = _nodes[i];
			if (!g.handles) continue;

			const radius = 16 * _scale;

			for (const h of g.handles) {
				if (self === h) continue;

				const endScreen = toScrn(h.end);
				if (Math.abs(endScreen[0] - pos[0]) <= radius &&
					Math.abs(endScreen[1] - pos[1]) <= radius)
					return (h.attach && getAttach) ? h.attach : h;

				const startScreen = toScrn(h.start);
				if (Math.abs(startScreen[0] - pos[0]) <= radius &&
					Math.abs(startScreen[1] - pos[1]) <= radius)
					return (h.attach && getAttach) ? h.attach : h;
			}
		}
		return null;
	}
}
