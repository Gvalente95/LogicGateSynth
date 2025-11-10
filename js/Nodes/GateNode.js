class GateNode extends Node{
	constructor(type, pos) {
		super(pos, [100, 50]);
		this.color = "rgba(212, 57, 57, 1)";
		this.output = 0;
		this.type = type;
		let hl = 20;
		this.handles = [];
		this.handles.push(new Handle([pos[0] - hl, pos[1] + this.size[1] * .2], [pos[0] - hl, pos[1] + this.size[1] * .2], this, true));
		this.handles.push(new Handle([pos[0] - hl, pos[1] + this.size[1] * .8], [pos[0] - hl, pos[1] + this.size[1] * .8], this, true));
		this.handles.push(new Handle([pos[0] + this.size[0] + hl, pos[1] + this.size[1] * .5], [pos[0] + this.size[0] + hl, pos[1] + this.size[1] * .5], this, false));
	}

	setOutput(v) {
   		v = v ? 1 : 0;
		if (this.output === v) return;
		this.output = v;
		for (const h of this.handles)
			if (!h.isInput) h.attach?.parent?.updateOutput?.();
	}
	
	updateOutput() {
		if (this._isComputing) return;
		this._isComputing = true;
		const a = this.handles[0]?.attach?.parent?.output ? 1 : 0;
		const b = this.handles[1]?.attach?.parent?.output ? 1 : 0;
		let out = 0;
		switch (this.type) {
			case 'OR':   out = (a || b) ? 1 : 0; break;
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
		super.render(ctx, this.pos, this.size, this === _hovElement || this === _selElement ? "red" : this.color);
		drawLine(ctx, this.handles[0].start, [this.pos[0], this.pos[1] + 10], "white", 2, 0);
		drawLine(ctx, this.handles[1].start, [this.pos[0], this.pos[1] + this.size[1] - 10], "white", 2, 0);
		drawLine(ctx, this.handles[2].start, [this.pos[0] + this.size[0], this.pos[1] + this.size[1] * .5], "white", 2, 0);
		drawText(ctx, [this.pos[0] + this.size[0] / 2, this.pos[1] - 20], this.type);
	}
}
