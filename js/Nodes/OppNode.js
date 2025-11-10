class OppNode extends Node{
	constructor(type, pos, value = 0) {
		super(pos, [50, 50]);
		this.color = "rgba(21, 81, 210, 1)";
		this.output = value;
		this.type = type;
		this.initHandles(this.pos, this.size);
	}

	initHandles(pos, size) {
		this.handles = [];
		let hl = 20;
		let hPos = [pos[0] + size[0] + hl, pos[1] + size[1] / 2];
		this.handles.push(new Handle(hPos, hPos, this, false));
		if (this.type === 'NEG' || this.type === "FLOOR")
			this.handles.push(new Handle([pos[0] - hl, pos[1] + size[1] / 2], [pos[0] - hl, pos[1] + size[1] / 2], this, true));
		else {
			this.handles.push(new Handle([pos[0] - hl, pos[1] + size[1] * .2], [pos[0] - hl, pos[1] + size[1] * .2], this, true));
			this.handles.push(new Handle([pos[0] - hl, pos[1] + size[1] * .8], [pos[0] - hl, pos[1] + size[1] * .8], this, true));
		}
	}

	updateOutput() {
		const ops = {
			NEG: (a) => a > 0 ? -a : a,
			FLOOR:  (a)   => Math.floor(a),
			ADD:  (a, b)   => a + b,
			SUB:  (a, b)   => a - b,
			SCALE:(a, b)   => a * b,
			DIV:  (a, b)   => a === 0 || b === 0 ? 0 : a / b,
			POW: (a, b) => Math.pow(a, b),
		};
		const fn = ops[this.type];
		if (!fn) return this.setOutput(0);
		const ins = this.handles.slice(1, 3).map(h => h.attach?.parent?.output ?? 0);
		const result = fn.length === 1 ? fn(ins[0] ?? 0) : fn(ins[0] ?? 0, ins[1] ?? 0);
		this.setOutput(result);
	}


	setOutput(v){	
		if (this.output === v) return;
		this.output = v;
		this.handles[0].attach?.parent?.updateOutput?.();
	}
	render(ctx, pos = this.pos, size = this.size) {
		super.render(ctx, pos, size);
		drawLine(ctx, [pos[0] + size[0], pos[1] + size[1] / 2], [pos[0] + size[0] + 20, pos[1] + size[1] / 2]);
		if (this.handles.length === 2)
			drawLine(ctx, [pos[0], pos[1] + size[1] * .5], [pos[0] - 20, pos[1] + size[1] * .5]);
		if (this.handles.length === 3) {
			drawLine(ctx, [pos[0], pos[1] + size[1] * .2], [pos[0] - 20, pos[1] + size[1] * .2]);
			drawLine(ctx, [pos[0], pos[1] + size[1] * .8], [pos[0] - 20, pos[1] + size[1] * .8]);
		}
		drawText(ctx, [this.pos[0] + this.size[0] / 2, this.pos[1] - 20], this.type);
	}
}
