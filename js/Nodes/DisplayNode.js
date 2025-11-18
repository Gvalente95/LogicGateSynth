class DisplayNode extends Node{
	constructor(type, pos, value = 0) {
		super(pos, DisplayNode.getSize(type));
		this.color = 'rgba(67, 115, 155, 0.47)';
		this.output = value;
		this.type = type;
		this.len = DisplayNode.getOutputLen(type);
		this.initHandles();
		this.updateHandles();
		this.grid = null;
	}

	static getSize(type) { let n = DisplayNode.getOutputLen(type); return ([5 + n * 30, 5 + n * 30]); }
	static getOutputLen(type) { return (type.slice(6)); }

	initHandles(pos = this.pos, size = this.size) {
		this.handles = [];
		let hl = 20 * _scale;
		let inPos = [pos[0] - hl, pos[1] + hl / 2 + 3];
		for (let i = 0; i < this.len; i++){
			var h = new Handle(inPos, inPos, this, true);
			h.crd = [0, i];
			this.handles.push(h);
			inPos[1] += 30 * _scale;
		}
		if (this.len > 1) {
			inPos = [pos[0] + hl / 2 + 3, pos[1] + this.size[1] + hl];
			var h = new Handle([pos[0] + hl, pos[1] - hl], [pos[0] + hl, pos[1] - hl], this, true);
			this.handles.push(h);
		}
		
		let hPos = [pos[0] + size[0] + hl, pos[1] + size[1] / 2];
		this.handles.push(new Handle(hPos, hPos, this, false));
	}

	updateInput() {
		if (this._isComputing) return;
		this.updateHandles();
		this._isComputing = true;
		const a = this.handles[0]?.attach?.parent?.output ? 1 : 0;
		let out = 0;
		switch (this.type) {
			default: out = a; break;
		}
		this._isComputing = false;
		this.setOutput(out);
	}

	updateOutputFromGrid(grid) {
		if (!grid) { this.setOutput(0); return; }
		let out = 0;
		const W = this.len, H = this.len;
		for (let y = 0; y < H; y++) {
			for (let x = 0; x < W; x++) {
				if (grid[y][x]) {
					const k = y * W + x;
					out |= (1 << k);
				}
			}
		}
		this.setOutput(out);
	}

	update() {
		this.updateInput();
	}

	render(ctx, pos = this.pos, color = this.color, error = false) {
		super.render(ctx, toWorld(pos), this.size, color, error);
		const W = this.len, H = this.len;
		const grid = Array.from({length:H}, ()=> Array(W).fill(0));
		this.grid = grid;
		var master = this.handles[this.handles.length - 2]?.attach?.parent?.output;
		if (master != null) {
			var isBad = false;
			if (!isFinite(master) || isNaN(master)) {
				isBad = true; master = 0;
			}
			const m = BigInt(Math.floor(master));
			for (let y = 0; y < H; y++) {
				for (let x = 0; x < W; x++) {
					if (isBad) {grid[y][x] = 1; continue;}
					const k = BigInt(y*W + x);
					grid[y][x] = Number((m >> k) & 1n);
				}
			}
		}
		else {
			const rows = this.handles.filter(h => h.crd && h.crd[0] === 0);
			for (const h of rows) {
				const y = h.crd[1];
				const mask = (h.attach?.parent?.output ?? 0) | 0;
				for (let x = 0; x < W; x++) grid[y][x] = (mask >> x) & 1;
			}
			const cols = this.handles.filter(h => h.crd && h.crd[1] === 0 && h.crd[0] !== 0);
			for (const h of cols) {
				const x = h.crd[0];
				const mask = (h.attach?.parent?.output ?? 0) | 0;
				for (let y = 0; y < H; y++) grid[y][x] |= (mask >> y) & 1;
			}
		}

		const p = toWorld(this.pos);
		for (let y = 0; y < H; y++) {
			for (let x = 0; x < W; x++) {
				ctx.fillStyle = grid[y][x] ? "white" : "black";
				let size = 20 * _scale;
				ctx.fillRect(p[0] + 6 + x * 30 * _scale, p[1] + 6 + y * 30 * _scale, size, size);
			}
		}
		if (this.handles[this.handles.length - 1].attach)
			this.updateOutputFromGrid(grid);
	}
}
