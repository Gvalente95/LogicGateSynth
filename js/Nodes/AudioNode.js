const auCtx = new (window.AudioContext || window.webkitAudioContext)();
const masterGain = auCtx.createGain();
masterGain.gain.value = 0.5; // -6 dB
masterGain.connect(auCtx.destination);

class AudioNode extends Node {
	constructor(type, pos, value = 0) {
		super(pos, AudioNode.getSize(type));
		this.color = 'rgba(114, 67, 155, 0.47)';
		this.type = type;
		this.isUpdating = 0;
		this.lastPlayTime = 0;
		this.envelope = { "FREQ": 0, "RATE" : 1, "LFO": 0, "DETUNE": 0, "ATTACK": 0.005, "RELEASE": 0.01, "SUSTAIN": .01 };
		this.base     = { ...this.envelope };
		this.output = value;
		this.inLen = AudioNode.getInputLen(type);
		this.outLen = AudioNode.getOutputLen(type);
		this.initHandles();
		this.updateHandles();
		this.grid = null;
		this.loop();
	}

	static getSize(type) {
		const inp = AudioNode.getOutputLen(type);
		const outp = AudioNode.getInputLen(type);
		const max = Math.max(inp, outp);
		return ([120, 5 + max * 30]);
	}
	static getOutputLen(type) { return 1 };
	static getInputLen(type) {return 7;};

	initHandles(pos = this.pos, size = this.size) {
		this.handles = [];
		let hl = 20 * _scale;
		let inPos = [pos[0] - hl, pos[1] + hl / 2 + 3];
		var labels = Object.keys(this.envelope);
		for (let i = 0; i < this.inLen; i++){
			var h = new Handle(inPos, inPos, this, true);
			h.label = labels[i];
			this.handles.push(h);
			inPos[1] += 30 * _scale;
		}

		let outPos = [pos[0] + size[0] + hl, pos[1] + hl / 2 + 3];
		for (let i = 0; i < this.outLen; i++){
			var h = new Handle(outPos, outPos, this, false);
			this.handles.push(h);
			outPos[1] += 30 * _scale;
		}
	}

	updateInput() {
		this.updateHandles();
		const labels = Object.keys(this.envelope);
		for (let i = 0; i < labels.length; i++) {
			const h   = this.handles[i];
			if (!h) continue;
			const key = h.label;
			const out = h?.attach?.parent?.output;
			const val = Number(out);
			if (Number.isFinite(val) && val !== this.envelope[key]) log(`${key} set to ${val}`, this);
			this.envelope[key] = Number.isFinite(val) ? val : this.base[key];
		}
	}

	trigger() {
		this.playSine();
	}

	updateAudio() {
		this.updateInput();
		if (this.envelope['FREQ'] >= 1) this.trigger();
		this.lastPlayTime = performance.now();
		const out = this.outs[0];	
		if (out?.constructor.name === 'AudioNode') {
			const keys = Object.keys(this.envelope);
			for (let i = 0; i < this.inLen; i++){
				if (!out.handles[i].attach) {
					if (out.envelope[keys[i]] === this.envelope[keys[i]]) continue;
					out.envelope[keys[i]] = this.envelope[keys[i]];
					log(`Output's ${out.type}'${keys[i]} set to ${this.envelope[keys[i]]}`, this);
				}
			}
			out.envelope['FREQ'] = this.envelope['FREQ'];
			out.outout = this.output = this.envelope['FREQ'];
			out.lastPlayTime = -1;
			out.update();
			out.lastPlayTime = this.lastPlayTime;
		}
	}

	loop() {
		this.updateAudio();
		const out = this.envelope['FREQ'] ? this.envelope['FREQ'] + this.envelope['DETUNE'] * 100 : 0;
		this.setOutput(out);
		const period = Math.max(this.envelope['RATE'], .1) * 1000;
		setTimeout(() => {
			this.loop();
		}, period);
	}

