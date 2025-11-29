const auCtx = new (window.AudioContext || window.webkitAudioContext)();
const masterGain = auCtx.createGain();
masterGain.gain.value = 0.5; // -6 dB
masterGain.connect(auCtx.destination);

class OscNode extends Node {
  constructor(type, pos, value = 0) {
    super(pos, OscNode.getSize(type));
    this.color = "rgba(120, 90, 147, 1)";
    this.type = type;
    this.isUpdating = 0;
    this.lastPlayTime = 0;
    this.envelope = {
      FREQ: 0,
      RATE: 0.1,
      LFO: 0,
      DETUNE: 0,
      ATTACK: 0.005,
      RELEASE: 0.05,
      SUSTAIN: 0.1,
      CUTOFF: 3000,
      RESO: 0.5,
    };
    this.base = { ...this.envelope };
    this.output = value;
    this.lastNoteEnd = 0;
    this.on = false;
    this.inLen = OscNode.getInputLen(type);
    this.outLen = OscNode.getOutputLen(type);
    this.initHandles();
    this.updateHandles();
    this.grid = null;
    this.loop();
  }

  static getSize(type) {
    const inp = OscNode.getOutputLen(type);
    const outp = OscNode.getInputLen(type);
    const max = Math.max(inp, outp);
    return [120, 5 + max * 30];
  }
  static getOutputLen(type) {
    return 1;
  }
  static getInputLen(type) {
    return 9;
  }

  initHandles(pos = this.pos, size = this.size) {
    this.handles = [];
    let hl = 20 * _scale;
    let inPos = [pos[0] - hl, pos[1] + hl / 2 + 3];
    var labels = Object.keys(this.envelope);
    for (let i = 0; i < this.inLen; i++) {
      var h = new Handle(inPos, inPos, this, true);
      h.label = labels[i];
      this.handles.push(h);
      inPos[1] += 30 * _scale;
    }

    let outPos = [pos[0] + size[0] + hl, pos[1] + hl / 2 + 3];
    for (let i = 0; i < this.outLen; i++) {
      var h = new Handle(outPos, outPos, this, false);
      this.handles.push(h);
      outPos[1] += 30 * _scale;
    }
  }

  updateInput() {
    this.updateHandles();
    const labels = Object.keys(this.envelope);
    for (let i = 0; i < labels.length; i++) {
      const h = this.handles[i];
      if (!h) continue;
      const key = h.label;
      const out = h?.attach?.parent?.output;
      const val = Number(out);
      if (Number.isFinite(val) && val !== this.envelope[key]) log(`${key} set to ${val}`, this);
      const newK = Number.isFinite(val) ? val : this.base[key];
      if (key === "FREQ") {
        const on = newK > 0;
        if (!this.on && on && this.envelope["RATE"] <= 0) {
          this.envelope[key] = val;
          this.trigger();
        }
        this.on = on;
      }
      this.envelope[key] = newK;
    }
  }

  trigger() {
    this.playSine();
  }

  updateAudio() {
    this.updateInput();
    if (this.envelope["FREQ"] >= 1 && this.envelope["RATE"] > 0) this.trigger();
    this.lastPlayTime = performance.now();
    const out = this.outs[0];
    if (out?.constructor.name === "OscNode") {
      const keys = Object.keys(this.envelope);
      for (let i = 0; i < this.inLen; i++) {
        if (!out.handles[i].attach) {
          if (out.envelope[keys[i]] === this.envelope[keys[i]]) continue;
          out.envelope[keys[i]] = this.envelope[keys[i]];
          log(`Output's ${out.type}'${keys[i]} set to ${this.envelope[keys[i]]}`, this);
        }
      }
      out.envelope["FREQ"] = this.envelope["FREQ"];
      out.outout = this.output = this.envelope["FREQ"];
      out.lastPlayTime = -1;
      out.update();
      out.lastPlayTime = this.lastPlayTime;
    }
  }

  loop() {
    this.updateAudio();
    const out = this.envelope["FREQ"] ? this.envelope["FREQ"] + this.envelope["DETUNE"] * 100 : 0;
    this.setOutput(out);
    const period = Math.max(this.envelope["RATE"], 0.1) * 1000;
    setTimeout(() => {
      this.loop();
    }, period);
  }

