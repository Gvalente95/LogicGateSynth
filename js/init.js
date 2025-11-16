
function initNewElement(elType, type, pos, output = null, input = null, system = null) {
	if (elType === NodeContainer)
		n = new elType(type, pos, "NodeContainer", system);
	else
		n = new elType(type, pos, system);
	if (input) n.tryAttachToInput(input, 1);
	if (output) n.tryAttachToOutput(output, 1);
	return n;
}

var bgrImg = new Image(_canvas.width * 2, _canvas.height * 2);
bgrImg.src = "../ressources/img/BGR1.png";
// bgrImg = null;

function initMem1(distBetween, pos = [_canvas.width / 2, _canvas.height / 2]) {
	var xor1 = initNewElement(GateNode, "NOR", [pos[0] - distBetween, pos[1] - distBetween]);
	var xor2 = initNewElement(GateNode, "NOR", [pos[0] - distBetween, pos[1] + distBetween], null, xor1);
	var split2 = initNewElement(ValNode, "SPLIT2", [pos[0] + distBetween, pos[1]], xor1, xor2);
	var nc = initNewElement(NodeContainer, "MEM", pos, null, null, [xor1, xor2, split2]);
	nc.setName("MEM1");
	var storeN = initNewElement(ValNode, "BOOL", [pos[0] - distBetween, pos[1] + distBetween / 2], null, nc);
	var resetN = initNewElement(ValNode, "BOOL", [pos[0] - distBetween, pos[1] - distBetween / 2], null, nc);
	storeN.setName('STORE'); resetN.setName('RESET');
	_nodes.push(nc);
	_nodes.push(resetN);
	_nodes.push(storeN);
	return nc;
}

function init() {
	var nc = initMem1(400);
	// var fromStructure = nc.copy();
	// fromStructure.setName("COPY");
	// fromStructure.initFromStructure(nc.structure);
	// _nodes.push(fromStructure);
	update();
}

window.addEventListener("load", () => {
	init();
});
