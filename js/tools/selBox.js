class SelBox{
	constructor() {
		this.active = false;
		this.nodes = [];
		this.type = "SelBox";
		this.color = "rgba(94, 176, 71, 0.93)";
		this.copyNodes = [];
		this.copyPos = [0, 0];
		this.lines = [];
		this.size = [0, 0];
		this.pos = [0, 0];
		this.start = [0, 0];
	}

	init(pos = _mouse.pos) {
		this.reset();
		this.start = pos;
		this.active = true;
	}

	copy() {
		if (!this.nodes.length) return;
		this.copyNodes = this.nodes;
		const topLeft = this.nodes.reduce((best, n) => {
			if (!best) return n;
			if (n.pos[0] < best.pos[0]) return n;
			if (n.pos[0] > best.pos[0]) return best;
			if (n.pos[1] < best.pos[1]) return n;
			return best;
		}, null);
		this.copyPos = [topLeft.pos[0], topLeft.pos[1]];

		log("COPPIED " + this.copyNodes.length, this);
	}

	paste() {
		if (_NcStack.length || ! this.copyNodes.length) return;
		var displace = [this.copyPos[0] - _mouse.pos[0], this.copyPos[1] - _mouse.pos[1]];
		const copiedGroup = getNodesCopy(this.copyNodes);
		log("PASTING " + this.copyNodes.length + " elements");
		for (const e of copiedGroup) {
			e.place([e.pos[0] - displace[0], e.pos[1] - displace[1]]);
			_nodes.push(e);
			log("PASTED" + e);
		}
		this.copyPos = [0, 0];
		this.copyNodes = [];
	}

	reset() {
		if (!_input.keys["shift"])
			this.clearNodes();
		this.size = [0, 0];
		this.pos = [0, 0];
		this.active = false;
	}

	dupplicateNodes(displace = null) {
		if (isInspecting) {announce("Can't do that while inspecting"); return;}
		const newSelGroup = getNodesCopy(this.nodes);
		for (const e of newSelGroup) {
			e.highlight(true);
			_nodes.push(e);
			if (displace) e.place([e.pos[0] + displace[0], e.pos[1] + displace[1]]);
		}
		this.clearNodes();
		this.nodes = newSelGroup;
		duplicateSel(displace);
		log("DUPPLICATED " + newSelGroup.length + " NODES", this);

	}

	clearNodes() {
		for (const l of this.lines)
			l.highlightLine(false);
		this.lines = [];
		for (let i = this.nodes.length - 1; i >= 0; i--) {
			const e = this.nodes[i];
			if (!e || typeof e.highlight !== "function") { this.nodes.splice(i,1); continue; }
			e.highlight(false);
			if (typeof e.highlightLine === "function") e.highlightLine;
		}
		this.nodes = [];
		_selElement = null;
	}

	deleteNodes() {
		if (isInspecting) {announce("Can't do that while inspecting"); return;}
		for (const e of this.lines) {
			if (e.attach)
				e.dettach(e.attach);
		}
		var hLen = this.lines.length;
		this.lines = [];
		for (const e of this.nodes) e.onRemove();
		var nLen = this.nodes.length;
		this.nodes = [];
		if (_selElement){
			_selElement.onRemove();
			_selElement = null;
		}
		log("DELETED " + " NODES[" + nLen + "] LINES[" + hLen + "]", this);
	}

	contains(node) {
		return (this.nodes.includes(node));
	}

	tryPush(node) {
		if (!node) return false;
		if (node.constructor.name === "Handle") { this.tryPushLine(node); return false; }
		if (this.nodes.includes(node)) return false;
		this.nodes.push(node);
		if (node.highlight !== undefined)
			node.highlight(true);
		// log("ADDED TO SELBOX ", node);
		return true;
	}

	tryPushLine(line) {
		if (!line) return false;
		if (line.constructor.name !== "Handle") return this.tryPush(line);
		if (this.lines.includes(line)) return false;
		this.lines.push(line);
		line.highlightLine(true);
		// log("'s HANDLE ADDED TO SELBOX ", line.parent);
		return true;
	}

	linkNodes() {
		var links = _input.keys['shift'] ? 1000 : 1;
		if (this.nodes.length < 2) return 0;
		for (let i = 1; i < this.nodes.length; i++){
			var a = this.nodes[i - 1];
			var b = this.nodes[i];
			if (tryLinkNodes(a, b, links))
				log("LINKED " + a.type + "_" + a.id + " and " + b.type + "_" + b.id, this);
		}
	}

	moveNodes(displace = _mouse.delta) {
		for (const e of this.nodes) {
			if (e !== _selElement) e.place([e.pos[0] + displace[0], e.pos[1] + displace[1]]);
		}
	}

	tryClearNode(e) {
		if (!e) return false;
		let index = this.nodes.indexOf(e);
		if (index >= 0) {
			e.highlight(false);
			this.nodes.splice(index, 1);
			log("SelBox cleared ", e);
			return true;
		}
		else {
			index = this.lines.indexOf(e);
			if (index >= 0) {
				e.highlightLine(false);
				this.lines.splice(index, 1);
				log("'s handle cleared from Selbox", e.parent);
				return true;
			}
		}
		return false;
	}

	update() {
		let startX = _mouse.pos[0] < this.start[0] ? _mouse.pos[0] : this.start[0];
		let startY = _mouse.pos[1] < this.start[1] ? _mouse.pos[1] : this.start[1];
		let w = Math.abs(_mouse.pos[0] - this.start[0]);
		let h = Math.abs(_mouse.pos[1] - this.start[1]);
		this.pos = [startX, startY];
		this.size = [w, h];
		for (const e of _nodes) {
			if (e.constructor.name === Handle)
				continue;
			if (rectCollide(toScrn(e.pos), e.size, [startX, startY], [w, h])) {
				if (this.tryPush(e)) _au.playSound(_au.click, .5);
			}
			else if (!_input.keys['shift']) this.tryClearNode(e) && _au.playSound(_au.click, .3);
		}
	}

	render() {
		ctx.fillStyle = "rgba(105, 125, 208, 0.27)";
		ctx.fillRect(this.pos[0], this.pos[1], this.size[0], this.size[1]);
	}
}