  playSine() {
    const freq = this.envelope["FREQ"];
    if (!Number.isFinite(freq) || freq <= 0) return;

    const rate = clamp(this.envelope["RATE"], 0.1, 50);
    const rel = this.envelope["RELEASE"];
    const attack = clamp(this.envelope["ATTACK"], 0.0001, rate);
    const sustain = clamp(this.envelope["SUSTAIN"], 0.0001, rate);
    const detune = this.envelope["DETUNE"];
    const mod = this.envelope["LFO"];
    const cutoff = this.envelope["CUTOFF"];
    const resonance = this.envelope["RESO"];

    const osc = auCtx.createOscillator();
    const gain = auCtx.createGain();
    const filter = auCtx.createBiquadFilter();

    const now = auCtx.currentTime;

    osc.type = String(this.type).toLowerCase();
    osc.frequency.setValueAtTime(freq, now);
    osc.detune.setValueAtTime(detune * 100, now);
    console.warn(osc.type);

    // ---- FILTER ----
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(cutoff, now); // cutoff variable
    filter.Q.setValueAtTime(resonance, now); // resonance / "Q"

    // ---- AMP ENVELOPE ----
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(0.0001, now);

    const peak = 0.3;
    gain.gain.linearRampToValueAtTime(peak, now + attack);
    gain.gain.setValueAtTime(peak, now + attack + sustain);
    gain.gain.linearRampToValueAtTime(0.0001, now + attack + sustain + rel);

    // ---- CHAIN ----
    osc.connect(filter).connect(gain).connect(masterGain);

    // ---- LFO ----
    const lfo = auCtx.createOscillator();
    const lfoGain = auCtx.createGain();
    lfo.frequency.setValueAtTime(5, now);
    lfoGain.gain.setValueAtTime(mod, now);
    lfo.connect(lfoGain).connect(osc.frequency);

    lfo.start(now);
    lfo.stop(now + attack + sustain + rel);

    osc.start(now);
    osc.stop(now + attack + sustain + rel);
    this.lastNoteEnd = now + attack + sustain + rel;
  }

  render(ctx, pos = this.pos) {
    const p = toScrn(pos);
    const s = this.size;
    super.render(ctx, p);
    drawCircle(ctx, [p[0] + this.size[0] - 20, p[1] + 20], 2, this.on ? "yellow" : "black", "grey", 2);
    if (pointInRect(_mouse.pos, [p[0], p[1] - 40], [s[0], 40])) {
      _renameHov = this;
      document.body.style.cursor = "pointer";
      if (_mouse.clicked) {
        const types = ["SINE", "SQUARE", "TRIANGLE", "SAWTOOTH"];
        var idx = types.indexOf(this.type);
        if (idx < 0 || idx >= types.length - 1) idx = 0;
        else idx++;
        this.type = types[idx];
        this.name = types[idx];
      }
    }
  }
}