	playSine() {
		const freq = this.envelope['FREQ'];
		if (!Number.isFinite(freq) || freq <= 0) return;

		const rate = clamp(this.envelope['RATE'], .1, 50);
		const rel = this.envelope['RELEASE'];
		const attack = clamp(this.envelope['ATTACK'], .0001, rate);
		const sustain = clamp(this.envelope['SUSTAIN'], .0001, rate);
		const detune = this.envelope['DETUNE'];
		const mod = this.envelope['LFO'];

		const osc  = auCtx.createOscillator();
		const gain = auCtx.createGain();

		const now     = auCtx.currentTime;

		osc.type = "sine";
		osc.frequency.setValueAtTime(freq, now);
		osc.detune.setValueAtTime(detune * 100, now);

		gain.gain.cancelScheduledValues(now);
		gain.gain.setValueAtTime(0.0001, now);

		const peak = 0.3;
		gain.gain.linearRampToValueAtTime(peak, now + attack); // fade in
		gain.gain.setValueAtTime(peak, now + attack + sustain); // hold
		gain.gain.linearRampToValueAtTime(0.0001, now + attack + sustain + rel); // fade out

		osc.connect(gain).connect(masterGain);


		const lfo = auCtx.createOscillator(); 
		const lfoGain = auCtx.createGain();
		lfo.frequency.setValueAtTime(5, now); // 5 Hz vibrato
		lfoGain.gain.setValueAtTime(mod, now); // mod = depth
		lfo.connect(lfoGain).connect(osc.frequency);
		lfo.start(now);
		lfo.stop(now + attack + sustain + rel);

		osc.start(now);
		osc.stop(now + attack + sustain + rel);
	}

	render(ctx, pos = this.pos) {
		super.render(ctx, toScrn(pos));
	}
}

