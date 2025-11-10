class NodeContainer extends Node{
	constructor(pos, name, type, system = []){
		super(pos,[120,100]);
		this.name = name;
			this.type = type;
			this.output = 0;
		this.color = "rgba(35, 180, 168, 1)";
		this.system = system;
		this._inner = [];
		this._inSrc = [];
		this._outSink = null;
		this.inspecting = false;
		this.preview = [];
		this.handles = [];
		this.initHandles();
	}

	initHandles() {
		const hs = this.system.flatMap(e => e?.handles ?? []);
		const ins = hs.filter(h => h?.isInput && !h.attach);
		const outs = hs.filter(h => h && !h.isInput && !h.attach);
		this.handles = [];
		let inY = this.pos[1] + 20;
		for (const _ of ins) {
			const p = [this.pos[0] - 20, inY];
			this.handles.push(new Handle(p, p, this, true));
			inY += 24;
		}
		let outY = this.pos[1] + 20;
		for (const _ of outs) {
			const p = [this.pos[0] + this.size[0] + 20, outY];
			this.handles.push(new Handle(p, p, this, false));
			outY += 24;
		}
		this.ins = ins;
		this.outs = outs;
	}

	render(ctx) {
		super.render(ctx);
		const pos = this.pos;

		drawText(ctx, [pos[0] + this.size[0] / 2, pos[1] - 18], this.name);

		let inStart = [pos[0], pos[1] + 20];
		let inEnd = [pos[0] - 20, pos[1] + 20];
		for (let i = 0; i < this.ins.length; i++) {
			let y = i * 24;
			drawLine(ctx, [inStart[0], inStart[1] + y], [inEnd[0], inEnd[1] + y], "white", 2);
		}
		let outStart = [pos[0] + this.size[0], pos[1] + 20];
		let outEnd = [pos[0] + this.size[0] + 20, pos[1] + 20];
		for (let i = 0; i < this.outs.length; i++) {
			let y = i * 24;
			drawLine(ctx, [outStart[0], outStart[1] + y], [outEnd[0], outEnd[1] + y], "white", 2);
		}
	}



	updateOutput(){

	}

	onInspect(){

	}
}
