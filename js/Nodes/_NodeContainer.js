var isInspecting = false;

var savedContainers = {}

class NodeContainer extends Node{
	constructor(type, pos, name = "?", system = []){
		super(pos, [120, 100]);
		this.name = name;
		this.type = type;
		this.output = 0;
		this.color = "rgba(35, 180, 168, 1)";
		this.ins = [];
		this.outs = [];
		this.innerInHandles = [];
		this.innerOutHandles = [];
		if (system) this.init(system);
	}

	save() {
		if (!savedContainers[this.structure]) {
			savedContainers[this.structure] = { "TYPE": this.type, 'NAME': this.name };
			_menu[this.name + '_' + this.id] = savedContainers[this.structure];
		}
		log(`WAS SAVED`, this);
	}

	initFromStructure(structure) {
		this.structure = structure;
		this.system = this.deployStructure(structure);
		this.sys = getNodesCopy(this.system);

		this.linkLines(this.sys, this.structure);
		this.initHandles(this.pos);
		this.updateHandles();

		let am = Math.max(this.ins.length, this.outs.length);
		this.size[1] = am * 24 + 10;
		log("INIT FROM STRUCTURE\n	" + this.structure["Tokens"] + "\n" + this.structure["Structure"], this);
	}

	init(system) {
		this.system = system;
		this.initHandles(this.pos);
		this.updateHandles();
		let am = Math.max(this.ins.length, this.outs.length);
		this.size[1] = (am) * 24 + 10;
		this.structure = this.initStructure();
		this.sys = this.deployStructure();
		this.linkLines(this.sys);
		log("INIT\n	" + this.structure['Tokens'] + "\n" + this.structure['Structure'], this);
	}

	initStructure(sys = this.system) {
		const counts = new Map();
		const indexOf = new Map(sys.map((n, i) => [n, i]));
		const tokens = [];

		for (let i = 0; i < sys.length; i++) {
			const e = sys[i];
			if (!e) continue;
			const base = `${e.constructor.name}|${e.type}|${e.pos}|`;
			const k = counts.get(base) || 0;
			counts.set(base, k + 1);
			let token = `${base}${k}`;

			if (e.structure !== undefined) {
				const json = JSON.stringify(e.structure);
				const b64 = btoa(unescape(encodeURIComponent(json)));
				token += `[${b64}]`;
			}
			tokens.push(token);
		}

		const lines = [];
		for (let i = 0; i < sys.length; i++) {
			const e = sys[i];
			if (!e) continue;
			const outHandles = [];
			for (const h of e.handles || []) {
				if (h.isInput || !h.attach) continue;
				const j = indexOf.get(h.attach.parent);
				if (j !== undefined) outHandles.push(j);
			}

			lines.push(outHandles.length ? `${i}>${outHandles.join(">")}` : `${i}`);
		}
		return { Tokens: tokens, Structure: lines.join("\n") };
	}

	setInnerHandles() {
		if (!this.sys || this.sys === undefined) return;
		this.innerInHandles = [];
		this.innerOutHandles = [];
		for (const n of this.sys) {
			for (const h of n.handles) {
				if (h.attach) continue;
				if (h.isInput) this.innerInHandles.push(h);
				else this.innerOutHandles.push(h);
			}
		}
	}

	linkLines(sys = this.sys, struct = this.structure) {
		const lines = String(struct.Structure || "").split("\n").filter(Boolean);
		for (const line of lines) {
			const [srcStr, ...dstStrs] = line.split(">");
			const src = +srcStr;
			for (const d of dstStrs) {
				const dst = +d;
				const a = sys[src], b = sys[dst];
				if (!a || !b) continue;
				const out = (a.handles || []).find(h => !h.isInput && !h.attach);
				const inp = (b.handles || []).find(h => h.isInput && !h.attach);
				if (out && inp) { out.attach = inp; inp.attach = out; }
			}
		}
		this.setInnerHandles();
	}

