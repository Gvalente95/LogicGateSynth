class GateNode extends Node{
	constructor(type, pos) {
		super(pos, [100, 50]);
		this.color = "rgba(212, 57, 57, 0.47)";
		this.output = 0;
		this.type = type;
		this.initHandles(pos);
		this.updateHandles();
	}

	initHandles(pos = this.pos, size = this.size) {
		let hl = 20 * _scale;
		this.handles = [];
		if (this.type === 'NOT')
			this.handles.push(new Handle([pos[0] - hl, pos[1] + size[1] * .5], [pos[0] - hl, pos[1] + size[1] * .5], this, true));
		else {
			this.handles.push(new Handle([pos[0] - hl, pos[1] + size[1] * .2], [pos[0] - hl, pos[1] + size[1] * .2], this, true));
			this.handles.push(new Handle([pos[0] - hl, pos[1] + size[1] * .8], [pos[0] - hl, pos[1] + size[1] * .8], this, true));
		}
		this.handles.push(new Handle([pos[0] + size[0] + hl, pos[1] + size[1] * .5], [pos[0] + size[0] + hl, pos[1] + size[1] * .5], this, false));
	}

	setOutput(v) {
		super.setOutput(v ? 1 : 0);
	}

	updateInput() {
		if (this._isComputing) return;
		this.updateHandles();
		this._isComputing = true;
		const a = this.handles[0]?.attach?.parent?.output ? 1 : 0;
		const b = this.handles[1]?.attach?.parent?.output ? 1 : 0;
		let out = 0;
		switch (this.type) {
			case 'NOT':   out = (a) ? 0 : 1; break;
			case 'OR': out = (a || b) ? 1 : 0; break;
			case 'AND':  out = (a && b) ? 1 : 0; break;
			case 'XOR':  out = (!!a ^ !!b) ? 1 : 0; break;
			case 'NOR':  out = (!a && !b) ? 1 : 0; break;
			case 'NAND': out = (!(a && b)) ? 1 : 0; break;
			case 'XNOR': out = (a === b) ? 1 : 0; break;
		}
		this._isComputing = false;
		this.setOutput(out);
	}

	render(ctx) {
		super.render(ctx, toScrn(this.pos), this.size, this === _hovElement || this === _selElement ? "red" : this.color);
	}
}
