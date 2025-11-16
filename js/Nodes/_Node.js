var id = 0;
class Node{
	constructor(pos, size) {
		this.active = true;
		this.pos = pos;
		this.id = id++;
		this.size = [size[0] * _scale, size[1] * _scale];
		this.isHighlight = false;
		this.lastUpdateFrame = 0;
	}

	copy() {
		const C = this.constructor;
		var copy;
		if (C === NodeContainer) copy = new C(this.type, this.pos, this.name, this.sys);
		else copy = new C(this.type, this.pos);
		return copy;
	}

	setName(name) {
		this.name = name;
	}

	highlight(newHighlight) {
		this.isHighlight = newHighlight;
	}

	place(pos = this.pos) {
		const snapped = snapToGrid(pos);
		const clamped = clampToCanvas(snapped, this.size);
		this.pos = clamped;
		for (const h of this.handles) {
			if (h.attach){ h.place(h.getCurStart(), h.attach.start); continue; }
			h.place();
			h.baseStart = h.start;
			h.baseEnd = h.end;
		}
	}

	resize(newSize) {
		this.size = newSize;
	}

	drawTextField(text, propertyName, pos, txtClr = "white", bgr = "rgba(119, 119, 119, 1)") {
		var isRename = _renameNode === this && _renameProperty === propertyName;
		var bgrClr = isRename && _renameAll && text.length ? bgr : null;
		var hasCursor = (_input.keys['arrowLeft'] || _input.keys['arrowRight']) ||
			(isRename && (!_renameAll || !text.length)) && ((_frame % 40) < 20);
		var cursor =  hasCursor ? '▌' : "";
		var clr = isRename ? txtClr : bgr;
		drawText(ctx, pos, text, clr, bgrClr, 25, true, cursor, _renameIdx);
	}

	displayOutput(pos) {
		var center = [pos[0] + this.size[0] / 2, pos[1] + this.size[1] / 2]
		if (this instanceof GateNode || this instanceof NodeContainer || this.type === 'BOOL') {
			const clr = this.output ? "rgba(249, 250, 141, 0.95)" : "rgba(0, 0, 0, 0.72)";
			drawCircle(ctx, [center[0], center[1]], 3, clr, "rgba(106, 138, 47, 1)", 4);
		}
		else {
			let val = this.output;
			let shown;
			const num = Number(val);
			if (!isNaN(num)) {
				if (Number.isInteger(num))
					shown = num.toString();
				else {
					const full = num.toString();
					const short = num.toFixed(5).replace(/\.?0+$/, "");
					shown = short + (full !== short ? ".." : "");
				}
			} else shown = String(val);
			// this.drawTextField(shown, "output", [pos[0] + size[0] / 2, pos[1] + size[1] / 2], "white", "black");
			var clr = "black";
			if (_renameNode === this && _renameProperty === 'output') {
				clr = _renameAll ? 'red' : 'rgba(119, 119, 119, 1)';
				shown += ' ';
			}
			drawText(ctx, center, shown, "white", clr);
		}
	}

	render(ctx, pos = this.pos, size = this.size, color = this.color) {
		// ctx.fillStyle = "rgba(0,0,0,1)"; ctx.fillRect(pos[0] - 2, pos[1] - 2, size[0] + 4, size[1] + 4);
		if (_hovElement === this) color = addColor(color, "rgba(255, 255, 255, 1)", .5)
		if (!this.output && this.type !== 'BOOL') color = setAlpha(color, .75);
		if (this.isHighlight) {
			let h = 14;
			ctx.fillStyle = "rgba(89, 146, 193, 0.86)"; ctx.fillRect(pos[0] - h / 2, pos[1] - h / 2, size[0] + h, size[1] + h);
		}
		ctx.fillStyle = color; ctx.fillRect(pos[0], pos[1], size[0], size[1]);
		if (this.constructor.name !== "DisplayNode") {
			this.displayOutput(pos);
		}
		if (this.name !== undefined) {
			this.drawTextField(this.name, "name", [pos[0] + this.size[0] / 2, pos[1] - 18]);
			drawText(ctx, [pos[0] + this.size[0] / 2, pos[1] + this.size[1] + 18], this.type, "white");
		}
		else
			drawText(ctx, [pos[0] + this.size[0] / 2, pos[1] - 18], this.type, "white");
		for (const h of this.handles) {
			let dEnd = toWorld(h.start);
			let dStart = [pos[0], dEnd[1]];
			if (dEnd[1] < pos[1]) dStart = [dEnd[0], pos[1]];
			else if (dEnd[1] > pos[1] + size[1]) dStart = [dEnd[0], pos[1] + size[1]];
			else if (dEnd[0] > pos[0])
				dStart = [pos[0] + size[0], dEnd[1]];
			else dStart = [pos[0], dEnd[1]];

			let clr = addColor(h.isInput && h.attach ? h.attach.parent.color : this.color, "rgba(0, 0, 0, 1)", .4);
			if ((!h.isInput && !this.output) || (h.isInput && !h.attach?.parent?.output))
				clr = setAlpha(clr, .4);
			drawLine(ctx, dStart, dEnd, clr, h.lineIsHighlight ? 16 : 8, 0);
			h.render(ctx, clr);
			if (h.label !== undefined)
				drawText(ctx, [dStart[0] + 15, dStart[1] + 5], h.label, "grey", null, 20);
		}
	}