	deployStructure(struct = this.structure) {
		const tokens = (struct.Tokens || []).map(parseToken);
		const sys = [];

		for (let i = 0; i < tokens.length; i++) {
			const tok = tokens[i];
			if (!tok) continue;
			const C = (_NodesRegistry[tok.ctor]) || globalThis[tok.ctor];
			if (!C) throw new Error(`Constructor not found: ${tok.ctor}`);
			let node;
			if (tok.ctor === "NodeContainer") {
				node = new C(tok.type, [0, 0], "NodeContainer");

				let payload = tok.payload;
				if (typeof payload === "string") {
					try {
						const json = decodeURIComponent(escape(atob(payload)));
						payload = JSON.parse(json);
						if (payload && payload.Tokens && payload.Structure)
							node.initFromStructure(payload);
					} catch (e) {
						log("Failed to decode container payload:" + e, this);
					}
				}
			} else
				node = tok.payload == null ? new C(tok.type, [0, 0]) : new C(tok.type, [0, 0], tok.payload);

			let pos = [0, 0];
			if (tok.pos) {
				const parts = String(tok.pos).split(",");
				if (parts.length >= 2) {
					const x = +parts[0];
					const y = +parts[1];
					if (!Number.isNaN(x) && !Number.isNaN(y))
						pos = [x, y];
				}
				node.place(pos);
			}
			node.parent = this;
			sys.push(node);
			log("NODE ADDED: " + node.type + node.pos, this);
		}
		return sys;
	}

	centerSysElements() {
		const sys = this.sys;
		const n = sys.length;
		const idx = new Map(sys.map((e,i)=>[e,i]));
		const outs = Array.from({length:n},()=>[]);
		const indeg = new Array(n).fill(0);
		for (let i=0;i<n;i++){
			const e=sys[i];
			for (const h of e.handles||[]){
				if (h && !h.isInput && h.attach){
					const j = idx.get(h.attach.parent);
					if (j!=null){ outs[i].push(j); indeg[j]++; }
				}
			}
		}
		const q=[]; const depth=new Array(n).fill(-1);
		for (let i=0;i<n;i++) if (indeg[i]===0) { depth[i]=0; q.push(i); }
		while(q.length){
			const u=q.shift();
			for(const v of outs[u]){
				if (depth[v]<depth[u]+1) depth[v]=depth[u]+1;
				if (--indeg[v]===0) q.push(v);
			}
		}
		const unreached = [];
		for (let i=0;i<n;i++) if (depth[i]<0){ depth[i]=0; unreached.push(i); }
		const maxD = depth.reduce((a,b)=>Math.max(a,b),0);
		const layers = Array.from({length:maxD+1},()=>[]);
		for (let i=0;i<n;i++) layers[depth[i]].push(i);
		for (let d=0; d<layers.length; d++){
			layers[d].sort((a,b)=>{
				const ain = (sys[a].handles||[]).filter(h=>h&&h.isInput&&h.attach).map(h=>idx.get(h.attach.parent));
				const bin = (sys[b].handles||[]).filter(h=>h&&h.isInput&&h.attach).map(h=>idx.get(h.attach.parent));
				const ka = ain.length?Math.min(...ain):a;
				const kb = bin.length?Math.min(...bin):b;
				return ka-kb || a-b;
			});
		}
		let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
		const W = window.innerWidth, H = window.innerHeight;
		const marginX = 160, marginY = 60;
		const cols = layers.length || 1;
		const colW = (W - 2*marginX) / Math.max(1, cols-1);
		for (let d=0; d<layers.length; d++){
			const col = layers[d];
			const rows = col.length || 1;
			const totalH = rows*100 + (rows-1)*marginY;
			let y0 = (H - totalH)/2;
			for (let r=0;r<col.length;r++){
				const i = col[r];
				const x = marginX + d*colW;
				const y = y0 + r * (100 + marginY);
				const e = sys[i];
				e.place([x, y]);
				const w = e.size?.[0] || 0, h = e.size?.[1] || 0;
				minX = Math.min(minX, x); minY = Math.min(minY, y);
				maxX = Math.max(maxX, x + w); maxY = Math.max(maxY, y + h);
			}
		}
		const sinks = [];
		for (let i=0;i<n;i++){
			const hasOut = (sys[i].handles||[]).some(h=>h && !h.isInput && h.attach);
			if (!hasOut) sinks.push(i);
		}
		for (const i of sinks){
			const d = maxD;
			const x = marginX + d*colW;
			const y = sys[i].pos[1];
			sys[i].place([x,y]);
		}
		const sw = maxX - minX;
		const sh = maxY - minY;
		const centerX = minX + sw / 2;
		const centerY = minY + sh / 2;
		const screenX = _canvas.width / 2;
		const screenY = _canvas.height / 2;
		const dx = screenX - centerX;
		const dy = screenY - centerY;
		for (const s of sys)
			s.place([s.pos[0] + dx, s.pos[1] + dy]);
	}

