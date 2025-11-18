class SplitNode extends Node{
	constructor(type, pos) {
		super(pos, SplitNode.getSize(type));
		this.color = "rgba(210, 207, 21, 1)";
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
		let nIn = SplitNode.getInputAmount(type);
		let nOut = SplitNode.getOutputAmount(type);
		let max = Math.max(nIn, nOut);

		let W = 50;
		let H = 20 + max * 30;
		return [W, H];
	}
	static getOutputAmount(type) {return (type.slice(5));}
	static getInputAmount(type) {return (1);}

	initHandles(pos = this.pos, size = this.size) {
		this.handles = [];
		let hl = 20 * _scale;
		let hPos = [pos[0] + size[0] + hl, pos[1] + hl];
		let nOut = SplitNode.getOutputAmount(this.type);
		for (let i = 0; i < nOut; i++){
			var h = new Handle(hPos, hPos, this, false);
			this.handles.push(h);
			hPos[1] += 30 * _scale;
		}
		let nIn = SplitNode.getInputAmount(this.type);
		let sub = 1 / nIn;
		var labels = "";
		for (var i = 0; i < nIn; i++){
			var h = new Handle([pos[0] - hl, pos[1] + size[1] * sub * i + hl / 2], [pos[0] - hl, pos[1] + size[1] * sub * i + hl / 2], this, true);
			if (labels && labels[i])
				h.label = labels[i];
			this.handles.push(h);
		}
	}

	getValue() {
		switch (this.type) {
			default: return this.output;
		}
	}

	updateInput() {
		this.updateHandles();
		const a = this.handles[this.handles.length - 1]?.attach?.parent?.output;
		this.setOutput(a ? a : 0);
	}

	update() {
		
	}

	render(ctx, pos = this.pos, size = this.size) {
		super.render(ctx, toScrn(pos), size);
	}
}
