function update() {
	_frame++;
	render();
	_mouse.moved = false;
	requestAnimationFrame(update);
}
