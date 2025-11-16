const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

_paused = false;
//	ELEMENTS
_nodes = [];
_selElement = null;
_hovElement = null;
_selHandle = null;
_hovHandle = null;
_hangHandle = null;
_hovLine = null;

_renameNode = null;
_renameProperty = null;
_renameFallback = null;
_renameAll = false;
_renameIdx = null;
_frame = 0;

_selBox = new SelBox();
_camera = new Camera();
_mouse = new Mouse([0, 0]);
_input = new Input();
_menu = new Menu();
_NcStack = [];
_au = new AudioManager();
_scale = 1;

_NodesRegistry = {
	GateNode,
	ValNode,
	OppNode,
	NodeContainer,
	DisplayNode,
};