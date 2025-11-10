const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

_paused = false;
//	ELEMENTS
_nodes = [];
_selElement = null;
_hovElement = null;
_selHandle = null;
_hovHandle = null;
_hangHandle = null;
_selBox = null;
_selGroup = [];

_mouse = new Mouse([0, 0]);
_input = new Input();
_menu = new Menu();