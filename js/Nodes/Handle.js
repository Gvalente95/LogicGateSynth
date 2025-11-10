class Handle {
	constructor(start, end, parent, isInput) {
		this.attach = null;
		this.isInput = isInput;
		this.parent = parent;
		this.start = start;
		this.end = end;
		this.relStart = [start[0] - parent.pos[0], start[1] - parent.pos[1]];
		this.relEnd = [end[0] - parent.pos[0], end[1] - parent.pos[1]];
	}

	getCurEnd() { return [this.parent.pos[0] + this.relEnd[0], this.parent.pos[1] + this.relEnd[1]] }
	getCurStart() { return [this.parent.pos[0] + this.relStart[0], this.parent.pos[1] + this.relStart[1]] }

	dettach(attach = this.attach) {
		this.attach = null;
		this.place();
		attach?.dettach();
		this.parent?.updateOutput?.();
		attach?.parent?.updateOutput?.();
	}

	render(ctx, color = "black", width = 2) {
		if (isPosBetween(_mouse.pos, this.start, this.end, 12)) {
			if (_input.keys["x"] || _input.keys["backspace"]) {
				this.dettach(this.attach);
			}
			width = 6;
		}
		if (this === _selHandle && _hovHandle && this.canAttachTo(_hovHandle)) {
			drawLine(ctx, this.start, _hovHandle.end, color, width, 0);
		}
		else if (this === _hovHandle && _selHandle && _selHandle.canAttachTo(this))
			return;
		else {
			let handleSize = this.attach !== null ? 0 : (_hovHandle === this && !_selHandle) ? 3 : 2;
			drawLine(ctx, this.start, this.end, color, width, handleSize);
		}
	}

	canAttachTo(other) {
		return (this.parent !== other.parent && this.isInput !== other.isInput);
	}

	tryAttachTo(other) {
		if (!this.canAttachTo(other)) return false;
		if (other.attach)
			other.attach.dettach(other);
		other.attach = this;
		this.attach = other;
		this.place(this.start, other.start);
		this.parent?.updateOutput?.();
		other.parent?.updateOutput?.();
		return true;
	}

	place(start = this.getCurStart(), end = this.getCurEnd()) {
		this.start = start;
		this.end = end;
		if (this.attach) this.attach.end = end;
		this.parent?.updateOutput?.();
		this.attach?.parent?.updateOutput?.();
	}

	static get(pos = _mouse.pos, self = null) {
		for (const g of _nodes) {
			if (g.handles === undefined || !g.handles)
				continue;
			for (const l of g.handles)
				if (self !== l && Math.abs((l.end[0] + 4) - pos[0]) <= 16 && Math.abs((l.end[1] + 4) - pos[1]) <= 16)
					return l;
		}
		return null;
	}
}
