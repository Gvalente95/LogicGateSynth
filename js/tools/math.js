function clamp(value, min, max) { return (value < min ? min : value > max ? max : value) }
function min(value, min) {return (value < min ? min : value);}
function max(value, max) {return (value > max ? max : value);}
function pointInRect(point, pos, size) {
	return (point[0] >= pos[0] && point[0] <= pos[0] + size[0] &&
		point[1] >= pos[1] && point[1] <= pos[1] + size[1]);
}
function rectCollide(posA, sizeA, posB, sizeB) {
	return (
		pointInRect(posA, posB, sizeB) ||
		pointInRect([posA[0] + sizeA[0], posA[1]], posB, sizeB) ||
		pointInRect([posA[0], posA[1] + sizeA[1]], posB, sizeB) ||
		pointInRect([posA[0] + sizeA[0], posA[1] + sizeA[1]], posB, sizeB)
	);
}

function isPosBetween(pos, start, end, tolerance = 6) {
	const toXY = (p) => Array.isArray(p) ? { x: p[0], y: p[1] } : p;
	const a = toXY(start), b = toXY(end), p = toXY(pos);
	const abx = b.x - a.x, aby = b.y - a.y;
	const ab2 = abx*abx + aby*aby;
	if (ab2 === 0) {
		const dx = p.x - a.x, dy = p.y - a.y;
		return dx*dx + dy*dy <= tolerance*tolerance;
	}
	const apx = p.x - a.x, apy = p.y - a.y;
	const t = (apx*abx + apy*aby) / ab2;
	if (t < 0 || t > 1) return false;
	const cx = a.x + t*abx, cy = a.y + t*aby;
	const dx = p.x - cx, dy = p.y - cy;
	return dx*dx + dy*dy <= tolerance*tolerance;
}