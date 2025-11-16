function announce(msg, dur = 2000, bgr = "rgba(0, 0, 0, 1)") {
	const infobox = initLabelDiv(window.innerWidth / 2 - msg.length * 5, window.innerHeight / 2, msg, bgr, "rgba(255,255,255,1)", document.body);
	// _au.playSound(_au.trill, .2);
	setTimeout(() => infobox.remove(), dur);
}

let inPrompt = false;
let promptDiv = null;
function promptUser(label, defaultValue = "") {
	switchPause(true);
	if (isMobile) {
		inPrompt = true;
		return new Promise((resolve) => {
			const val = window.prompt(label, defaultValue);
			inPrompt = false;
			switchPause(false);
			resolve(val && val.trim() ? val.trim() : null);
		});
	}
	inPrompt = true;
	return new Promise((resolve) => {
		const overlay = document.createElement("div");
		Object.assign(overlay.style, {
			position: "fixed",
			top: 0,
			left: 0,
			width: "100vw",
			height: "100vh",
			background: "rgba(0,0,0,0.4)",
			display: "flex",
			justifyContent: "center",
			alignItems: "center",
			zIndex: "9999",
		});
		const box = document.createElement("div");
		Object.assign(box.style, {
			background: "white",
			padding: "10px",
			borderRadius: "8px",
		});
		const labelEl = document.createElement("div");
		labelEl.className = "infoText";
		labelEl.textContent = label;
		const input = document.createElement("input");
		input.type = "text";
		input.value = defaultValue;
		const okBtn = document.createElement("button");
		okBtn.textContent = "OK";
		okBtn.className = "infoText";
		okBtn.onclick = () => cleanup(input.value.trim());
		const cancelBtn = document.createElement("button");
		cancelBtn.textContent = "Cancel";
		cancelBtn.className = "infoText";
		cancelBtn.onclick = () => cleanup(null);
		const cleanup = (val) => {
			inPrompt = false;
			switchPause(false);
			window.removeEventListener("keydown", onKey);
			overlay.remove();
			resolve(val);
		};
		const onKey = (e) => {
			if (e.key === "Enter") cleanup(input.value.trim());
			else if (e.key === "Escape") cleanup(null);
		};
		window.addEventListener("keydown", onKey);
		box.append(labelEl, input, okBtn, cancelBtn);
		overlay.appendChild(box);
		document.body.appendChild(overlay);
		input.addEventListener("mousedown", () => input.focus(), { once: true });
		input.addEventListener("touchstart", () => input.focus(), { once: true });
		setTimeout(() => input.focus(), 0);
	});
}

let confirmDiv = null;
function confirmChoice(label, onEnd, color = "rgba(190, 104, 96, 1)") {
	if (confirmDiv) return;
	inPrompt = true;

	const w = label.length * 10, h = btnH * 2;
	const bw = 40, bh = 30;
	const x = (window.innerWidth - w) / 2;
	const y = (window.innerHeight - h) / 2;
	confirmDiv = document.createElement("div");
	confirmDiv.style.position = "absolute";
	confirmDiv.style.left = x + "px";
	confirmDiv.style.top = y + "px";
	confirmDiv.style.width = w + "px";
	confirmDiv.style.height = h + "px";
	confirmDiv.style.backgroundColor = color;
	confirmDiv.style.zIndex = "9999";
	confirmDiv.style.border = "10px solid " + color;
	confirmDiv.setAttribute("tabindex", "0");
	confirmDiv.focus();
	const onKey = (e) => {
	if (e.code === "Escape" || e.code === "Enter") {
		confirmDiv.remove();
		confirmDiv = null;
		inPrompt = false;
		window.removeEventListener("keydown", onKey);
		if (e.code === "Enter") onEnd(true);
	}
	};
	window.addEventListener("keydown", onKey);
	document.body.appendChild(confirmDiv);
	initLabelDiv(x + 20, y + 15, label, null, "rgba(250, 250, 250, 1)", confirmDiv);
	const yesBtn = initButton("Yes", 0, h - bh, bw, bh, "rgba(0, 0, 0, 0.13)", () => {
	confirmDiv.remove(); confirmDiv = null; inPrompt = false; if (onEnd) onEnd(true);
	}, null, confirmDiv);
	yesBtn.isPrompt = true;
	const noBtn = initButton("No", w - bw, h - bh, bw, bh, "rgba(0, 0, 0, 0.18)", () => {
	confirmDiv.remove(); confirmDiv = null; inPrompt = false;
	}, null, confirmDiv);
	noBtn.isPrompt = true;
}

function switchPause(newPause = !_paused) {
	_paused = newPause;
}