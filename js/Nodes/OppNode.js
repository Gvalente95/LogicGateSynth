class OppNode extends Node{
	constructor(type, pos) {
		super(pos, [100, 25 * OppNode.getInputAmount(type)]);
		this.color = "rgba(21, 81, 210, 1)";
		this.output = 0;
		this.type = type;
		this.initHandles(this.pos, this.size);
		this.updateHandles();
	}

	static getInputAmount(type) {return (type === 'FLOOR' ? 1 : type === 'MINMAX' ? 3 : type === 'MAP' ? 3 : 2);}

	initHandles(pos = this.pos, size = this.size) {
		this.handles = [];
		let hl = 20 * _scale;
		let hPos = [pos[0] + size[0] + hl, pos[1] + size[1] / 2];
		this.handles.push(new Handle(hPos, hPos, this, false));
		let am = OppNode.getInputAmount(this.type);
		let sub = 1 / am;
		var letters = "ABCDEFGH";
		if (this.type === 'MAP') letters = ["A", "B", "BM"];
		if (this.type === 'MINMAX') letters = ["A", "MIN", "MAX"];
		if (this.type === 'MIN' || this.type === 'MAX') letters = ["A", this.type];
		for (var i = 0; i < am; i++){
			var h = new Handle([pos[0] - hl, pos[1] + size[1] * sub * i + hl / 2], [pos[0] - hl, pos[1] + size[1] * sub * i + hl / 2], this, true);
			h.label = letters[i];
			this.handles.push(h);
		}
	}
	
	updateInput() {
		this.updateHandles();
		const ops = {
			MOD:  (a,b)      => a % b,
			MIN:  (a,b)      => Math.min(a,b),
			MAX:  (a,b)      => Math.max(a,b),
			MINMAX:(a,b,c)   => clamp(a,b,c),
			FLOOR:(a)        => Math.floor(a),
			ADD:  (a,b)      => a + b,
			SUB:  (a,b)      => a - b,
			SCALE:(a,b)      => a * b,
			DIV:  (a,b)      => b === 0 ? 0 : a / b,
			POW:  (a,b)      => Math.pow(a,b),
			MAP:  (a,b,maxB) => maxB === 0 ? 0 : a * (b / maxB),
		};
		const fn = ops[this.type];
		if (!fn) return this.setOutput(0);

		const ins = this.ins ?? [];
		let a = ins[0]?.output, b = ins[1]?.output, c = ins[2]?.output;

		if (a) a = parseInt(a); if (b) b = parseInt(b); if (c) c = parseInt(c);
		switch (this.type) {
			case "ADD":
			case "SUB":
				if (a == null) a = 0;
				if (b == null) b = 0;
				break;
			case "DIV":
				if (a == null) a = 0;
				if (b == null) b = 1;
				break;
			case "MOD":
				if (a == null) a = 0;
				if (b == null) b = 2;
				break;
			case "MINMAX":
				if (b == null) b = 0;
				if (c == null) c = 1;
				if (a == null) a = b;
				break;
			case "FLOOR":
				if (a == null) a = 0;
				break;
			default:
				if (a == null) a = 1;
				if (b == null) b = 1;
				break;
		}

		const result = fn.length === 1 ? fn(a) : fn.length === 2 ? fn(a,b) : fn(a,b,c);
		this.setOutput(result);
	}

	update() {
		this.updateInput();
	}

	render(ctx, pos = this.pos, size = this.size) {
		super.render(ctx, toScrn(pos), size);
	}
}
