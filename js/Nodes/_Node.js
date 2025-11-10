class Node{
	constructor(pos, size) {
		this.active = true;
		this.pos = pos;
		this.size = size;
		this.isHighlight = false;
	}

	highlight(newHighlight) {
		this.isHighlight = newHighlight;
	}
	place(pos) {
		const snapped = snapToGrid(pos);
		const clamped = clampToCanvas(snapped, this.size);
		this.pos = clamped;
		for (const l of this.handles) {
			if (l.attach){ l.place(l.getCurStart(), l.attach.start); continue; }
			l.place(); l.baseStart = l.start; l.baseEnd = l.end;
		}
	}

	resize(newSize) {
		this.size = newSize;
	}

	render(ctx, pos = this.pos, size = this.size, color = this.color)
	{
		if (this.isHighlight) {
			let h = 14;
			ctx.fillStyle = "rgba(148, 153, 197, 0.86)"; ctx.fillRect(pos[0] - h/2, pos[1] - h/2, size[0] + h, size[1] + h);
		}
		for (const l of this.handles) l.render(ctx, "white");
		ctx.fillStyle = color; ctx.fillRect(pos[0], pos[1], size[0], size[1]);
		let val = this.output;
		let shown;
		if (Number.isInteger(val)) {
			shown = val.toString();
		} else {
			const full = val.toString();
			const short = val.toFixed(5).replace(/\.?0+$/, "");
			shown = short + (full !== short ? ".." : "");
		}
		drawText(ctx, [pos[0] + size[0] / 2, pos[1] + size[1] / 2], shown, "white", "black");
	}

	tryAttachToElement(targetNode, myHandle = null) {
		const tryPairs = (srcs, tgts) => {
			for (const s of srcs) if (!s.attach)
				for (const t of tgts) if (!t.attach)
					if (s.tryAttachTo(t)) return true;
			return false;
		};
		if (myHandle) {
			const tgts = targetNode.handles.filter(h => h.isInput !== myHandle.isInput);
			return tryPairs([myHandle], tgts);
		}
		const myOuts = this.handles.filter(h => !h.isInput && !h.attach);
		const tgtIns = targetNode.handles.filter(h => h.isInput && !h.attach);
		if (tryPairs(myOuts, tgtIns)) return true;
		const myIns = this.handles.filter(h => h.isInput && !h.attach);
		const tgtOuts = targetNode.handles.filter(h => !h.isInput && !h.attach);
		return tryPairs(myIns, tgtOuts);
	}


	static get(pos = _mouse.pos, self = null) {
		for (const g of _nodes)
			if (g.active && g != self && Math.abs(
				(g.pos[0] + g.size[0] / 2) - pos[0]) <= g.size[0] / 2 &&
				Math.abs((g.pos[1] + g.size[1] / 2) - pos[1]) <= g.size[1] / 2)
				return g;
		return null;
	}

	onRemove() {
		if (this.handles !== undefined)
			for (const f of this.handles)
				f.dettach();
		_nodes.splice(_nodes.indexOf(this), 1);
	}
}
