class Menu{
	constructor() {
		this.contextNode = null;
		this.contextMenuPos = [0, 0];
		this.contextMenuActive = false;
		this.contextSubPage = null;
		this.selPage = null;
		this.nodesPages = {
			"VALUE": ["VALUE", "BOOL", "TIME", "RAND", "SPLIT2", "SPLIT4", "SPLIT8", "SPLIT16", "SPLIT32", "INCR"],
			"OPP": ["ADD", "SUB", "SCALE", "DIV", "MOD","FLOOR", "POW", "MIN", "MAX", "MINMAX", "MAP"],
			"DISPLAY": ["SCREEN1", "SCREEN2", "SCREEN4", "SCREEN8", "SCREEN16", "SCREEN32"],
			"GATE": ["OR", "AND", "XOR", "NOR", "NAND", "XNOR", "NOT"],
			"CUSTOM": [],
		};
	}

	toggleContextMenu(pos, Node = _hovElement) {
		if (!pos) {
			if (this.contextMenuActive)
				log("MENU CLOSED", this.contextNode, "rgba(175, 160, 206, 1)");
			this.contextMenuActive = false;
			this.contextNode = null;
			if (_hangHandle) {
				_hangHandle.place();
				_hangHandle = null;
			}
			return;
		}
		this.contextMenuActive = true;
		this.contextMenuPos = pos;
		this.contextNode = Node;
		log("MENU ACTIVATED ", this.contextNode, "rgba(175, 160, 206, 1)");
		_selBox.tryPush(Node);
		_mouse.clicked = 0;
	}
	showContextMenuElement(pos, w, h) {
		w *= _scale;
		h *= _scale;
		var options = ["Remove", "Duplicate"];
		if (_NcStack.length) {
			options = [];
			if (_selBox.nodes.length && _selBox.nodes[0].onInspect !== undefined)
				options.push("Inspect");
		}
		else if (_selBox.nodes.length > 1) {
			if (validateGroupNode(_selBox.nodes).ok)
				options.push("Join");
			if (_selBox.nodes.length === 2)
				options.push("Link");
		}
		else if (_selBox.nodes.length && _selBox.nodes[0].onInspect !== undefined)
			options.push("Inspect");
		for (const opt of options) {
			let color = "rgba(255, 255, 255, 0.7)";
			const rectP = [pos[0] - w / 2, pos[1] - h / 2, w, h];
			ctx.fillStyle = "rgba(0, 0, 0, 1)";
			ctx.fillRect(rectP[0] - 1, rectP[1] - 1, rectP[2] + 2, rectP[3] + 2);

			if (pointInRect(_mouse.pos, [rectP[0], rectP[1]], [w, h])) {
				color = "white";
				if (_mouse.pressed) {
					if (opt === "Remove") {
						_selBox.deleteNodes();
						_hovElement = null;
					}
					else if (opt === "Duplicate")
						_selBox.dupplicateNodes([20, -20]);
					else if (opt === "Inspect")
						_selBox.nodes[0].onInspect();
					else if (opt === "Join")
						JoinSelGroup();
					else if (opt === "Link") {
						tryLinkNodes();
					}
					this.toggleContextMenu(false);
					if (opt !== 'Duplicate')
						_selBox.clearNodes();
					break;
				}
				ctx.fillStyle = "rgba(25, 78, 107, 0.9)";
			}
			else ctx.fillStyle = "rgba(11, 41, 57, 0.9)";
			ctx.fillRect(rectP[0], rectP[1], rectP[2], rectP[3]);
			drawText(ctx, [rectP[0] + 5, pos[1]], opt, color, null, 30, false);
			pos[1] += h + 1;
		}
	}
	showContextMenuInfo(pos, w, h) {
		w *= _scale;
		h *= _scale;
		const borderWidth = 2;
		const baseClr = "rgba(18, 62, 86, 0.95)";
		const pages = Object.keys(this.nodesPages);
		for (let i = 0; i < pages.length; i++) {
			const page = pages[i];
			const rectP = [pos[0] - w / 2, pos[1] - h / 2, w, h];
			let color = "rgba(255, 255, 255, 0.7)";
			if (this.contextSubPage === page) {
				const subPos = [rectP[0] + w - 2, rectP[1]];
				const ww = w * .8;
				const hh = h;
				const baseSubClr = "rgba(20, 49, 64, 0.53)";
				for (let i = 0; i < this.nodesPages[page].length; i++) {
					const Node = this.nodesPages[page][i];
					let textClr = "rgba(255, 255, 255, 0.7)";
					let rectClr = addColor(baseSubClr, "rgba(130, 109, 141, 1)", i * .02);
					ctx.fillStyle = "rgba(0, 0, 0, 1)";
					ctx.fillRect(subPos[0] - 1, subPos[1] - 1, ww + 2, hh + 2);
					if (pointInRect(_mouse.pos, [subPos[0], subPos[1]], [ww, hh])) {
						textClr = "white";
						if (_mouse.pressed) {
							var newElem;
							if (page === "GATE") newElem = new GateNode(Node, this.contextMenuPos);
							else if (page === 'OPP') newElem = new OppNode(Node, this.contextMenuPos);
							else if (page === 'DISPLAY') newElem = new DisplayNode(Node, this.contextMenuPos);
							else newElem = new ValNode(Node, this.contextMenuPos);
							_nodes.push(newElem);
							if (_hangHandle) {
								newElem.place([_hangHandle.end[0], _hangHandle.end[1]]);
								const hasAttached = _hangHandle.parent?.tryAttachToElement(newElem, _hangHandle);
								_hangHandle.place();
								_hangHandle = null;
							}
							else {
								newElem.place([newElem.pos[0] - newElem.size[0] / 2, newElem.pos[1] - newElem.size[1] / 2]);
								reorderSelGroupByY();
								for (const e of _selBox.nodes)
									e.tryAttachToElement(newElem);
							}
							this.toggleContextMenu(false);
							break;
						}
						rectClr = "rgba(25, 78, 107, 0.9)";
					}
					ctx.fillStyle = rectClr;
					ctx.fillRect(subPos[0], subPos[1], ww, hh);
					drawText(ctx, [subPos[0] + 10, subPos[1] + hh / 2], Node, textClr, null, 25, false);
					subPos[1] += hh + 1;
				}
				color = "white";
			}
			ctx.fillStyle = "rgba(0, 0, 0, 1)";
			ctx.fillRect(rectP[0] - borderWidth, rectP[1] - borderWidth, rectP[2] + borderWidth * 2, rectP[3] + borderWidth * 2);

			if (pointInRect(_mouse.pos, [rectP[0], rectP[1]], [rectP[2], rectP[3]])) {
				this.contextSubPage = page;
				color = "white";
				ctx.fillStyle = "rgba(32, 97, 131, 0.9)";
			}
			else ctx.fillStyle = addColor(baseClr, "rgba(106, 43, 135, 1)", i * .05);
			ctx.fillRect(rectP[0], rectP[1], rectP[2], rectP[3]);
			drawText(ctx, [rectP[0] + 5, pos[1]], page, color, null, 30, false);
			pos[1] += h + 1;
		}
	}
	showContextMenu() {
		let pos = [...this.contextMenuPos];
		const w = 160;
		const h = 40;
		if (this.contextNode) this.showContextMenuElement([pos[0] + 10, pos[1]], w, h);
		else this.showContextMenuInfo(pos, w, h);
	}

