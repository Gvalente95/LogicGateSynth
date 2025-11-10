function _nodeRecord(e, id, origin) {
  return { id, cls: e.constructor.name, type: e.type ?? null, pos:[e.pos[0]-origin[0], e.pos[1]-origin[1]], size:[...e.size] };
}

function _edgeRecords(ei, e, scope) {
  if(!e.handles) return [];
  const out = [];
  for(let hi=0; hi<e.handles.length; hi++){
    const h = e.handles[hi];
    if(!h || h.isInput || !h.attach) continue;
    const to = h.attach;
    const ej = scope.indexOf(to.parent);
    if(ej<0) continue;
    const hj = to.parent.handles.indexOf(to);
    out.push({from:{e:ei,h:hi}, to:{e:ej,h:hj}});
  }
  return out;
}

function _factory(r){
  switch(r.cls){
    case "GateNode": return new GateNode(r.type, [0,0]);
    case "OppNode": return new OppNode(r.type, [0,0]);
    case "InputElement": return new InputElement([0,0]);
    default: try { return new window[r.cls](r.type, [0,0]); } catch { return null; }
  }
}

function _groupBounds(elems){
  let x=Infinity,y=Infinity;
  for(const e of elems){ if(e){ x=Math.min(x,e.pos[0]); y=Math.min(y,e.pos[1]); } }
  return [x,y];
}

async function saveAsNode(elements, name, type="custom"){
  const origin = _groupBounds(elements);
  const nodes = elements.map((e,i)=>_nodeRecord(e,i,origin));
  const edges = [];
  elements.forEach((e,i)=>edges.push(..._edgeRecords(i,e,elements)));
  const data = { v:1, nodes, edges };
  localStorage.setItem("logic:NodeContainer:"+name, JSON.stringify({name,type,data}));
  const NodeContainer = new NodeContainer([origin[0], origin[1]], name, type, data);
  _nodes.push(NodeContainer);
  announce(name+" saved");
  return NodeContainer;
}

async function saveNode(group, name, type) {
	const NodeContainer = await saveAsNode(group, name, type);
	loadNode(name, [300,200]);
}

function saveSelGroup() {
	promptUser("Name","").then(name => {
		if (!name) return announce("invalid name");
		promptUser("Type","").then(type => {
			if (!type) return announce("invalid type");
			saveNode(_selGroup, name, type);
		});
	});
}

function canBeSaved(group) {
	var groupInput = null;
	var groupOutput = null;
	for (const e of group) {
		for (const h of e.handles) {
			if (!h.attach) {
				if (h.isInput) {
					if (groupInput)
						return false;
					groupInput = h;
				}
				else {
					if (groupOutput)
						return false;
					groupOutput = h;
				}
			}
		}
	}
	if (!groupOutput && !groupInput)
		return false;
	return [groupInput, groupOutput];
}

