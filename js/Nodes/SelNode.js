class SelNode extends Node{
	constructor(type, pos) {
		super(pos, SelNode.getSize(type));
		this.color = "rgba(210, 141, 21, 1)";
		this.output = 0;
		this.initType(type);
		this.initHandles(this.pos, this.size);
		this.updateHandles();
		this.place();
	}

	initType(type) {
		this.type = type;
	}

	static getSize(type)
	{
		let nIn = SelNode.getInputAmount(type);
		let nOut = SelNode.getOutputAmount(type);
		let max = Math.max(nIn, nOut);

		let W = 75;
		let H = 20 + max * 30;
		return [W, H];
	}
	static getOutputAmount(type) {return (type.slice(3));}
	static getInputAmount(type) {return (1);}

	initHandles(pos = this.pos, size = this.size) {
		this.handles = [];
		let hl = 20 * _scale;

		let nIn = SelNode.getInputAmount(this.type);
		let sub = 1 / nIn;
		for (var i = 0; i < nIn; i++){
			var h = new Handle([pos[0] - hl, pos[1] + size[1] * sub * i + hl / 2], [pos[0] - hl, pos[1] + size[1] * sub * i + hl / 2], this, true);
			if (i === 0) h.label = 'FN';
			else h.label = i;
			this.handles.push(h);
		}

		let hPos = [pos[0] + size[0] + hl, pos[1] + hl * 2];
		let nOut = SelNode.getOutputAmount(this.type);
		for (let i = 0; i < nOut; i++){
			var h = new Handle(hPos, hPos, this, false);
			this.handles.push(h);
			hPos[1] += 30 * _scale;
		}
		this.nIn = nIn;
		this.nOut = nOut;
	}

	getValue() {
		switch (this.type) {
			default: return this.output;
		}
	}

	updateInput() {
		this.updateHandles();
		var idx = this.handles[0].attach?.parent.output || 0;
		for (let i = 0; i < this.outs.length; i++)
		{
			const n = this.outs[i];
			if (!n) continue;
			this.output = (i === idx) ? 1 : 0;
			n.updateInput();
		}
		this.setOutput(idx);
	}

	update() {
		// this.updateInput();
	}

	render(ctx, pos = this.pos, size = this.size) {
		super.render(ctx, toWorld(pos), size);
	}
}
