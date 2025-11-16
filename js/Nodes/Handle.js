class Handle {
	constructor(start, end, parent, isInput) {
		this.attach = null;
		this.isInput = isInput;
		this.parent = parent;
		this.start = start;
		this.lineIsHighlight = false;
		this.end = end;
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
		let start = toWorld(this.start);
		let end = toWorld(this.end);
		if (this.isInput) {
			var tmp = start;
			start = end;
			end = tmp;
		}
		var mouseAt = false;
		var shouldCheck = true;
		if (this === _selHandle && _hovHandle && this.canAttachTo(_hovHandle))
			mouseAt = drawLine(ctx, start, toWorld(_hovHandle.end), color, width, 0, shouldCheck, hasOutput);
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
			if (this.attach) this.attach.end = end;
		}
	}

	static get(pos = _mouse.pos, self = null) {
		for (let i = _nodes.length - 1; i >= 0; i--){
			const g = _nodes[i];
			if (g.handles === undefined || !g.handles)
				continue;
			for (const l of g.handles) {
				if (self === l) continue;
				let we = toWorld(l.end);
				if (Math.abs((we[0] + 4) - pos[0]) <= 16 && Math.abs((we[1] + 4) - pos[1]) <= 16)
					return l.attach ? l.attach : l;
				let ws = toWorld(l.start);
				if (Math.abs((ws[0] + 4) - pos[0]) <= 16 && Math.abs((ws[1] + 4) - pos[1]) <= 16)
					return l.attach ? l.attach : l;
			}
		}
		return null;
	}
}
