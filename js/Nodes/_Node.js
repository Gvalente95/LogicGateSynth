var id = 0;
class Node{
	constructor(pos, size) {
		this.active = true;
		this.pos = pos;
		this.id = id++;
		this.size = [size[0] * _scale, size[1] * _scale];
		this.isHighlight = false;
		this.lastUpdateFrame = 0;
		this.minValue = -Infinity;
		this.maxValue = Infinity;
		this.hiddenProperties = [];
	}

	copy() {
		const C = this.constructor;
		var copy;
		if (C === NodeContainer) copy = new C(this.type, this.pos, this.name, this.sys);
		else copy = new C(this.type, this.pos);
		return copy;
	}

	setName(newName) {
		if (this.constructor.name === "NodeContainer")
			_menu.replace(this.type, this.name, this.type, newName);
		this.name = newName;
		if (_renameNode === this)
			_renameNode = null;
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

	update() {
		this.updateInput();
	}

	resize(newSize) {
		this.size = newSize;
	}

	drawTextField(text, propertyName, pos, txtClr = "white", bgr = "rgba(119, 119, 119, 1)") {
		if (this.hiddenProperties.includes(propertyName)) return;
		var isRename = _renameNode === this && _renameProperty === propertyName;
		var bgrClr = isRename && (_renameAll || propertyName === 'output') && text.length ? bgr : null;
		var hasCursor = (_input.keys['arrowLeft'] || _input.keys['arrowRight']) ||
			(isRename && (!_renameAll || !text.length)) && ((_frame % 40) < 20);
		var cursor =  hasCursor ? '▌' : "";
		var clr = isRename ? txtClr : bgr;
		drawText(ctx, pos, text, clr, bgrClr, 25, true, cursor, _renameIdx);
	}

	displayOutput(pos) {
		if (this.hiddenProperties.includes('output')) return;
		var center = [pos[0] + this.size[0] / 2, pos[1] + this.size[1] / 2];
		if (this instanceof GateNode || this instanceof NodeContainer || this.type === 'BOOL') {
			const clr = this.output ? "rgba(249, 250, 141, 0.95)" : "rgba(0, 0, 0, 0.72)";
			drawCircle(ctx, [center[0], center[1]], 3, clr, "rgba(106, 138, 47, 1)", 4);
		} else {
			if (this instanceof AudioNode) center = [pos[0] + this.size[0] * .73, pos[1] + this.size[1] * .35];
			else if (this.type === 'INCR') center[0] += 20;
			let shown;
			if (_renameNode === this && _renameProperty === 'output') {
				const raw = (_renameNode[_renameProperty] ?? "").toString();
				shown = raw;
				const clr = _renameAll ? "black" : "white";
				const bgrClr = _renameAll ? "white" : "black";
				this.drawTextField(shown, "output", center, clr, bgrClr);
			} else {
				const val = this.output;
				const num = Number(val);
				if (!isNaN(num)) {
					if (Number.isInteger(num)) {
						shown = num.toString();
					} else {
						const full = num.toString();
						const short = num.toFixed(5).replace(/\.?0+$/, "");
						shown = short + (full !== short ? ".." : "");
					}
				} else {
					shown = String(val);
				}
				drawText(ctx, center, shown, "white", "black");
				if (this.hiddenProperties.includes('limits')) return;
				if (_renameNode !== this) return;
				if (this.minValue !== -Infinity)
					drawText(ctx, [center[0] - 50, center[1]], this.minValue, "grey", null, 20, false);
				if (this.maxValue !== Infinity)
					drawText(ctx, [pos[0] + this.size[0] - 30, center[1]], this.maxValue, "grey", null, 20, false);
			}
		}
	}


	render(ctx, pos = this.pos, size = this.size, color = this.color) {
		if (isInspecting && this.constructor.name === 'NodeContainer')
			log("COLOR IS" + color);
		// ctx.fillStyle = "rgba(0,0,0,1)"; ctx.fillRect(pos[0] - 2, pos[1] - 2, size[0] + 4, size[1] + 4);
		if (_hovElement === this) color = addColor(color, "rgba(255, 255, 255, 1)", .5)
		if (!this.output && this.type !== 'BOOL') color = setAlpha(color, .75);
		if (this.isHighlight) {
			let h = 14;
			ctx.fillStyle = "rgba(89, 146, 193, 0.86)"; ctx.fillRect(pos[0] - h / 2, pos[1] - h / 2, size[0] + h, size[1] + h);
		}
		ctx.fillStyle = color; ctx.fillRect(pos[0], pos[1], size[0], size[1]);
		if (this.name !== undefined) {
			this.drawTextField(this.name, "name", [pos[0] + this.size[0] / 2, pos[1] - 18]);
			if (!this.hiddenProperties.includes('type'))
				drawText(ctx, [pos[0] + this.size[0] / 2, pos[1] + this.size[1] + 18], this.type, "white", _bgrClr);
		}
		else if (!this.hiddenProperties.includes('type'))
			drawText(ctx, [pos[0] + this.size[0] / 2, pos[1] - 18], this.type, "grey", _bgrClr);
		if (this.constructor.name !== "DisplayNode")
			this.displayOutput(pos);
	}

	renderHandles(ctx) {
		const p = toScrn(this.pos); const s = this.size; const c = this.color;
		for (const h of this.handles) {
			let dEnd = toScrn(h.start);
			let dStart = [p[0], dEnd[1]];
			if (dEnd[1] < p[1]) dStart = [dEnd[0], p[1]];
			else if (dEnd[1] > p[1] + s[1]) dStart = [dEnd[0], p[1] + s[1]];
			else if (dEnd[0] > p[0])
				dStart = [p[0] + s[0], dEnd[1]];
			else dStart = [p[0], dEnd[1]];

			let clr = addColor(h.isInput && h.attach ? h.attach.parent.color : this.color, "rgba(0, 0, 0, 1)", .4);
			if ((!h.isInput && !this.output) || (h.isInput && !h.attach?.parent?.output))
				clr = setAlpha(clr, .4);
			drawLine(ctx, dStart, dEnd, clr, h.lineIsHighlight ? 16 : 8, 0);
			h.render(ctx, clr);
			if (h.label !== undefined)
				drawText(ctx, [dStart[0] + 10, dStart[1] + 5], h.label, addColor(c, 'rgba(0, 0, 0, 1)', .5), null, 20, false);
		}
	}

	hideProperty(property) {
		this.hiddenProperties.push(property);
	}

	updateHandles() {
		const insSlots  = this.handles.filter(h => h.isInput);
		const outsSlots = this.handles.filter(h => !h.isInput);
		this.ins  = insSlots.map(h  => h.attach ? h.attach.parent : null);
		this.outs = outsSlots.map(h => h.attach ? h.attach.parent : null);

		if (this.parent) {
			
		}
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
					if (--amount <= 0)
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
		if (v != null) {
			if (this.output === v) return;
			this.output = v;
		}
		log("");
		log("OUTPUT WAS SET TO " + this.output, this);
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
			let wp = toScrn(g.pos);
			if (Math.abs((wp[0] + g.size[0] / 2) - pos[0]) <= g.size[0] / 2 &&
				Math.abs((wp[1] + g.size[1] / 2) - pos[1]) <= g.size[1] / 2)
				return g;
		}
		return null;
	}

	static setProperty() {
		const n = _renameNode;
		const p = _renameProperty;
		if (!n || !p) return;
		let val = n[p];
		if (!val?.toString().length)
			val = '0';
		if (p === 'output') {
			if (val === ".") val = "0";
			if (val === "-.") val = "-0";
			n.output = null;
			n.setOutput(val);
		}
		n[p] = val;
		if (_renameNode.constructor.name === 'NodeContainer')
			_renameNode.save();
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
				if (_renameProperty === 'output') {
					const newName = n[p] + e.key;
					if (_renameAll) {
						if (isPartialNumber(e.key) || e.key === '.')
							n[p] = e.key;
						else return;
					}
					isValid = n[p].length < 6 && (isPartialNumber(newName) || n[p] === '.');
				}
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
		_selBox.reset();
		_renameAll = true;
		if (property === 'name' && _renameNode[property] === fallback)
			node[property] = '';
		prevName = _renameNode[property];
		_renameIdx = node[property].length;
	}
}

var prevName = null;