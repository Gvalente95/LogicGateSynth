
function initNewElement(elType, type, pos) {
	_nodes.push(new elType(type, pos));
}

function init() {
	// for (const n of listPresets()) { deletePreset(n); }
	for (const n of listPresets()) { loadNode(n); }
	initNewElement(GateNode, "OR", [_canvas.width / 2 + 200, _canvas.height / 2]);
	initNewElement(GateNode, "XAND", [_canvas.width / 2 - 200, _canvas.height / 2 + 100]);
	initNewElement(GateNode, "XOR", [_canvas.width / 2 - 200, _canvas.height / 2 - 100]);
	initNewElement(ValNode, "BOOL", [_canvas.width / 2 - 400, _canvas.height / 2]);
	initNewElement(ValNode, "TIME", [_canvas.width / 2 - 800, _canvas.height / 2]);

	_nodes[0].tryAttachToElement(_nodes[1], _nodes[0].handles[1]);
	_nodes[0].tryAttachToElement(_nodes[2], _nodes[0].handles[0]);
	_nodes[3].tryAttachToElement(_nodes[2], _nodes[3].handles[0]);
	_nodes[3].setOutput(1);

	_nodes.push(new NodeContainer([50, 50], "NodeContainer", "Cnt", [_nodes[0], _nodes[1], _nodes[2], _nodes[3]]))

	update();
}

window.addEventListener("load", () => {
	init();
});