	initHandles(pos = this.pos, size = this.size) {
		this.handles = [];

		const base = this.sys || this.system || [];
		const hs = base.flatMap(e => e?.handles ?? []);

		const ins = hs.filter(h => h?.isInput && !h.attach);
		const outs = hs.filter(h => h && !h.isInput && !h.attach);

		let hl = 20 * _scale;
		let inY = pos[1] + hl;
		for (const _ of ins) {
			const p = [pos[0] - hl, inY];
			const h = new Handle(p, p, this, true);
			this.handles.push(h);
			_.attach = h;
			if (_.label) h.label = _.label;
			inY += 24;
		}

		let outY = pos[1] + hl;
		for (const _ of outs) {
			const p = [pos[0] + size[0] + hl, outY];
			const h = new Handle(p, p, this, true);
			this.handles.push(h);
			if (_.label) h.label = _.label;
			outY += 24;
		}
	}


	render(ctx, color = this.color, error = false) {
		const pos = toWorld(this.pos);
		super.render(ctx, pos, this.size, color, error);
		if (pointInRect(_mouse.pos, [pos[0], pos[1] - 40], [this.size[0], 40])) {
			document.body.style.cursor = "Text";
			if (_mouse.clicked && !_selBox.active) {
				Node.renameNodeProperty(this, 'name', 'NodeContainer');
			}
		}
	}
 
	setOutput() {
		log("");

		var hasOutput = 0;
		this.output = 0;

		for (let i = 0; i < this.innerOutHandles.length; i++) {
			const innerOut = this.innerOutHandles[i];
			if (!innerOut) continue;
			log("FOUND InnerOut: " + innerOut.parent.type, this);
			this.output = innerOut.parent?.output;
			if (this.output) {
				log("OUTPUT WAS SET TO " + innerOut.parent.type + "'s OUTPUT: " + this.output, this);
				hasOutput = 1;
			}
			const outterOutNode = this.outs[i];
			if (!outterOutNode) continue;
			outterOutNode.updateInput();
			this.output = 0;
		}
		if (hasOutput) this.output = 1;
	}

	updateInput(fromHandle = null) {
		log("");
		for (const n of this.sys) n.place();
		if (fromHandle) {
			var handleIndex = this.handles.indexOf(fromHandle);
			if (handleIndex < 0 || handleIndex > this.ins.length) {
				log("RECEIVED INPUT FROM HANDLE AT UNVALID INDEX " + handleIndex + " (RETURNING)", this, 'red');
				return;
			}
			log("RECEIVED INPUT FROM HANDLE AT INDEX " + handleIndex, this);
			const outterIn = this.ins[handleIndex];
			const innerIn = this.innerInHandles[handleIndex];
			if (innerIn && outterIn) {
				log("SETTING (inner input)" + innerIn.parent.type + "_" + innerIn.parent.id + " OUTPUT TO " + outterIn.output, this);
				innerIn.parent.setOutput(outterIn.output);
			}
		}
		else {
			let maxI = Math.min(this.innerInHandles.length, this.ins.length);
			log("RECEIVED GLOBAL INPUT - No handles specified - Updating all innerIns(" + maxI + ")", this);
			for (let i = 0; i < maxI; i++) {
				const outterIn = this.ins[i];
				const innerIn = this.innerInHandles[i];
				if (!innerIn.parent) continue;
				const out = outterIn ? outterIn.output : 0;
				log("UPDATED InnerIn at port " + i + "[" + innerIn.parent.type + "_" + innerIn.parent.id + "]'s OUTPUT TO " + out, this);
				innerIn.parent.setOutput(out);
			}
		}
		this.setOutput();
	}