	updateHandles() {
		const insSlots  = this.handles.filter(h => h.isInput);
		const outsSlots = this.handles.filter(h => !h.isInput);
		this.ins  = insSlots.map(h  => h.attach ? h.attach.parent : null);
		this.outs = outsSlots.map(h => h.attach ? h.attach.parent : null);
	}

	_tryAttach(targetNode, amount, wantInput, wantOutput, myHandle=null) {
		if (!targetNode) return 0;
		var attachedOnce = 0;
		const myHandles = myHandle ? [myHandle] : this.handles;
		for (let i = myHandles.length - 1; i >= 0; i--) {
			const h = myHandles[i];
			if (h.attach) continue;
			if (wantInput  && !h.isInput) continue;
			if (wantOutput &&  h.isInput) continue;

			for (const oh of targetNode.handles) {
				if (oh.attach) continue;
				if (h.tryAttachTo(oh)) {
					if (--amount < 0)
						return 1;
					attachedOnce = 1;
				} 
			}
		}
		return attachedOnce;
	}
	tryAttachToOutput(targetNode, amount = 1) {return this._tryAttach(targetNode, amount, true, false);}
	tryAttachToInput(targetNode, amount = 1) {return this._tryAttach(targetNode, amount, false, true);}
	tryAttachToElement(targetNode, myHandle = null, amount = 1) {return this._tryAttach(targetNode, amount, false, false, myHandle);}

	setOutput(v) {
		if (this.lastUpdateFrame === _frame) return;
		this.lastUpdateFrame = _frame;
		if (this.output === v) return;
		this.output = v;
		log("");
		log("OUTPUT WAS SET TO " + v, this);
		for (const h of this.handles)
			if (!h.isInput) h.attach?.parent?.updateInput?.(h.attach);
	}

	onRemove() {
		if (this.handles !== undefined) {
			for (const f of this.handles) {
				f.dettach();
			}
		}
		_nodes.splice(_nodes.indexOf(this), 1);
	}

	static get(pos = _mouse.pos, self = null) {
		for (let i = _nodes.length - 1; i >= 0; i--) {
			const g = _nodes[i];
			if (!g.active || g === self) continue;
			let wp = toWorld(g.pos);
			if (Math.abs((wp[0] + g.size[0] / 2) - pos[0]) <= g.size[0] / 2 &&
				Math.abs((wp[1] + g.size[1] / 2) - pos[1]) <= g.size[1] / 2)
				return g;
		}
		return null;
	}

	static setProperty() {
		if (!_renameNode || !_renameProperty) return;
		let val = _renameNode[_renameProperty];
		if (!val?.toString().length)
			val = '0';
		if (_renameProperty === 'output') {
			_renameNode.output = val - 1;
			_renameNode.setOutput(val);
		}
		_renameNode[_renameProperty] = val;
		_renameNode = null;
	}

	static resetProperty() {
		_renameNode[_renameProperty] = _renameFallback;
		_renameNode = null;
	}
	static addCharToName(e) {
		const n = _renameNode;
		const p = _renameProperty;
		if (e.code === "Enter")
			Node.setProperty();
		else if (e.code === 'Escape')
			Node.resetProperty();
		else if (e.code === 'ArrowLeft')
			_renameIdx = _renameAll ? 0 : Math.max(_renameIdx - 1, 0);
		else if (e.code === 'ArrowRight')
			_renameIdx = _renameAll ? n[p].length : Math.min(_renameIdx + 1, n[p].length);
		else {
			if (e.code === "Backspace")
				if (_renameAll) { n[p] = ''; _renameIdx = 0; }
				else {
					if (n[p].length)
					{
						n[p] = removeCharAt(n[p], _renameNode[p].length - 1);
						if (_renameIdx) _renameIdx--;
					}
				}
			else {
				var isValid = false;
				if (_renameProperty === 'output') isValid = (e.key >= '0' && e.key <= '9' && n[p].length < 10);
				else isValid = isPrintableKey(e) && n[p].length < 15;
				if (isValid) {
					if (_renameAll) {
						n[p] = e.key;
						_renameIdx = 1;
					} else
						n[p] = n[p].slice(0, _renameIdx) + e.key + n[p].slice(_renameIdx++);
				}
			}
		}
		if (e.key !== 'Shift')
			_renameAll = false;
	}

	static renameNodeProperty(node, property = 'name', fallback = "Fallback") {
		if (isInspecting) { announce("Can't do that while inspecting"); return;}
		if (_renameNode) {
			return;
		}
		_renameNode = node;
		_renameProperty = property;
		_renameFallback = fallback;
		_renameAll = true;
		if (property === 'name' && _renameNode[property] === fallback)
			node[property] = '';
		_renameIdx = node[property].length;
	}
}
