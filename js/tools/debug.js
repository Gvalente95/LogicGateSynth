_debug = true;
function log(text, element = null, color = null) {
	if (!_debug) return;
	
	const frameStr = text && text.length ? String(_frame).padEnd(6, " ") : "";

	if (element) {
		const col1 = element.color ? "color:" + element.color : "";
		const col2 = color ? "color:" + color : "";
		console.log(
			frameStr + element.constructor.name.slice(0, 3) + " %c" + (element.name !== undefined ? element.name : element.type) +  (element.id !== undefined ? ("_" + element.id) : "") + " %c" + text,
			col1,
			col2
		);
	}
	else if (color) console.log("%c" + frameStr + text, "color:" + color);
	else console.log(frameStr + text);
}
