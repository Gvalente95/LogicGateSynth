class ValNode extends Node{
	constructor(type, pos) {
		super(pos, ValNode.getSize(type));
		this.color = "rgba(109, 210, 21, 1)";
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
			this.output = this.getValue();
		}
		else if (type === 'VALUE') {
			this.output = "0";
			Node.renameNodeProperty(this, "output", "1");
		}
	}

	static getSize(type)
	{
		let nIn = ValNode.getInputAmount(type);
		let nOut = ValNode.getOutputAmount(type);
		let max = Math.max(nIn, nOut);

		let W = 125;
		let H = 20 + max * 30;
		if (type.includes("SPLIT")) W = 50;
		return [W, H];
	}
	static getOutputAmount(type) {return (type.includes('SPLIT') ? type.slice(5) : 1);}
	static getInputAmount(type) {return (type === 'TIME' ? 0 : 1);}

	initHandles(pos = this.pos, size = this.size) {
		this.handles = [];
		let hl = 20 * _scale;
		let hPos = [pos[0] + size[0] + hl, pos[1] + hl];
		let nOut = ValNode.getOutputAmount(this.type);
		for (let i = 0; i < nOut; i++){
			this.handles.push(new Handle(hPos, hPos, this, false));
			hPos[1] += 30 * _scale;
		}
		let nIn = ValNode.getInputAmount(this.type);
		let sub = 1 / nIn;
		var letters = "ABCDEFGH";
		if (this.type === 'RAND') letters = ["SP", "SEED"];
		for (var i = 0; i < nIn; i++){
			var h = new Handle([pos[0] - hl, pos[1] + size[1] * sub * i + hl / 2], [pos[0] - hl, pos[1] + size[1] * sub * i + hl / 2], this, true);
			if (letters && letters[i])
				h.label = letters[i];
			this.handles.push(h);
		}
	}

	getValue() {
		if (this.type === 'RAND')
			return (!this.speed ? this.output : Math.floor(Math.random() * 100));
		if (this.type === 'TIME') {
			const d = new Date();
			const seconds = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
			return seconds / 86400; // 86400 = 24h
		}
	}

	updateInput() {
		this.updateHandles();
		if (this.type === 'RAND') {
			if (this.ins[0]) this.speed = this.ins[0].output;
			else this.speed = 1;
		}
		else if (this.type.includes('SPLIT')) {
			const a = this.handles[this.handles.length - 1]?.attach?.parent?.output;
			this.setOutput(a ? a : 0);
		}
		else if (this.ins[0]) {
			var out = this.ins[0].output;
			this.setOutput(out);
		}
	}

	render(ctx, pos = this.pos, size = this.size) {
		if (this.type === 'TIME')
			this.setOutput(this.getValue());
		if (this.type === 'INCR')
			this.setOutput(this.output + 1);
		else if (this.type === 'RAND' && this.speed) {
			const now = performance.now();
			if (!this._lastUpdate) this._lastUpdate = now;
			const elapsed = now - this._lastUpdate;
			const period = 1000 / (this.speed || 1);
			if (elapsed >= period) {
				this._lastUpdate = now;
				this.setOutput(this.getValue());
			}
		}
		super.render(ctx, toWorld(pos), size);
		if (_selBox.active) return;
		if (pointInRect(_mouse.pos, toWorld([pos[0] + size[0] * .2, pos[1] + size[1] * .2]), [size[0] * .4, size[1] * .4])) {
			if (this.type === 'VALUE') {
				document.body.style.cursor = "Text";
				if (_mouse.clicked)
					Node.renameNodeProperty(this, 'output', this.output);
			}
			else if (this.type === 'INCR' && _mouse.clicked)
				this.output = 0;	
		}
		else if (this.type === 'BOOL' && pointInRect(_mouse.pos, toWorld([pos[0], pos[1] - 40]), [size[0], 40])) {
			document.body.style.cursor = "Text";
			if (_mouse.clicked) {
				if (this.name === undefined) this.setName('BOOL');
				Node.renameNodeProperty(this, 'name', 'BOOL');
			}
		}
	}
}

async function setNodeOutput(node) {
	promptUser("Value:", node.output).then(name => {
		let val = parseInt(name);
		if (val === NaN)
			node.setOutput(0);
		node.setOutput(val);
	});
}
