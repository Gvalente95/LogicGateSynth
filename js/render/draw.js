
function drawCircle(ctx, pos, radius = 2, color = "white", strokeColor = "black", lineWidth = 4) {
	ctx.beginPath();
	ctx.arc(pos[0], pos[1], radius * 4, 0, 2 * Math.PI);
	ctx.strokeStyle = strokeColor;
	ctx.lineWidth = lineWidth;
	if (color) { ctx.fillStyle = color; ctx.fill(); }
	ctx.stroke();
	ctx.closePath();
}

let showGridLine = true;
function drawLine(ctx, start, end, color = "white", width = 2, handleSize = 0) {
	if (showGridLine)
		return drawRouted(ctx, start, end, color, width, handleSize);
	ctx.strokeStyle = color;
	ctx.lineWidth = width;
	ctx.beginPath();
	ctx.moveTo(start[0], start[1]);
	ctx.lineTo(end[0], end[1]);
	ctx.stroke();
	if (handleSize > 0)
		drawCircle(ctx, end, handleSize);
}

function drawPolyline(ctx, pts, color="white", width=2, handleSize=0){
	ctx.strokeStyle=color; ctx.lineWidth=width;
	ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]);
	for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0],pts[i][1]);
	ctx.stroke();
	if(handleSize>0) drawCircle(ctx, pts[pts.length-1], handleSize);
}

function inflate(r,m){ return {x:r.x-m,y:r.y-m,w:r.w+2*m,h:r.h+2*m}; }
function hitsH(y,x1,x2,r){ const L=Math.min(x1,x2), R=Math.max(x1,x2); return y>=r.y&&y<=r.y+r.h && !(R<r.x||L>r.x+r.w); }
function hitsV(x,y1,y2,r){ const T=Math.min(y1,y2), B=Math.max(y1,y2); return x>=r.x&&x<=r.x+r.w && !(B<r.y||T>r.y+r.h); }
function pathClear(pts, rects){
	for(const r of rects){
		for(let i=0;i<pts.length-1;i++){
			const [x1,y1]=pts[i], [x2,y2]=pts[i+1];
			if(x1===x2){ if(hitsV(x1,y1,y2,r)) return false; }
			else{ if(hitsH(y1,x1,x2,r)) return false; }
		}
	}
	return true;
}
function routeOrthSoft(start,end,obstacles=[],margin=6,step=24,maxSteps=4){
	const rs=obstacles.map(r=>inflate(r,margin));
	const [x1,y1]=start,[x2,y2]=end;

	const L1=[[x1,y1],[(x1+x2)/2,y1],[(x1+x2)/2,y2],[x2,y2]];
	if(pathClear(L1,rs)) return L1;

	const L2=[[x1,y1],[x1,(y1+y2)/2],[x2,(y1+y2)/2],[x2,y2]];
	if(pathClear(L2,rs)) return L2;

	for(let k=1;k<=maxSteps;k++){
		const mx1=(x1+x2)/2 - k*step, mx2=(x1+x2)/2 + k*step;
		const A=[[x1,y1],[mx1,y1],[mx1,y2],[x2,y2]];
		if(pathClear(A,rs)) return A;
		const B=[[x1,y1],[mx2,y1],[mx2,y2],[x2,y2]];
		if(pathClear(B,rs)) return B;

		const my1=(y1+y2)/2 - k*step, my2=(y1+y2)/2 + k*step;
		const C=[[x1,y1],[x1,my1],[x2,my1],[x2,y2]];
		if(pathClear(C,rs)) return C;
		const D=[[x1,y1],[x1,my2],[x2,my2],[x2,y2]];
		if(pathClear(D,rs)) return D;
	}

	return [[x1,y1],[x1,y2],[x2,y2]];
}
function drawRouted(ctx,start,end,color="white",width=2,handleSize=0){
	const obstacles=_nodes.map(e=>({x:e.pos[0],y:e.pos[1],w:e.size[0],h:e.size[1]}));
	const pts=routeOrthSoft(start,end,obstacles,6,24,4);
	drawPolyline(ctx,pts,color,width,handleSize);
}



function drawText(ctx, pos, text, color = "white", backgroundColor = null, size = 25, centered = true) {
	ctx.font = size + "px sans-serif";
	const metrics = ctx.measureText(text);
	const w = metrics.width + 12;
	const h = size + 8;
	let x = pos[0]; let y = pos[1];
	if (centered) {x -= w / 2; y -= h / 2;}
	if (backgroundColor) {
		ctx.fillStyle = backgroundColor;
		ctx.fillRect(x, y, w, h);
	}
	ctx.fillStyle = color;
	ctx.textAlign = centered ? "center" : "left";
	ctx.textBaseline = "middle";
	ctx.fillText(text, centered ? pos[0] : pos[0], pos[1]);
}