	render(ctx) {
		this.showSubHeader(ctx);
		if (this.contextMenuActive) {
			this.showContextMenu();
			if (_mouse.clicked) {
				this.clear();
				_selBox.clearNodes();
			}
		}
	}

	clear() {
		this.toggleContextMenu(false);
		this.selPage = null;
	}

	showSubHeader(ctx) {
		let w = 180 * _scale;
		let h = 100;
		ctx.fillStyle = "rgba(0, 0, 0, 0.14)";
		ctx.fillRect(0, _canvas.height - h, _canvas.width, h);
		let pos = [w / 2, _canvas.height - h / 2];
		const baseClr = "rgba(49, 75, 98, 0.36)";
		let pages = Object.keys(this.nodesPages);
		var hasHov = false;
		for (let i = 0; i < pages.length; i++) {
			const page = pages[i];
			const rectP = [pos[0] - w / 2, pos[1] - h / 2, w, h];
			let color = "white";
			ctx.fillStyle = "rgba(0, 0, 0, 1)";
			ctx.fillRect(rectP[0] - 2, rectP[1] - 2, rectP[2] + 4, rectP[3] + 4);
			if (this.selPage === page) {
				const subPos = [pos[0] - w / 2, pos[1] - h - 2];
				const ww = w;
				const hh = h / 2;
				const subClr = "rgba(30, 70, 100, 1)";
				for (let i = 0; i < this.nodesPages[page].length; i++) {
					const Node = this.nodesPages[page][i];
					ctx.fillStyle = "rgba(0, 0, 0, 1)";
					ctx.fillRect(subPos[0] - 2, subPos[1] - 2, ww + 4, hh + 4);
					if (pointInRect(_mouse.pos, [subPos[0], subPos[1]], [w, hh])) {
						if (_mouse.clicked) {
							var newElem;
							if (page === "GateNode")
								newElem = new GateNode(Node, _mouse.pos);
							else
								newElem = new OppNode(Node, _mouse.pos);
							_nodes.push(newElem);
							_selElement = newElem;
							this.selPage = null;
						}
						ctx.fillStyle = subClr;
						hasHov = true;
					}
					else ctx.fillStyle = addColor(subClr, "rgba(20, 18, 18, 1)", i * .05);
					ctx.fillRect(subPos[0], subPos[1], ww, hh);
					drawText(ctx, [subPos[0] + ww / 2, subPos[1] + hh / 2], Node);
					subPos[1] -= (hh + 2);
				}
			}
			if (pointInRect(_mouse.pos, rectP, [w, h])) {
				this.selPage = page;
				ctx.fillStyle = "rgba(32, 97, 131, 0.9)";
			}
			else {
				if (this.selPage == page && !hasHov) this.selPage = null;
				ctx.fillStyle = addColor(baseClr, "rgba(0, 0, 0, 1)", i * .05);
			}
			ctx.fillRect(rectP[0], rectP[1], rectP[2], rectP[3]);
			drawText(ctx, pos, page, color, null, 30);
			pos[0] += w + 4;
		}
	}
}
