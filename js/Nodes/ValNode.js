class ValNode extends Node {
  constructor(type, pos) {
    super(pos, ValNode.getSize(type));
    this.color = "rgba(80, 183, 120, 1)";
    this.output = 0;
    this.isSlider = false;
    this.isFloat = true;
    this.dir = ">";
    this.curDir = this.dir;
    this.format = "";
    this.initType(type);
    this.initHandles(this.pos, this.size);
    this.updateHandles();
    this.place();
  }

  initType(type) {
    this.type = type;
    if (type === "RAND") {
      this.speed = 1;
      this.min = 0;
      this.max = 100;
      this.output = this.getValue();
    } else if (this.type === "INCR") {
      this.wait = 0.1;
      this.start = 0;
      this.end = 100;
      this.output = this.start;
    } else if (type === "NUM") {
      this.output = "0";
      Node.renameNodeProperty(this, "output", "1");
    }
  }

  static getSize(type) {
    let nIn = ValNode.getInputAmount(type);
    let nOut = ValNode.getOutputAmount(type);
    let max = Math.max(nIn, nOut);

    let W = 125 + (type === "RAND" || type === "INCR" ? 40 : 0);
    let H = 20 + max * 30;
    return [W, H];
  }
  static getOutputAmount(type) {
    return 1;
  }
  static getInputAmount(type) {
    return type === "INCR" ? 3 : type === "TIME" ? 0 : type === "RAND" ? 3 : 1;
  }

  initHandles(pos = this.pos, size = this.size) {
    this.handles = [];
    let hl = 20 * _scale;
    let hPos = [pos[0] + size[0] + hl, pos[1] + hl];
    let nOut = ValNode.getOutputAmount(this.type);
    for (let i = 0; i < nOut; i++) {
      var h = new Handle(hPos, hPos, this, false);
      this.handles.push(h);
      hPos[1] += 30 * _scale;
    }
    let nIn = ValNode.getInputAmount(this.type);
    let sub = 1 / nIn;
    var labels = "";
    if (this.type === "RAND") labels = ["SPD", "MIN", "MAX"];
    if (this.type === "INCR") labels = ["WAIT", "START", "END"];
    if (nIn === 1) {
      const p = [pos[0], pos[1] + size[1] / 2];
      this.handles.push(new Handle([p[0] - hl, p[1]], p, this, true));
      if (labels && labels[0]) h.label = labels[i];
      return;
    }
    for (var i = 0; i < nIn; i++) {
      var h = new Handle([pos[0] - hl, pos[1] + size[1] * sub * i + hl / 2], [pos[0] - hl, pos[1] + size[1] * sub * i + hl / 2], this, true);
      if (labels && labels[i]) h.label = labels[i];
      this.handles.push(h);
    }
  }

  setValueType(min, max, isFloat) {
    this.minValue = min;
    this.maxValue = max;
    this.isFloat = isFloat;
    this.isSlider = true;
  }

  getValue() {
    switch (this.type) {
      case "RAND":
        if (!this.speed) return this.output;
        const val = Math.random() * (this.max - this.min + 1) + this.min;
        if (Number.isInteger(this.min) || Number.isInteger(this.max)) return Math.floor(val);
        return val;
      case "TIME":
        const d = new Date();
        const seconds = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
        return seconds / 86400; // 86400 = 24h
      case "INCR": {
        if (this.dir === ">") {
          return this.output >= this.end ? this.start : this.output + 1;
        } else if (this.dir === "<") {
          return this.output <= this.start ? this.end : this.output - 1;
        } else {
          if (this.output >= this.end) this.curDir = "<";
          else if (this.output <= this.start) this.curDir = ">";
          return this.output + (this.curDir === "<" ? -1 : 1);
        }
      }
      default:
        return this.output;
    }
  }

  updateInput() {
    this.updateHandles();
    if (this.type === "RAND") {
      if (this.ins[0]) this.speed = this.ins[0].output;
      else this.speed = 1;
      this.min = Number(this.ins[1] ? this.ins[1].output : 0);
      this.max = Number(Math.max(this.ins[2] ? this.ins[2].output : 100, this.min + 1));
    } else if (this.type === "INCR") {
      const a = this.ins[0]?.output || 0;
      const b = this.ins[1]?.output || 0;
      const c = this.ins[2]?.output || 100;
      this.wait = a;
      this.end = c;
      this.start = Math.min(this.end - 1, b);
    } else if (this.ins[0]) {
      var out = this.ins[0].output;
      this.setOutput(out);
    }
  }

  update() {
    if (this.type === "TIME") this.setOutput(this.getValue());
    else if (this.type === "RAND" && this.speed > 0) {
      const now = performance.now();
      if (!this._lastUpdate) this._lastUpdate = now;
      const elapsed = now - this._lastUpdate;
      const period = 1000 / (this.speed || 1);
      if (elapsed >= period) {
        this._lastUpdate = now;
        this.setOutput(this.getValue());
      }
    } else if (this.type === "INCR" && this.wait > 0) {
      const now = performance.now();
      if (!this._lastUpdate) this._lastUpdate = now;
      const elapsed = (now - this._lastUpdate) / 1000;
      if (elapsed >= (this.wait || 0.1)) {
        this._lastUpdate = now;
        this.setOutput(this.getValue());
      }
    }
  }

  render(ctx, pos = this.pos, size = this.size) {
    super.render(ctx, toScrn(pos), size);
    if (_selBox.active) return;
    const p = toScrn(pos);
    if (this.type === "INCR") {
      const setP = [p[0] + size[0] - 40, p[1] + 20];

      drawText(ctx, setP, this.dir, "white", setAlpha("black", 0.5), 20, false);
      if (pointInRect(_mouse.pos, setP, [20, 20])) {
        document.body.style.cursor = "pointer";
        if (_mouse.clicked) {
          const dirs = [">", "<", "><"];
          var idx = dirs.indexOf(this.dir);
          if (idx < 0 || idx >= dirs.length - 1) idx = 0;
          else idx++;
          this.dir = dirs[idx];
        }
      }
    } else if (pointInRect(_mouse.pos, [p[0] + size[0] * 0.3, p[1] + size[1] * 0.2], [size[0] * 0.4, size[1] * 0.4])) {
      _renameHov = this;
      if (this.type === "NUM") {
        document.body.style.cursor = "Text";
        if (_mouse.clicked) Node.renameNodeProperty(this, "output", this.output);
      } else if (this.type === "INCR" && _mouse.clicked) this.output = 0;
    } else if (this.type === "BOOL" && pointInRect(_mouse.pos, [p[0], p[1] - 40], [size[0], 40])) {
      document.body.style.cursor = "Text";
      _renameHov = this;
      if (_mouse.clicked) {
        if (this.name === undefined) this.setName("BOOL");
        Node.renameNodeProperty(this, "name", "BOOL");
      }
    }
  }
}