function getPiano(includeMap = null, excludeMap = []) {
  const wSPread = 225;
  const hSpread = 125;

  const zoneX = 1300;
  const notesP = [zoneX, 200];
  const pitchP = [zoneX - 20, notesP[1] + hSpread];
  const paramP = [100, 100];
  const arpP = [zoneX + 20, pitchP[1] + hSpread];
  const scaleP = [zoneX, arpP[1] + hSpread];
  const oscP = [zoneX, scaleP[1] + hSpread];
  const addP = [zoneX, oscP[1] + 350];
  const orrP = [zoneX + 40, addP[1] + hSpread];
  const screenP = [50, 1000];

  if (!includeMap) includeMap = ["C", "D", "E", "F", "G", "A", "B", "C2"];
  const base = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const notes = [...base, ...base.map((n) => n + "2")];
  const validNotes = [];
  for (const n of notes) {
    if (includeMap.length && !includeMap.includes(n)) continue;
    if (excludeMap.includes(n)) continue;
    validNotes.push(n);
  }
  const notesLen = validNotes.length;
  const params = {
    FREQ: 440,
    RATE: 0.1,
    LFO: 0,
    DETUNE: -32,
    ATTACK: 0,
    RELEASE: 0,
    SUSTAIN: 0.2,
    CUTOFF: 300,
    RESO: 0.5,
  };
  const limits = {
    FREQ: [40, 4000],
    RATE: [0, 2],
    LFO: [-200, 200],
    DETUNE: [-32, 32],
    ATTACK: [0, 10],
    RELEASE: [0, 10],
    SUSTAIN: [0, 10],
    CUTOFF: [100, 5000],
    RESO: [-20, 20],
  };

  const paramNames = Object.keys(params);
  var am = [2, 4, 8].find((n) => notesLen <= n) || 16;

	var rateSpl;
  var splitters = [];
  for (let i = 0; i < paramNames.length; i++) {
    const p = paramNames[i];
    const spreadX = wSPread * i;
	  const curP = [paramP[0], paramP[1] + i * 140];
    const paramNode = initAndAdd(ValNode, "NUM", curP);
    paramNode.setValueType(limits[p][0], limits[p][1], p !== "FREQ" && p !== "CUTOFF" && p !== 'DETUNE');
    setNameAndHideType(paramNode, p, params[p]);
	paramNode.hideProperty("type");
	//   const splitter = initAndAdd(SplitNode, "SPLIT" + am, [splitP[0] + spreadX, splitP[1]]);
    const splitter = initAndAdd(SplitNode, "SPLIT" + am, [curP[0] + (i % 2 === 0 ? 200 : 300), curP[1]]);

	  splitters.push(splitter);
	  if (p === "RATE") {
		  paramNode.format = "s";
		  rateSpl = initAndAdd(SplitNode, 'SPLIT2', [curP[0] + 600, curP[1]]);
	    	paramNode.tryAttachToElement(rateSpl, paramNode.handles[0]);
    	rateSpl.tryAttachToElement(splitter, rateSpl.handles[0]);
	  }
	  else paramNode.tryAttachToElement(splitter, paramNode.handles[0]);
  }

  const auNodes = [];
  const keys = [];
  const arpTriggs = [];
  var posX = 0;
  var nIndex = 1;
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    if (!validNotes.includes(note)) continue;
    const osc = initAndAdd(OscNode, "SAWTOOTH", [oscP[0] + posX, oscP[1]]);
    setNameAndHideType(osc, osc.type + "_" + note);
    auNodes.push(osc);
    osc.place();
    const detAdder = initAndAdd(OppNode, "ADD", [addP[0] + posX, addP[1]]);
    const detuneNode = initAndAdd(ValNode, "NUM", [pitchP[0] + posX, pitchP[1]]);
    setNameAndHideType(detuneNode, "Pitch", i);
    detuneNode.setValueType(-32, 32, false);
    osc.tryAttachToElement(detAdder, osc.handles[3]);
    detAdder.tryAttachToElement(detuneNode);
    detAdder.tryAttachToElement(splitters[3]);

    for (let v = 0; v < paramNames.length; v++) {
      const param = paramNames[v];
      if (param === "FREQ") {
        const scale = initAndAdd(OppNode, "SCALE", [scaleP[0] + posX, scaleP[1]]);
        scale.tryAttachToElement(splitters[v]);
        osc.tryAttachToElement(scale, osc.handles[0]);

        const noteTrigger = initAndAdd(ValNode, "BOOL", [notesP[0] + posX, notesP[1]]);
        setNameAndHideType(noteTrigger, note, 0);
        noteTrigger.connectToKey(nIndex.toString());

        const orr = initAndAdd(GateNode, "OR", [orrP[0] + posX, orrP[1]], null, scale);
        orr.tryAttachToElement(noteTrigger, orr.handles[0]);
        keys.push(orr);

        const arpTrigger = initAndAdd(ValNode, "BOOL", [arpP[0] + posX, arpP[1]], null, scale);
        setNameAndHideType(arpTrigger, "ARP_" + note, 1);
        arpTriggs.push(arpTrigger);
      } else osc.tryAttachToElement(splitters[v], osc.handles[v]);
    }
    posX += wSPread;
    nIndex++;
  }

  const x = notesP[0] - 300;
  const y = notesP[1] - 200;

  const arp = initAndAdd(ValNode, "BOOL", [x, y + hSpread * 2]);
  setNameAndHideType(arp, "ARP");
  arp.connectToKey("shift", true);

  const spl = initAndAdd(SplitNode, "SPLIT4", [x - 350, y + hSpread * 7]);
  const not = initAndAdd(GateNode, "NOT", [x - 200, y + hSpread * 4], spl);
  const sub = initAndAdd(OppNode, "SUB", [x - 200, y + hSpread * 5], not);
	const mult = initAndAdd(OppNode, "SCALE", [x - 200, y + hSpread * 6], rateSpl);
	mult.isFloat = true;
  mult.tryAttachToOutput(spl);
  spl.tryAttachToElement(mult, spl.handles[0]);
  const sccl = initAndAdd(OppNode, "SCALE", [x - 400, y + hSpread * 5], null, sub);
  sccl.tryAttachToOutput(spl);
  arp.tryAttachToInput(spl);

  const incr = initAndAdd(ValNode, "INCR", [x, y + 450], null, sccl);

  const spd = initAndAdd(ValNode, "NUM", [x - 400, y + hSpread * 4], mult, incr);
	setNameAndHideType(spd, "SCL > INCR");
  const start = initAndAdd(ValNode, "NUM", [x, y + hSpread * 2], null, incr);
  setNameAndHideType(start, "START", 0);
  start.setValueType(-32, 32, false);
  const end = initAndAdd(ValNode, "NUM", [x, y + hSpread * 3], null, incr);
  setNameAndHideType(end, "END", notesLen - 1);
  end.setValueType(-32, 32, false);
  const spx = x - 280,
    spy = y + 900;
  const selector = initAndAdd(SelNode, "ARP" + am, [spx, spy], sub);
//   var SCREEN = initAndAdd(DisplayNode, "DISPL" + am, [0, 0]);
  for (let i = 0; i < notesLen; i++) {
    const ppp = [spx + 500, spy + 100 * (i + 2 - am / 2)];

    const and = initAndAdd(GateNode, "AND", [ppp[0] - 140, ppp[1]], null, keys[i]);
    and.tryAttachToOutput(arpTriggs[i]);
    setNameAndHideType(and, validNotes[i]);

    const vNum = initAndAdd(ValNode, "NUM", [ppp[0] - 450 + 120, ppp[1]]);
    selector.tryAttachToElement(vNum, selector.handles[i + 1]);
    vNum.tryAttachToElement(and, vNum.handles[0]);
    // auNodes[i].tryAttachToInput(SCREEN);
  }
//   SCREEN.place([_canvas.width - SCREEN.size[0] - 50, screenP[1]]);
  _renameNode = null;
  setTimeout(() => markObstaclesDirty(), 800);
}

function setNameAndHideType(node, name, output = null) {
  node.setName(name);
  node.hideProperty("type");
  if (output) node.output = output;
}