function getNodesCopy(nodes){
	const map = new Map();
	const out = [];
	for (const e of nodes) {
		if (e === _hovElement) continue;
		const ne = e.copy();
		if (!ne) continue;
		ne.output = e.output;
		ne.size = [...e.size];
		if (ne.place) ne.place([...e.pos]);
		map.set(e, ne);
		out.push(ne);
	}
	for (const e of _nodes){
		const ne = map.get(e);
		if (!e.handles || !ne?.handles) continue;
		for (let i = 0; i < e.handles.length; i++){
			const h = e.handles[i];
			if (!h || !h.attach || h.isInput) continue;
			const other = h.attach;
			const op = other.parent;
			if (!map.has(op)) continue;
			const nh = ne.handles[i];
			const nop = map.get(op);
			const j = op.handles.indexOf(other);
			const noh = nop.handles[j];
			nh?.tryAttachTo?.(noh);
		}
	}
	for (const n of out) n.updateInput?.();
	return out;
}

function duplicateSel(displace = null, toCopy = _hovElement ? _hovElement : _selElement) {
	if (isInspecting) {announce("Can't do that while inspecting"); return;}
	if (!toCopy)
		return;
	const e = toCopy.copy();
	e.output = toCopy.output;
	if (displace)
		e.place([e.pos[0] + displace[0], e.pos[1] + displace[1]]);
	_selElement = e;
	_nodes.push(_selElement);
}


function setScale(newScale) {
	const old = _scale;
	if (newScale === old) return;
	const saved = _nodes;
	const links = new Map();
	for (const n of saved) {
		if (!n?.handles) continue;
		for (const h of n.handles) if (h.attach) links.set(h, h.attach);
	}
	_nodes = [];
	for (const n of saved) {
		const dx = (n.size[0] * old - n.size[0] * newScale) / 2;
		const dy = (n.size[1] * old - n.size[1] * newScale) / 2;
		const pos = [n.pos[0] + dx / 2, n.pos[1] + dy / 2];
		const C = n.constructor;
		let nn;
		if ('name' in n && 'system' in n) nn = new C(n.type, pos, n.name, n.system);
		else if ('NUM' in n)        nn = new C(n.type, pos, n.value);
		else                          nn = new C(n.type, pos);
		_nodes.push(nn);
		nn.output = n.output;
		if (n.name !== undefined) nn.name = n.name;
		nn.type = n.type;
	}
	for (const [h, a] of links) {
		const i = saved.indexOf(h.parent), j = saved.indexOf(a.parent);
		if (i >= 0 && j >= 0) {
			const nh = _nodes[i]?.handles?.[h.parent.handles.indexOf(h)];
			const na = _nodes[j]?.handles?.[a.parent.handles.indexOf(a)];
			if (nh && na) { nh.attach = na; na.attach = nh; }
		}
	}
	for (const n of _nodes)
		n.place(n.pos);
	_scale = newScale;
}

function reorderSelGroupByY() {
	_selBox.nodes.sort((a, b) => a.pos[1] - b.pos[1]);
}

function tryLinkNodes(A = null, B = null, amount = 1) {
	if (isInspecting) { announce("Can't do that while inspecting"); return 0;}
	if (!A)
	{
		if (!_selBox.nodes.length) { announce("!A"); return 0};
		A = _selBox.nodes[0];
	}
	if (!B)
	{
		if (_selBox.nodes.length < 2) { announce("!B"); return 0};
		B = _selBox.nodes[1];
	}
	if (!A || !B) { announce("!A || !B"); return 0;}
	if (A === B) {announce("A === B");return 0;}
	if (!(A instanceof Node)) { announce("A != Node"); return 0;}
	if (!(B instanceof Node)) { announce("B != Node"); return 0;}
	let outt = A.pos[0] < B.pos[0] ? A : B;
	let inp = outt === A ? B : A;
	if (inp.tryAttachToOutput(outt, amount)) return 1;
	else if (inp.tryAttachToInput(outt, amount)) return 1;
	announce("Can't connect");
	return 0;
}


function tryDelete(element = _hovElement) {
	if (isInspecting) {announce("Can't do that while inspecting"); return 0;}
	if (element) element.onRemove();
	_selBox.deleteNodes();
}