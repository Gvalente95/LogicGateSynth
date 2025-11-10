
function loadNode(name, pos=[100,100]){
  const raw = localStorage.getItem("logic:NodeContainer:"+name);
  if(!raw) return null;
  const {type,data} = JSON.parse(raw);
  const NodeContainer = new NodeContainer(pos, name, type, data);
  _nodes.push(NodeContainer);
  return NodeContainer;
}

function instantiateNode(name, pos=[100,100]){
  const raw = localStorage.getItem("logic:NodeContainer:"+name);
  if(!raw) return null;
  const {data} = JSON.parse(raw);
  const tmp = new NodeContainer(pos, name, "inst", data);
  return tmp.instantiate({offset:pos, attach:true});
}

function load(name="preset"){
  const raw = localStorage.getItem("logic:"+name);
  if(!raw) return false;
  const data = JSON.parse(raw);
  const map = [];
  for(const r of data.nodes){
    const e = _factory(r);
    if(!e) continue;
    e.size = r.size ?? e.size;
    e.place(r.pos);
    _nodes.push(e);
    map[r.id] = e;
  }
  for(const e of _nodes) e.updateOutput?.();
  for(const ed of data.edges){
    const a = map[ed.from.e]?.handles?.[ed.from.h];
    const b = map[ed.to.e]?.handles?.[ed.to.h];
    a?.tryAttachTo?.(b);
  }
  for(const e of _nodes) e.updateOutput?.();
  return true;
}

function listPresets(){
  const out = [];
  for(let i=0;i<localStorage.length;i++){
    const k = localStorage.key(i);
    if(k && k.startsWith("logic:")) out.push(k.slice(6));
  }
  return out;
}

function deletePreset(name){ localStorage.removeItem("logic:"+name); }
