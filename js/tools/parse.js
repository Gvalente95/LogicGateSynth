
function isPrintableKey(e) {
	const key = e.key;
	if (key.length !== 1) return false;
	const code = key.charCodeAt(0);
	return (code >= 32 && code < 127);
}

function removeCharAt(str, index) {
	return str.slice(0, index) + str.slice(index + 1);
}

function untilChar(str, char) {
	const i = str.indexOf(char);
	return i === -1 ? str : str.slice(0, i);
}