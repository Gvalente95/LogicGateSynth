class InputNode extends Node{
	constructor(type, pos) {
		super(pos, InputNode.getSize(type));
		this.color = "rgba(210, 141, 21, 1)";
		this.output = 0;
		this.key = '0';
		this.isTrigger = false;
		this.isPressed = false;
		this.hideProperty('type');
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
		let nIn = InputNode.getInputAmount(type);
		let nOut = InputNode.getOutputAmount(type);
		let max = Math.max(nIn, nOut);

		let W = 145;
		let H = 20 + max * 30;
		return [W, H];
	}
	static getOutputAmount(type) {return (1);}
	static getInputAmount(type) {return (0);}

	initHandles(pos = this.pos, size = this.size) {
		this.handles = [];
		let hl = 20 * _scale;

		let nIn = InputNode.getInputAmount(this.type);
		this.nIn = nIn;
		let sub = 1 / nIn;
		for (var i = 0; i < nIn; i++){
			var h = new Handle([pos[0] - hl, pos[1] + size[1] * sub * i + hl / 2], [pos[0] - hl, pos[1] + size[1] * sub * i + hl / 2], this, true);
			this.handles.push(h);
		}

		let nOut = InputNode.getOutputAmount(this.type);
		this.nOut = nOut;
		if (nOut === 1) {
			var hp = [pos[0] + size[0] + hl, pos[1] + size[1] / 2];
			this.handles.push(new Handle(hp, hp, this, false));
			return;
		}
		let hPos = [pos[0] + size[0] + hl, pos[1] + hl * 2];
		for (let i = 0; i < nOut; i++){
			var h = new Handle(hPos, hPos, this, false);
			this.handles.push(h);
			hPos[1] += 30 * _scale;
		}
	}

	getValue() {
		switch (this.type) {
			default: return this.output;
		}
	}

	updateInput() {
		this.updateHandles();
		this.setOutput(this.output);
	}

	update() {
		if (_renameNode) return;
		this.updateHandles();
		if (this.isTrigger) {
			if (!this.output && _input.lastKey === this.key.toLowerCase()) {
				if (this.outs[0]) {
					this.setOutput(this.outs[0].output === 0 ? 1 : 0);
					this.outs[0].updateInput();
				}
				this.setOutput(1);
			}
			else if (this.output)
				this.output = 0;
			return;
		}
		const currentlyPressed = this.key && _input.keys[this.key.toLowerCase()];
		if (this.isPressed !== currentlyPressed) {
			const out = currentlyPressed ? 1 : 0;
			this.isPressed = currentlyPressed;
			this.setOutput(out);
		}
		else if (!this.isTrigger && this.isPressed)
			this.setOutput(this.output);
	}

	render(ctx, p = this.pos, s = this.size) {
		const scrn = toScrn(p);
		if (_renameNode === this) {
			ctx.fillStyle = 'rgba(255, 255, 255, 0.27)';
			ctx.fillRect(scrn[0], scrn[1] - 50, s[0], 50);
		}
		if (pointInRect(_mouse.pos, [scrn[0] + 20, scrn[1] - 50], [s[0], 50])) {
			ctx.fillStyle = 'rgba(0, 0, 0, 0.07)';
			ctx.fillRect(scrn[0], scrn[1] - 50, s[0], 50);
			document.body.style.cursor = "Pointer";
			if (_mouse.clicked) Node.renameNodeProperty(this, 'key', this.key);
		}

		this.name = this.type + ' - ' + this.key;
		const clr = this === _renameNode ? addColor(this.color, 'rgba(255, 255, 255, 0)', .5) : this.color;
		super.render(ctx, scrn, s, clr);
	
		var bgrClr = addColor(this.color, 'black', .1);
		if (pointInRect(_mouse.pos, [scrn[0] + 5, scrn[1] + 5], [30, 30])) {
			bgrClr = addColor(this.color, 'black', .5);
			if (_mouse.clicked) this.isTrigger = !this.isTrigger;
			document.body.style.cursor = 'Pointer';
			_renameHov = this;
		}
		drawText(ctx, [scrn[0] + 20, scrn[1] + s[1] / 2], this.isTrigger ? 'T' : 'P', 'white', bgrClr, 20, true);
	}

	static validateKey(key) {
		const unvalidKeys = ['Escape', 'Enter', 'd', 'c', 'v', 'g', 'j', 's'
			, 'l', 'x', 'd', 'Backspace', 'Tab'];
		if (unvalidKeys.includes(key)) {
			log(`${key} can't be mapped - returning`);
			return 0;
		}
		return 1;
	}
}
