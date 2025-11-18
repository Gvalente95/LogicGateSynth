class ValNode extends Node{
	constructor(type, pos) {
		super(pos, ValNode.getSize(type));
		this.color = "rgba(105, 189, 63, 1)";
		this.output = 0;
		this.initType(type);
		this.initHandles(this.pos, this.size);
		this.updateHandles();
		this.place();
	}

	initType(type) {
		this.type = type;
		if (type === 'RAND') {
			this.speed = 1;
			this.min = 0;
			this.max = 100;
			this.output = this.getValue();
		}
		else if (this.type === 'INCR') {
			this.start = 0;
			this.end = 100;
			this.speed = 0;
			this.output = this.start;
		}
		else if (type === 'NUM') {
			this.output = "0";
			Node.renameNodeProperty(this, "output", "1");
		}
	}

	static getSize(type)
	{
		let nIn = ValNode.getInputAmount(type);
		let nOut = ValNode.getOutputAmount(type);
		let max = Math.max(nIn, nOut);

		let W = 125 + (type === 'RAND' || type === 'INCR' ? 40 : 0);
		let H = 20 + max * 30;
		return [W, H];
	}
	static getOutputAmount(type) {return (1);}
	static getInputAmount(type) {return (type === 'INCR' ? 3 : type === 'TIME' ? 0 : type === 'RAND' ? 3 : 1);}

	initHandles(pos = this.pos, size = this.size) {
		this.handles = [];
		let hl = 20 * _scale;
		let hPos = [pos[0] + size[0] + hl, pos[1] + hl];
		let nOut = ValNode.getOutputAmount(this.type);
		for (let i = 0; i < nOut; i++){
			var h = new Handle(hPos, hPos, this, false);
			this.handles.push(h);
			hPos[1] += 30 * _scale;
		}
		let nIn = ValNode.getInputAmount(this.type);
		let sub = 1 / nIn;
		var labels = "";
		if (this.type === 'RAND') labels = ["SPD", "MIN", "MAX"];
		if (this.type === 'INCR') labels = ["SPD", "START", "END"];
		if (nIn === 1) {
			const p = [pos[0], pos[1] + size[1] / 2];
			this.handles.push(new Handle([p[0] - hl, p[1]], p, this, true));
			if (labels && labels[0]) h.label = labels[i];
			return;
		}
		for (var i = 0; i < nIn; i++){
			var h = new Handle([pos[0] - hl, pos[1] + size[1] * sub * i + hl / 2], [pos[0] - hl, pos[1] + size[1] * sub * i + hl / 2], this, true);
			if (labels && labels[i])
				h.label = labels[i];
			this.handles.push(h);
		}
	}

	getValue() {
		switch (this.type) {
			case 'RAND':
				if (!this.speed) return this.output;
				const val = Math.random() * (this.max - this.min + 1) + this.min;
				if (Number.isInteger(this.min) || Number.isInteger(this.max))
					return Math.floor(val);
				return val;
			case 'TIME': 
				const d = new Date();
				const seconds = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
				return seconds / 86400; // 86400 = 24h
			case 'INCR':
				return this.output >= this.end ? this.start : this.output + 1;
			default: return this.output;
		}
	}

	updateInput() {
		this.updateHandles();
		if (this.type === 'RAND') {
			if (this.ins[0]) this.speed = this.ins[0].output;
			else this.speed = 1;
			this.min = Number(this.ins[1] ? this.ins[1].output : 0);
			this.max = Number(Math.max(this.ins[2] ? this.ins[2].output : 100, this.min + 1));
		}
		else if (this.type === 'INCR') {
			const a = this.ins[0]?.output || 0;
			const b = this.ins[1]?.output || 0;
			const c = this.ins[2]?.output || 100;
			this.speed      = a;
			this.end 		= c;
			this.start      = Math.min(this.end - 1, b);
		}
		else if (this.ins[0]) {
			var out = this.ins[0].output;
			this.setOutput(out);
		}
	}

	update() {
		if (this.type === 'TIME')
			this.setOutput(this.getValue());
		else if ((this.type === 'RAND' || this.type === 'INCR') && this.speed > 0) {
			const now = performance.now();
			if (!this._lastUpdate) this._lastUpdate = now;
			const elapsed = now - this._lastUpdate;
			const period = 1000 / (this.speed || 1);
			if (elapsed >= period) {
				this._lastUpdate = now;
				this.setOutput(this.getValue());
			}
		}
	}

	render(ctx, pos = this.pos, size = this.size) {
		super.render(ctx, toScrn(pos), size);
		if (_selBox.active) return;
		if (pointInRect(_mouse.pos, toScrn([pos[0] + size[0] * .3, pos[1] + size[1] * .2]), [size[0] * .4, size[1] * .4])) {
			if (this.type === 'NUM') {
				document.body.style.cursor = "Text";
				if (_mouse.clicked)
					Node.renameNodeProperty(this, 'output', this.output);
			}
			else if (this.type === 'INCR' && _mouse.clicked)
				this.output = 0;
		}
		else if (this.type === 'BOOL' && pointInRect(_mouse.pos, toScrn([pos[0], pos[1] - 40]), [size[0], 40])) {
			document.body.style.cursor = "Text";
			if (_mouse.clicked) {
				if (this.name === undefined) this.setName('BOOL');
				Node.renameNodeProperty(this, 'name', 'BOOL');
			}
		}
	}
}
