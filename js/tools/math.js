function clamp(value, min, max) { return (value < min ? min : value > max ? max : value) }
function min(value, min) {return (value < min ? min : value);}
function max(value, max) {return (value > max ? max : value);}
function pointInRect(point, pos, size) {
	return (point[0] >= pos[0] && point[0] <= pos[0] + size[0] &&
		point[1] >= pos[1] && point[1] <= pos[1] + size[1]);
}
function rectCollide(posA, sizeA, posB, sizeB) {
	const ax1 = posA[0], ay1 = posA[1], ax2 = ax1 + sizeA[0], ay2 = ay1 + sizeA[1];
	const bx1 = posB[0], by1 = posB[1], bx2 = bx1 + sizeB[0], by2 = by1 + sizeB[1];
	return !(ax2 < bx1 || ax1 > bx2 || ay2 < by1 || ay1 > by2);
}

function lerp(a, b, t) {return a + (b - a) * t;}

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


function sumArrays(arr) {
	const sum = [0, 0];
	for (const a of arr) {
		sum[0] += a[0];
		sum[1] += a[1];
	}
	return sum;
}
function averagePositions(positions) {
	const sum = sumArrays(positions);
	return ([Math.round(sum[0] / positions.length - 1), Math.round(sum[1] / positions.length - 1)]);
}

function lineIntersectsRect(a, b, rectPos, rectSize) {
	const x1 = a[0], y1 = a[1];
	const x2 = b[0], y2 = b[1];
	const rx = rectPos[0], ry = rectPos[1];
	const rw = rectSize[0], rh = rectSize[1];
	const rx2 = rx + rw, ry2 = ry + rh;

	const inside = (x, y) => x >= rx && x <= rx2 && y >= ry && y <= ry2;
	if (inside(x1, y1) || inside(x2, y2)) return true;

	const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
	const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
	if (maxX < rx || minX > rx2 || maxY < ry || minY > ry2) return false;

	if (y1 === y2) {
		const y = y1;
		if (y < ry || y > ry2) return false;
		const L = minX, R = maxX;
		return !(R < rx || L > rx2);
	}

	if (x1 === x2) {
		const x = x1;
		if (x < rx || x > rx2) return false;
		const T = minY, B = maxY;
		return !(B < ry || T > ry2);
	}

	return false;
}

function isPartialNumber(str) {
    return /^-?\d*(\.\d*)?$/.test(str);
}