	update() {
		this.updateInput();
	}

	onInspect() {
		pushNcStack(this);
		displayContainer(this);
		_selElement = null;
		_hovElement = null;
		_selBox.clearNodes();
		document.body.style.cursor = "default";
	}
}

function JoinSelGroup(group = _selBox.nodes) {
	if (!group.length) return;
	const positions = group.map(n => n.pos);
	const nc = new NodeContainer("NodeContainer", averagePositions(positions), "NC", group);
	_nodes.push(nc);
	for (const n of _nodes) {
		if (group.includes(n)) { continue }
		for (const h of n.handles) {
			if (!h.attach) continue;
			if (group.includes(h.attach.parent))
				n.tryAttachToElement(nc, h);
		}
	}
	Node.renameNodeProperty(nc, "name", "NodeContainer");
	_selBox.deleteNodes();
	_selBox.reset();
}

function tryJoinGroup(group = _selBox.nodes) {
	if (isInspecting) { announce("can't do that while inspecting"); return; }
	if (!group || group.length <= 1) {
		announce("Group needs to have 2 elements");
		return;
	}
	const ret = validateGroupNode(group, true);
	if (ret.ok)
		JoinSelGroup(group);
}

function getGroupNodeError(e) {
	if (!e?.handles)
		return `Error: Element ${e?.type ?? "Unknown"} has no handles.`;
	let hasAttach = false;
	for (const h of e.handles) {
		if (!h) continue;
		if (h.attach) hasAttach = true;
	}
	if (!hasAttach)
		return `Error: Element ${e.type} has no attach.`;
	return null;
}

function validateGroupNode(group, logError = false) {
	let groupInput = [], groupOutput = [];

	for (const e of group) {
		const err = getGroupNodeError(e);
		if (err) {
			if (logError) announce(err);
			return { ok: false, element: e, error: err };
		}
		for (const h of e.handles) {
			if (!h.attach) {
				if (h.isInput) groupInput.push(h);
				else groupOutput.push(h);
			}
		}
	}
	if (!groupOutput.length && !groupInput.length) {
		var error = "Error: No Output and no Input.";
		if (logError) announce(error);
		return { ok: false, element: null, error: error };
	}
	return { ok: true, element: null, error: null };
}

function parseToken(t) {
	let ctor, type, pos, payload = null;
	const payloadMatch = t.match(/\[(.*)\]$/);
	if (payloadMatch) {
		payload = payloadMatch[1];
		t = t.replace(/\[.*\]$/, "");
	}
	const parts = t.split("|");
	if (parts.length < 2) return null;
	ctor = parts[0]; type = parts[1]; pos = parts[2];
	return { ctor, type, pos, payload };
}

function pushNcStack(Nc) {
	_NcStack.push(Nc);
}

function prevNcStack() {
	if (!_NcStack.length) return;
	var nc = _NcStack[_NcStack.length - 1];
	const check = validateGroupNode(_nodes);
	if (!check.ok) {
		announce(check.error);
		return;
		nc.init(nc.system);
	}
	_NcStack.pop();
	if (!_NcStack.length) {
		_nodes = _savedNodes;
		isInspecting = false;
		_savedNodes = null;
	}
	else displayContainer();
}

_savedNodes = null;
function displayContainer(Nc = _NcStack[_NcStack.length - 1]) {
	if (!_savedNodes)
		_savedNodes = _nodes;
	isInspecting = true;
	// for (const n of Nc.sys)
	// 	n.place();
	_nodes = Nc.sys;
	_camera.clearPosition();
	_menu.clear();
}