function getPiano(includeMap = null, excludeMap = []) {
	const wSPread = 250;
	const hSpread = 100;

	const zoneX = 1000;
	const notesP = [zoneX, 50];
	const pitchP = [zoneX - 20, notesP[1] + hSpread];
	const paramP = [zoneX - 40, pitchP[1] + hSpread]
	const arpP = [zoneX + 20, paramP[1] + hSpread];
	const splitP = [zoneX, arpP[1] + 150];
	const scaleP = [zoneX, splitP[1] + 450];
	const oscP = [zoneX, scaleP[1] + hSpread];
	const addP = [zoneX, oscP[1] + 300];
	const orrP = [zoneX + 40, addP[1] + hSpread];
	const screenP = [50, 1000];



	if (!includeMap) includeMap = ["C", "D", "E", "F", "G", "A", "B", "C2"];
	const base = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
	const notes = [...base,...base.map(n => n + "2")];
	const baseP = [1000, _canvas.height / 2 + 300];
	const validNotes = [];
	for (const n of notes) {
		if (includeMap.length && !includeMap.includes(n)) continue;
		if (excludeMap.includes(n)) continue;
		validNotes.push(n);
	}
	const notesLen = validNotes.length;
	const params = { 'FREQ': 440, 'RATE': .01, 'LFO': 0, 'DETUNE': 0, 'ATTACK': .02, 'RELEASE': .1, 'SUSTAIN': .02 };
	const limits = { 'FREQ': [40, 4000], 'RATE': [0, 2], 'LFO': [-200, 200], 'DETUNE': [-64, 64], 'ATTACK': [0, 10], 'RELEASE': [0, 10], 'SUSTAIN': [0, 10]};

	const paramNames = Object.keys(params);
	var am = ([2, 4, 8].find(n => notesLen <= n) || 16);

	var splitters = [];
	for (let i = 0; i < paramNames.length; i++) {
		const p = paramNames[i];
		const spreadX = wSPread * i;
		const paramNode = initAndAdd(ValNode, 'NUM', [paramP[0] + spreadX, paramP[1]]);
		paramNode.minValue = limits[p][0]; paramNode.maxValue = limits[p][1];
		setNameAndHideType(paramNode, p, params[p]);
		paramNode.hideProperty('type');

		const splitter = initAndAdd(SplitNode, "SPLIT" + am, [splitP[0] + spreadX, splitP[1]]);
		paramNode.tryAttachToElement(splitter, paramNode.handles[0]);
		splitters.push(splitter);
	}

	const auNodes = [];
	const keys = [];
	const arpTriggs = [];
	var posX = 0;
	for (let i = 0; i < notes.length; i++) {
		const note = notes[i];
		if (!validNotes.includes(note)) continue;
		const osc = initAndAdd(AudioNode, note, [oscP[0] + posX, oscP[1]]);
		auNodes.push(osc);
		osc.place();
		const detAdder = initAndAdd(OppNode, 'ADD', [addP[0] + posX, addP[1]]);
		const detuneNode = initAndAdd(ValNode, "NUM", [pitchP[0] + posX, pitchP[1]]);
		setNameAndHideType(detuneNode, 'Pitch', i);
		osc.tryAttachToElement(detAdder, osc.handles[3]);
		detAdder.tryAttachToElement(detuneNode);
		detAdder.tryAttachToElement(splitters[3]);

		for (let v = 0; v < paramNames.length; v++){
			const param = paramNames[v];
			if (param === 'FREQ') {
				const scale = initAndAdd(OppNode, 'SCALE', [scaleP[0] + posX, scaleP[1]]);
				scale.tryAttachToElement(splitters[v]);
				osc.tryAttachToElement(scale, osc.handles[0]);

				const noteTrigger = initAndAdd(ValNode, 'BOOL', [notesP[0] + posX, notesP[1]]);
				setNameAndHideType(noteTrigger, note, 0);

				const orr = initAndAdd(GateNode, 'OR', [orrP[0] + posX, orrP[1]], null, scale);
				orr.tryAttachToElement(noteTrigger, orr.handles[0]);
				keys.push(orr);

				const arpTrigger = initAndAdd(ValNode, 'BOOL', [arpP[0] + posX, arpP[1]], null, scale);
				setNameAndHideType(arpTrigger, "ARP_" + note, 1);
				arpTriggs.push(arpTrigger);
			}
			else osc.tryAttachToElement(splitters[v], osc.handles[v]);
		}
		posX += wSPread;
	}

	const vpx = baseP[0] - 540; vpy = baseP[1] - 600;
	const val = initAndAdd(ValNode, 'NUM', [vpx, vpy - 350]); val.setOutput(10); val.setName('SPD'); val.hideProperty('type'); val.minValue = 0;
	const arp = initAndAdd(ValNode, 'BOOL', [vpx + 200, vpy - 400]);
	arp.setName('ARP');	
	const spl = initAndAdd(SplitNode, 'SPLIT4', [vpx - 200, vpy - 100]);
	const not = initAndAdd(GateNode, 'NOT', [vpx - 200, vpy + 250], spl);
	const sub = initAndAdd(OppNode, 'SUB', [vpx - 200, vpy + 400], not)
	const mult = initAndAdd(OppNode, 'SCALE', [vpx + 200, vpy], val);
	mult.tryAttachToOutput(spl);
	spl.tryAttachToElement(mult, spl.handles[0]);
	const sccl = initAndAdd(OppNode, 'SCALE', [vpx - 180, vpy + 120], null, sub);
	sccl.tryAttachToOutput(spl);
	arp.tryAttachToInput(spl);

	const px = vpx + 200, py = vpy + 200;
	const incr = initAndAdd(ValNode, 'INCR', [px, py], null, sccl);

	const ppx = px - 200, ppy = py - 71;

	const spd = initAndAdd(ValNode, 'NUM', [ppx, ppy], mult, incr);
	const start = initAndAdd(ValNode, 'NUM', [ppx - 50, ppy - 300], null, incr);
	setNameAndHideType(start, 'START', 0); start.minValue = 0; start.maxValue = notesLen;
	const end = initAndAdd(ValNode, 'NUM', [ppx + 200, ppy - 300], null, incr); 
	setNameAndHideType(end, 'END', notesLen - 1); end.minValue = 0; end.maxValue = notesLen;

	const spx = px - 280, spy = ppy + 550;
	const selector = initAndAdd(SelNode, 'ARP' + am, [spx - 160, spy], sub);
	var SCREEN = initAndAdd(DisplayNode, 'SCREEN' + am, [0, 0]);
	for (let i = 0; i < notesLen; i++){
		const ppp = [spx + 500, spy + 100 * (i + 2 - am / 2)];

		const and = initAndAdd(GateNode, 'AND', [ppp[0] - 140, ppp[1]], null, keys[i]);
		and.tryAttachToOutput(arpTriggs[i]);
		setNameAndHideType(and, validNotes[i]);

		const split = initAndAdd(SplitNode, 'SPLIT4', [ppp[0] - 450 + (120 * (i % 2 !== 0)), ppp[1]]);
		selector.tryAttachToElement(split, selector.handles[i + 1]);
		split.tryAttachToElement(and, split.handles[0]);
		keys[i].tryAttachToElement(val);
		auNodes[i].tryAttachToInput(SCREEN);
	}
	SCREEN.place([_canvas.width - SCREEN.size[0] - 50, screenP[1]]);
	_renameNode = null;
	setTimeout(() => markObstaclesDirty(), 400);
}


function setNameAndHideType(node, name, output = null) {
	node.setName(name);
	node.hideProperty('type');
	if (output) node.output = output;
}