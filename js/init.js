
function initNewElement(elType, type, pos, output = null, input = null, system = null) {
	if (elType === NodeContainer)
		n = new elType(type, pos, "NodeContainer", system);
	else
		n = new elType(type, pos);
	if (input) n.tryAttachToInput(input, 1);
	if (output) n.tryAttachToOutput(output, 1);
	return n;
}

function initAndAdd(elType, type, pos, output = null, input = null, system = null) {
	var n = initNewElement(elType, type, pos, output, input, system);
	if (n) _nodes.push(n);
	return n;
}

var bgrImg = new Image(_canvas.width * 2, _canvas.height * 2);
bgrImg.src = "ressources/img/BGR0.jpg";
bgrImg = null;

function initMem1(distBetween, pos = [_canvas.width / 2, _canvas.height / 2]) {
	var xor1 = initNewElement(GateNode, "NOR", [pos[0] - distBetween, pos[1] - distBetween]);
	var xor2 = initNewElement(GateNode, "NOR", [pos[0] - distBetween, pos[1] + distBetween], null, xor1);
	var split2 = initNewElement(SplitNode, "SPLIT2", [pos[0] + distBetween, pos[1]], xor1, xor2);
	var nc = initAndAdd(NodeContainer, "MEM", pos, null, null, [xor1, xor2, split2]);
	nc.setName("MEM1");
	var storeN = initAndAdd(ValNode, "BOOL", [pos[0] - distBetween, pos[1] + distBetween / 2], null, nc);
	var resetN = initAndAdd(ValNode, "BOOL", [pos[0] - distBetween, pos[1] - distBetween / 2], null, nc);
	storeN.setName('STORE'); resetN.setName('RESET');
	return nc;
}

function init() {
	// setTimeout(() => getPiano(['C']), 50);
	// setTimeout(() => getPiano(), 50);
	setTimeout(() => getPiano(['F', 'G', 'A', 'C2']), 50);

	// initMem1(400);
	update();
	markObstaclesDirty();
}

window.addEventListener("load", () => {
	init();
});
