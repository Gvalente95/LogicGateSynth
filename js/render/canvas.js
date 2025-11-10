
const dpr = window.devicePixelRatio || 1;
_cellSize = 1;

_canvas = document.createElement("canvas");
_canvas.style.backgroundColor = "black";
ctx = _canvas.getContext("2d");
_canvas.width = window.innerWidth;
_canvas.height = window.innerHeight;
document.body.appendChild(_canvas);

function resizeCanvas() {
	const w = window.innerWidth;
	const h = window.innerHeight;
	_canvas.style.width = w + "px";
	_canvas.style.height = h + "px";
	_canvas.width = Math.floor(w * dpr);
	_canvas.height = Math.floor(h * dpr);
	_gridSize = [
	Math.floor(_canvas.width / _cellSize),
	Math.floor(_canvas.height / _cellSize)
	];
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function getMousePosCanvas(e) {
  const r = _canvas.getBoundingClientRect();
  const sx = _canvas.width / r.width;
  const sy = _canvas.height / r.height;
  return [(e.clientX - r.left) * sx, (e.clientY - r.top) * sy];
}

function snapToGrid([x, y], cs = _cellSize) {
  return [
    Math.round(x / cs) * cs,
    Math.round(y / cs) * cs
  ];
}

function clampToCanvas([x, y], [w, h]) {
  const maxX = _canvas.width - w;
  const maxY = _canvas.height - h;
  return [
    Math.max(50, Math.min(x, maxX - 50)),
    Math.max(50, Math.min(y, maxY - 100))
  ];
}