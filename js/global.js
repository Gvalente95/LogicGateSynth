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
_renameScroll = false;
_renameProperty = null;
_renameFallback = null;
_renameHov = null;
_renameAll = false;
_renameIdx = null;
_frame = 0;
_debug = false;

const _bgrClr = 'rgba(140, 194, 219, 1)';

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
	OscNode,
	SelNode,
	SplitNode,
	InputNode,
};