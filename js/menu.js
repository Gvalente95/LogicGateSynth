class Menu{
	constructor() {
		this.contextNode = null;
		this.contextMenuPos = [0, 0];
		this.contextMenuActive = false;
		this.contextSubPage = null;
		this.selPage = null;
		this.nodesPages = {
			"GATE": ["OR", "AND", "XOR", "NOR", "NAND", "XNOR"],
			"OPP": ["ADD", "SUB", "SCALE", "DIV", "POW", "NEG", "FLOOR"],
			"VALUE": ["BOOL", "VALUE", "TIME"],
			"CUSTOM": [],
		};
	}

	toggleContextMenu(pos, Node = _selElement) {
		if (!pos) {
			this.contextMenuActive = false;
			this.contextNode = null;
			if (_hangHandle) {
				_hangHandle.place();
				_hangHandle = null;
			}
			return;
		}
		this.contextMenuActive = true;
		this.contextNode = Node;
		if (Node && !_selGroup.includes(Node))
			_selGroup.push(Node);
		this.contextMenuPos = pos;
	}
	showContextMenuElement(pos, w, h) {
		var options = ["Remove", "Duplicate"];
		if (_selGroup.length > 1 && canBeSaved(_selGroup))
			options.push("Save");
		else if (_selGroup[0].onInspect !== undefined)
			options.push("Inspect");
		for (const opt of options) {
			let color = "rgba(255, 255, 255, 0.7)";
			const rectP = [pos[0] - w / 2, pos[1] - h / 2, w, h];
			if (pointInRect(_mouse.pos, [rectP[0], rectP[1]], [w, h])) {
				color = "white";
				if (_mouse.pressed) {
					console.warn(opt);
					if (opt === "Remove")
						removeSelGroup();
					else if (opt === "Duplicate")
						duplicateSelGroup([20, -20]);
					else if (opt === "Inspect")
						_selGroup[0].onInspect();
					else if (opt === "Save") {
						saveSelGroup();
					}
					this.toggleContextMenu(false);
					clearSelGroup();
					break;
				}
			}
			ctx.fillStyle = "rgba(20, 71, 98, 0.95)";
			ctx.fillRect(rectP[0], rectP[1], rectP[2], rectP[3]);
			drawText(ctx, [rectP[0] + 5, pos[1]], opt, color, null, 30, false);
			pos[1] += h + 1;
		}
	}
	showContextMenuInfo(pos, w, h) {
		for (const page of Object.keys(this.nodesPages)) {
			const rectP = [pos[0] - w / 2, pos[1] - h / 2, w, h];
			let color = "rgba(255, 255, 255, 0.7)";
			var hasP = false;
			if (this.contextSubPage === page) {
				let subPos = [rectP[0] + w - 2, rectP[1]];
				const ww = w * .8;
				const hh = h;
				for (const Node of this.nodesPages[page]) {
					let color = "rgba(255, 255, 255, 0.7)";
					if (pointInRect(_mouse.pos, [subPos[0], subPos[1]], [ww, hh])) {
						hasP = true;
						color = "white";
						if (_mouse.pressed) {
							var newElem;
							if (page === "GATE") newElem = new GateNode(Node, this.contextMenuPos);
							else if (page === 'OPP') newElem = new OppNode(Node, this.contextMenuPos);
							else newElem = new ValNode(Node, this.contextMenuPos);
							_nodes.push(newElem);
							newElem.place([newElem.pos[0] - newElem.size[0] / 2, newElem.pos[1] - newElem.size[1] / 2]);
							if (_hangHandle) {
								if (_hangHandle.parent?.tryAttachToElement(newElem, _hangHandle))
									_hangHandle.place();
								_hangHandle = null;
							}
							else {
								reorderSelGroupByY();
								for (const e of _selGroup)
									e.tryAttachToElement(newElem);
							}
							this.toggleContextMenu(false);
							break;
						}
					}
					ctx.fillStyle = "rgba(11, 41, 57, 0.9)";
					ctx.fillRect(subPos[0], subPos[1], ww, hh);
					drawText(ctx, [subPos[0] + 10, subPos[1] + hh / 2], Node, color, null, 25, false);
					subPos[1] += hh + 1;
				}
				color = "white";
			}
			if (pointInRect(_mouse.pos, [rectP[0], rectP[1]], [rectP[2], rectP[3]])) {
				this.contextSubPage = page;
				color = "white";
			}
			else if (!hasP && this.contextSubPage === page)
				this.contextSubPage = null;
			ctx.fillStyle = "rgba(20, 71, 98, 0.95)";
			ctx.fillRect(rectP[0], rectP[1], rectP[2], rectP[3]);
			drawText(ctx, [rectP[0] + 5, pos[1]], page, color, null, 30, false);
			pos[1] += h + 1;
		}
	}
	showContextMenu() {
		let pos = [...this.contextMenuPos];
		const w = 125;
		const h = 30;
		if (this.contextNode) this.showContextMenuElement([pos[0] + 180, pos[1]], w, h);
		else this.showContextMenuInfo(pos, w, h);
	}

	render(ctx) {
		this.showSubHeader(ctx);
		if (this.contextMenuActive)
			this.showContextMenu();
	}

	clear() {
		this.toggleContextMenu(false);
		this.selPage = null;
	}

	showSubHeader(ctx) {
		let w = 140;
		let h = 100;
		ctx.fillStyle = "rgba(192, 124, 124, 0.14)";
		ctx.fillRect(0, _canvas.height - h, _canvas.width, h);
		let pos = [w / 2, _canvas.height - h / 2];
		for (const page of Object.keys(this.nodesPages)) {
			let rectP = [pos[0] - w / 2, pos[1] - h / 2];
			let color = "white";
			if (this.selPage === page) {
				let subPos = [pos[0], pos[1] - h];
				for (const Node of this.nodesPages[page]) {
					ctx.fillStyle = "rgba(109, 87, 87, 1)";
					let color = "white";
					if (pointInRect(_mouse.pos, [subPos[0] - w / 2, subPos[1] - h / 2], [w, h])) {
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
						color = "red";
					}
					ctx.fillRect(subPos[0] - w / 2, subPos[1] - h / 2, w, h);
					drawText(ctx, subPos, Node, color, null);
					subPos[1] -= (h + 5);
				}
			}
			if (pointInRect(_mouse.pos, rectP, [w, h])) {
				color = "red";
				if (_mouse.clicked) {
					if (this.selPage === page) this.selPage = null;
					else this.selPage = page;
					_mouse.clicked = false;
				}
			}
			ctx.fillStyle = "rgba(77, 57, 57, 1)";
			ctx.fillRect(pos[0] - w / 2, pos[1] - h / 2, w, h);
			drawText(ctx, pos, page, color, null, 30);
			pos[0] += w + 5;
		}
	}
}


function clearSelGroup() {
	if (!_selGroup) { _selGroup = []; return; }
	for (let i = _selGroup.length - 1; i >= 0; i--) {
		const e = _selGroup[i];
		if (!e || typeof e.highlight !== "function") { _selGroup.splice(i,1); continue; }
		e.highlight(false);
	}
	_selGroup = [];
	_selElement = null;
}

function removeSelGroup() {
	for (const e of _selGroup)
		e.onRemove();
	if (_selElement){
		_selElement.onRemove();
		_selElement = null;
	}
	_selGroup = [];
}

function reorderSelGroupByY() {
	_selGroup.sort((a, b) => a.pos[1] - b.pos[1]);
}