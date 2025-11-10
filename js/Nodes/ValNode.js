class ValNode extends Node{
	constructor(type, pos, value = 0) {
		super(pos, type === "TIME" ? [150, 50] : [50, 50]);
		this.color = "rgba(21, 210, 81, 1)";
		this.output = value;
		this.type = type;
		this.initHandles(this.pos, this.size);
	}

	initHandles(pos, size) {
		this.handles = [];
		let hl = 20;
		let hPos = [pos[0] + size[0] + hl, pos[1] + size[1] / 2];
		this.handles.push(new Handle(hPos, hPos, this, false));
	}

	getValue() {
		const d = new Date();
		const seconds = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
		return seconds / 86400; // 86400 = 24h
	}

	updateOutput() {
		
	}

	setOutput(v) {
		if (this.output === v) return;
		this.output = v;
		for (const h of this.handles)
			if (!h.isInput) h.attach?.parent?.updateOutput?.();
	}
	render(ctx, pos = this.pos, size = this.size) {
		if (this.type === 'TIME')
			this.setOutput(this.getValue());
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


async function setNodeOutput(node) {
	promptUser("Value:", node.output).then(name => {
		let val = parseInt(name);
		if (val === NaN)
			node.setOutput(0);
		node.setOutput(val);
	});
}
