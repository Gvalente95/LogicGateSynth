class Input {
  constructor() {
    this.keys = {};
    this.lastKey = null;
  }

  reset() {
    this.lastKey = null;
  }
}

window.addEventListener("keydown", (e) => {
  let key = e.key.toLowerCase();
  _input.lastKey = key;

  // log("KEY " + key, null, "rgba(207, 223, 22, 1)");
  _input.keys[key] = true;
  if (_paused) return;
  _menu.clear();
  if (_renameNode) {
    Node.addCharToName(e);
    return;
  }
  switch (e.code) {
    case "Backspace":
      return tryDelete(_hovElement);
    case "Escape":
      _selBox.reset();
      _menu.clear();
      prevNcStack();
      _renameNode = null;
      return;
  }
  switch (key) {
    case "d":
      if (_selBox.nodes.length) _selBox.dupplicateNodes([_mouse.pos[0] - _selBox.nodes[0].pos[0], _mouse.pos[1] - _selBox.nodes[0].pos[1]]);
      else _debug = !_debug;
      break;
    case "c":
      if (_input.keys["meta"]) _selBox.copy();
      break;
    case "v":
      if (_input.keys["meta"]) _selBox.paste();
      break;
    case "g":
      griddify();
      break;
    case "j":
      tryJoinGroup();
      break;
    case "s":
      setScale(0.8);
      break;
    case "l":
      _selBox.linkNodes();
      break;
    case "x":
      if (_hovElement) _hovElement.onRemove();
      _selBox.deleteNodes();
      break;
    case "a":
      if (_input.keys["meta"]) {
        for (const e of _nodes) {
          _selBox.tryPush(e);
          _selBox.tryPushLine(e);
        }
      }
      break;
  }
});

window.addEventListener("keyup", (e) => {
  _input.keys[e.key.toLowerCase()] = false;
});

function griddify() {
  for (const e of _nodes) {
    e.place(snapToGrid(e.pos, 100));
  }
}

function simulateMouseEvent(touchEvent, mouseEventType) {
  const touch = touchEvent.changedTouches[0];
  const simulatedEvent = new MouseEvent(mouseEventType, {
    bubbles: true,
    cancelable: true,
    clientX: touch.clientX,
    clientY: touch.clientY,
    screenX: touch.screenX,
    screenY: touch.screenY,
    button: 0,
  });
  touch.target.dispatchEvent(simulatedEvent);
}

function simulateWheelEvent(target, deltaY) {
  const wheelEvent = new WheelEvent("wheel", {
    bubbles: true,
    cancelable: true,
    deltaY: deltaY, // Positive for scroll down, negative for scroll up
    deltaMode: 0, // Pixel-based scrolling
  });
  target.dispatchEvent(wheelEvent);
}
