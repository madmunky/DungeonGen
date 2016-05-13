var debug = true;
var stereo = false;
var dir = [{x: 0, y: -1}, {x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}];
if(comp.device.toLowerCase() === '') {
	var mapSize = 30; //31
	var viewSize = 20; //14
	var squareSize = 8; //16
	var tdViewSize = 19; //13
} else {
	var mapSize = 15;
	var viewSize = 6;
	var squareSize = 16;
	var tdViewSize = 7;
}
var tdSquareSize = { x: 1.5, y: 1.5 };
var tdPlayerHeight = 0.8;
var tdBackStep;
var keysFrozen = false;
var origin = {f: 0, x: 0, y: 0};
var map, mutation = {};
var stats;
var canvas;
var ctx;
var loadingManager;
var loadingCountError = 0;
var loadingCountTotal = 0;

initPlayer();
loadGame(0);

$(function() {
	init();

	$(document).keydown(function(e) {
		if(!keysFrozen) {
			var d = origin.d;
			var d1 = (origin.d + 1) % 4;
			var d2 = (origin.d + 2) % 4;
			var d3 = (origin.d + 3) % 4;
		    switch(e.which) {
		    	case 82:
		    	initPlayer(true); reloadAll(); // r
		    	break;

		        case 65:
				tdMoveCamera(d3); // a
		        break;

		    	case 67: // c
		    	stereo = stereo ? false : true;
		    	if(stereo) requestFullscreen();
	            tdReloadView();
    			tdUpdateCamera();
		    	break;

		        case 87:
	        	tdMoveCamera(d); // w
		        break;

		        case 68:
				tdMoveCamera(d1); // d
		        break;

		        case 83:
	        	tdMoveCamera(d2); // s
		        break;

		        case 81: tdRotateCamera(-1); // q
		        break;

		        case 69: tdRotateCamera(1); // e
		        break;

		        case 33: origin.f++; reloadAll(); // page up
		        break;

		        case 34: origin.f--; reloadAll(); // page down
		        break;

		        case 32: wallAction(origin.x, origin.y, d); // space
		        break;

		        default: return; // exit this handler for other keys
		    }
	    }
	    e.preventDefault();
	});

	$(document).click(function() {
		buttonEvents();
		return false;
    });

	$('body #coordinates').change(function() {
		//F: -96109, X: 697844, Y: -835703, D: 2
		origin = parseCoordinates($(this).val());
		reloadAll();
	});

	$('body #random').click(function() {
		initPlayer(true);
		reloadAll();
	});

	$('body #reset-game').click(function() {
		mutation = {};
		deleteGame(0);
		reloadAll();
	});

	$('body #stereo').click(function() {
		stereo = stereo ? false : true;
		if(stereo) requestFullscreen();
		tdReloadView();
    	tdUpdateCamera();
	});
});

function init() {
	if(debug) {
		stats = new Stats();
	    stats.setMode(0); // 0: fps, 1: ms, 2: mb
	    stats.domElement.style.position = 'absolute';
	    stats.domElement.style.left = '0px';
	    stats.domElement.style.bottom = '0px';
	    document.body.appendChild(stats.domElement);
	}

	loadingManager = THREE.DefaultLoadingManager;
	loadingManager.onProgress = function (item, loaded, total) {
    	var width = $('#loading').innerWidth() - 2;
		var tot = total - loadingCountError - loadingCountTotal;
		var ldd = loaded - loadingCountTotal;
		console.log(item, ldd, tot);
		var w = Math.floor((1.0 * ldd / tot) * width);
		$('#loading .bar').css('width', w + 'px');
		$('#loading .light').css('left', (w - 6) + 'px');
		$('#loading .light').css('opacity', (1.0 * w / width));
		if(!stereo) {
			$('#loading').show();
		}
		if(ldd >= tot) {
			loadingCountTotal = loaded;
			$('#loading').fadeOut();
		}
	}
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    ctx.canvas.width  = viewSize * squareSize;
    ctx.canvas.height = $(document).height() - 50;
    startEngine();
}

function reloadAll(act) {
	initField();
	drawAll();
	tdDrawAll(true);
	tdUpdateCamera();
	if(typeof act === "undefined" || act) {
		floorAction(origin.x, origin.y);
	}
}

function startEngine() {
    tdCreateScene();
    tdCreateLight();
    tdReloadView();
    reloadAll();
    tdAnimate();
}

function parseCoordinates(str) {
	var or = {f: 0, x: 0, y: 0, d: 0};
	var c = str.toUpperCase();
	c = c.replace(/ /g, '').split(',');
	for(var i = 0; i < c.length; i++) {
		var c1 = c[i].split(':');
		if(c1.length === 2) {
			if(c1[0] === 'F') {
				or.f = parseInt(c1[1]);
			} else if(c1[0] === 'X') {
				or.x = parseInt(c1[1]);
			} else if(c1[0] === 'Y') {
				or.y = parseInt(c1[1]);
			} else if(c1[0] === 'D') {
				or.d = parseInt(c1[1]);
			} 
		}
	}
	return or
}

function initPlayer(f) {
	var str = '';
	if(f === "undefined" || !f) {
		str = getCookie('player-coordinates');
	}
	if(str === '') {
		var f = (Math.floor(Math.random() * 100000) - 50000) * 2;
    	var x = (Math.floor(Math.random() * 1000000) - 500000) * 2;
    	var y = (Math.floor(Math.random() * 1000000) - 500000) * 2;
    	var d = Math.floor(Math.random() * 4);
		origin = {f: f, x: x, y: y, d: d};
		setCookie('player-coordinates', 'F: ' + origin.f + ', X: ' + origin.x + ', Y: ' + origin.y + ', D: ' + origin.d, 365);
	} else {
		origin = parseCoordinates(str);
	}
}

function playerCanMove(d) {
    var xo = dir[d].x;
    var yo = dir[d].y;
	if(hasSquare(origin.x, origin.y, 'wall-wood', d) > -1 || hasSquare(origin.x + xo, origin.y + yo, 'wall-wood', (d + 2) % 4) > -1 || hasSquare(origin.x, origin.y, 'door-wood', d) > -1 || hasSquare(origin.x + xo, origin.y + yo, 'door-wood', (d + 2) % 4) > -1) {
		return -1;
	} else if(hasSquare(origin.x + xo, origin.y + yo, 'wall-secret') === -1 && (hasSquare(origin.x + xo, origin.y + yo, 'wall') > -1 || hasSquare(origin.x + xo, origin.y + yo, 'pillar') > -1 || hasSquare(origin.x + xo, origin.y + yo, 'obstacle') > -1 || hasSquare(origin.x + xo, origin.y + yo, 'door') > -1)) {
    	return 0;
    }
    return 1;
}

function initField(d) {
	shiftMeshes(d);
	clearField(origin.x - Math.floor(mapSize / 2), origin.y - Math.floor(mapSize / 2), origin.x - Math.floor(mapSize / 2) + mapSize, origin.y - Math.floor(mapSize / 2) + mapSize, true);
	generateField(origin.x - Math.floor(mapSize / 2), origin.y - Math.floor(mapSize / 2), origin.x - Math.floor(mapSize / 2) + mapSize, origin.y - Math.floor(mapSize / 2) + mapSize);
}

function shiftMeshes(d) {
	switch(d) {
		case 0:
			for(var i = 0; i < mapSize; i++) {
				tdClearObject(map[i][mapSize - 1].mesh);
			}
			map = deleteColumn(map, mapSize);
			for(var i = 0; i < mapSize; i++) {
		        map[i].unshift(null);
		    }
			break;
		case 1:
			for(var i = 0; i < mapSize; i++) {
				tdClearObject(map[0][i].mesh);
			}
			map = deleteRow(map, 0);
			map.push(null);
			break;
		case 2:
			for(var i = 0; i < mapSize; i++) {
				tdClearObject(map[i][0].mesh);
			}
			map = deleteColumn(map, 0);
			for (var i = 0; i < mapSize; i++) {
		        map[i].push(null);
		    }
			break;
		case 3:
			for(var i = 0; i < mapSize; i++) {
				tdClearObject(map[mapSize - 1][i].mesh);
			}
			map = deleteRow(map, mapSize - 1);
			map.unshift(null);
			break;
		default: break;
	}
}

function clearField(x1, y1, x2, y2, force) {
	if(typeof map === "undefined") {
		map = [];
	}
	if(typeof force === "undefined") {
		var force = false;
	}
	for(var x = x1 - origin.x + Math.floor(mapSize / 2); x < x2 - origin.x + Math.floor(mapSize / 2); x++) {
		if(typeof map[x] === "undefined" || map[x] === null) {
			map[x] = [];
		}
		for(var y = y1 - origin.y + Math.floor(mapSize / 2); y < y2 - origin.y + Math.floor(mapSize / 2); y++) {
			if(typeof map[x][y] === "undefined" || map[x][y] === null) {
				map[x][y] = { obj: 'wall', rotation: '0', features: {} };
			}
			setSquare(toRealCoord(x, y).x, toRealCoord(x, y).y, 'wall', null, '0', force, {});
		}
	}
}

function generateField(x1, y1, x2, y2) {
	for(var y = y1; y < y2; y++) {
		for(var x = x1; x < x2; x++) {
			generateFloor(x, y);
		}
	}
	for(var y = y1; y < y2; y++) {
		for(var x = x1; x < x2; x++) {
			generateRoom(x, y, rand(origin.f, x, y, 859.35, 2) * 2 + 3, rand(origin.f, x, y, 123.76, 2) * 2 + 3);
			generateRoomWood(x, y, rand(origin.f, x, y, 859.35, 4) + 1, rand(origin.f, x, y, 123.76, 4) + 1);
			//generateDoor(x, y);
		}
	}
	for(var y = y1; y < y2; y++) {
		for(var x = x1; x < x2; x++) {
			generateRoomAfter(x, y);
		}
	}
	for(var y = y1; y < y2; y++) {
		for(var x = x1; x < x2; x++) {
			generatePillar(x, y);
			generateStairs(x, y);
			generateDeco(x, y);
		}
	}
	for(var y = y1; y < y2; y++) {
		for(var x = x1; x < x2; x++) {
			generateRoomWoodAfter(x, y);
		}
	}
	for(var y = y1; y < y2; y++) {
		for(var x = x1; x < x2; x++) {
			var sq = getMutation(x, y);
			if(sq !== null) {
				if(equalsSquare(getSquare(x, y), sq)) {
					deleteMutation(x, y);
				} else {
					setSquare(x, y, sq.obj, null, sq.rotation, true, sq.features);
				}
			}
		}
	}
}

function generateFloor(x, y) {
	if(Math.abs(x) % 2 === 0 && Math.abs(y) % 2 === 0) {
		//setSquare(x, y, 'test');
		if(rand(origin.f, x, y, 0, 4) === 0) {
			setSquare(x + 1, y, 'floor');
		}
		if(rand(origin.f, x, y, 0, 4) === 1) {
			setSquare(x, y + 1, 'floor');
		}
		if(rand(origin.f, x, y, 0, 4) === 2) {
			setSquare(x - 1, y, 'floor');
		}
		if(rand(origin.f, x, y, 0, 4) === 3) {
			setSquare(x, y - 1, 'floor');
		}
		setSquare(x, y, 'floor');
		//if(rand(origin.f, x + 1, y, 0, 12) === 0) {
			//appendSquare(x + 1, y, 'light');
		//}
	}
}

function generateStairs(x, y) {
	if(Math.abs(x) % 4 === 0 && Math.abs(y) % 4 === 0) {
		if(rand(origin.f, x, y, 0, 5) === 0) {
			if(rand(origin.f, x, y, 0, 2) === 0) {
				d = rand(origin.f, x, y, 0, 4);
				d1 = (d + 1) % 4;
				d2 = (d + 2) % 4;
				d3 = (d + 3) % 4;
				if(setSquare(x, y, 'stairs-up', null, d, true)) {
					setSquareFeature(x, y, 'protected', 'true');
					setSquare(x + dir[d1].x, y + dir[d1].y, 'wall', null, '0', true, { double: 'wall', triple: 'wall', protected: true });
					setSquare(x + dir[d2].x, y + dir[d2].y, 'wall', null, '0', true, { double: 'none', protected: true });
					setSquare(x + dir[d3].x, y + dir[d3].y, 'wall', null, '0', true, { double: 'wall', triple: 'wall', protected: true });
					setSquare(x + dir[d].x, y + dir[d].y, 'floor', null, '0', false);
					if(getSquareFeature(x + dir[d].x, y + dir[d].y, 'double') !== 'ceil') {
						setSquareFeature(x + dir[d].x, y + dir[d].y, 'double', 'wall');
					}
					setSquareFeature(x + dir[d].x, y + dir[d].y, 'protected', 'true');

					setSquareFeature(x + dir[d1].x + dir[d2].x, y + dir[d1].y + dir[d2].y, 'double', 'wall');
					setSquareFeature(x + dir[d3].x + dir[d2].x, y + dir[d3].y + dir[d2].y, 'double', 'wall');
					setSquareFeature(x + dir[d2].x * 2, y + dir[d2].y * 2, 'double', 'wall');
					setSquareFeature(x + dir[d1].x + dir[d2].x, y + dir[d1].y + dir[d2].y, 'triple', 'wall');
					setSquareFeature(x + dir[d3].x + dir[d2].x, y + dir[d3].y + dir[d2].y, 'triple', 'wall');
					setSquareFeature(x + dir[d1].x + dir[d2].x * 2, y + dir[d1].y + dir[d2].y * 2, 'triple', 'wall');
					setSquareFeature(x + dir[d3].x + dir[d2].x * 2, y + dir[d3].y + dir[d2].y * 2, 'triple', 'wall');
				}
			} else {
				appendSquare(x, y, 'pit-ceil', '', '', true);
			}
		}
		if(rand(origin.f - 1, x, y, 0, 5) === 0) {
			if(rand(origin.f - 1, x, y, 0, 2) === 0) {
				d = (rand(origin.f - 1, x, y, 0, 4) + 2) % 4;
				d1 = (d + 1) % 4;
				d2 = (d + 2) % 4;
				d3 = (d + 3) % 4;
				var x1 = x + dir[d].x * 2;
				var y1 = y + dir[d].y * 2;
				if(setSquare(x1, y1, 'stairs-down', null, d2, true, { double: 'wall', protected: true })) {
					setSquare(x1 + dir[d1].x, y1 + dir[d1].y, 'wall', null, '0', true);
					setSquare(x1 + dir[d2].x, y1 + dir[d2].y, 'wall', null, '0', true);
					setSquare(x1 + dir[d3].x, y1 + dir[d3].y, 'wall', null, '0', true);
					setSquare(x1 + dir[d].x, y1 + dir[d].y, 'floor', null, '0', false);
					setSquareFeature(x1 + dir[d1].x, y1 + dir[d1].y, 'protected', 'true');
					setSquareFeature(x1 + dir[d2].x, y1 + dir[d2].y, 'protected', 'true');
					setSquareFeature(x1 + dir[d3].x, y1 + dir[d3].y, 'protected', 'true');
					setSquareFeature(x1 + dir[d].x, y1 + dir[d].y, 'protected', 'true');
				}
			} else {
				appendSquare(x, y, 'pit', 'floor', '', true);
			}
		}
	}
	if(Math.abs(x) % 2 === 0 && Math.abs(y) % 2 === 0) {
		if(getSquareObj(x, y) === 'floor') {
			var e = 0;
			var d1 = 0;
			for(var d = 0; d < 4; d++) {
				if(hasSquare(x + dir[d].x, y + dir[d].y, 'floor') > -1) {
					d1 = (rand(origin.f, x, y, 919.19, 3) + d + 1) % 4;
					d2 = (rand(origin.f, x, y, 127.73, 3) + d + 1) % 4;
					e++;
				}
			}
			if(e <= 1) {
				switch(rand(origin.f, x, y, 811.77, 12)) {
				//switch(4) {
					case 0: //switch
					var m = rand(origin.f, x, y, 666.89, 2);
					switch(m) {
						case 0: m = 'once'; break;
						case 1: m = 'toggle'; break;
						default: m = 'repeat'; break;
					}
					setSquare(x + dir[d1].x, y + dir[d1].y, 'wall,wall-switch', '', '0' + (d1 + 2) % 4, false, {
						protected: true,
						target: {
							f: origin.f,
							x: x + dir[d2].x,
							y: y + dir[d2].y,
							mode: m
						}
					});
					switch(rand(origin.f, x, y, 811.77, 3)) {
						case 0: setSquare(x + dir[d2].x, y + dir[d2].y, 'wall', '', '', true); break;
						case 1: setSquare(x + dir[d2].x, y + dir[d2].y, 'floor,pillar', '', '', true); break;
						case 2: generateDoor(x + dir[d2].x, y + dir[d2].y, true, true); break;
					}
					break;
					case 1: //teleport
					setSquare(x, y, 'floor,teleport', '', '', false, {
						teleport: {
							x: origin.x + dir[d1].x * rand(origin.f, x, y, 811.44, 3) * 2 + 2,
							y: origin.y + dir[d1].y * rand(origin.f, x, y, 12.97, 3) * 2 + 2
						}
					});
					break;
					case 2: //secret wall
					setSquare(x + dir[d1].x, y + dir[d1].y, 'floor,wall-secret', 'wall');
					break;
					case 3: //door
					generateDoor(x + dir[d2].x, y + dir[d2].y, true);
					break;
					case 4: //rotating floor
					setSquare(x, y, 'floor', '', '', false, {
						teleport: {
							d: Math.floor(Math.random() * 4)
						}
					});
					break;
					default:
					setSquare(x + dir[d1].x, y + dir[d1].y, 'floor');					
					break;
				}
			}
		}
	}
}

function generateDeco(x, y) {
	var d = rand(origin.f, x, y, 123.13, 4);
	var dr = d;
	//if(hasSquare(x, y, 'door') > -1) {
	//	dr = '';
	//}
	if(hasSquare(x, y, 'wall') > -1 && hasSquare(x, y, 'wall-switch') === -1) {
		if(hasSquare(x + dir[d].x, y + dir[d].y, 'wall') === -1 && hasSquare(x + dir[d].x, y + dir[d].y, 'door') === -1 && hasSquare(x + dir[d].x, y + dir[d].y, 'stairs-up') === -1 && hasSquare(x + dir[d].x, y + dir[d].y, 'stairs-down') === -1) {
			if(rand(origin.f, x, y, 860.97, 2) === 0) {
				appendSquare(x, y, 'wall-deco', null, dr, true);
			}
		}
	} else if(hasSquare(x, y, 'floor') > -1 && hasSquare(x, y, 'pit') === -1) {
		if(rand(origin.f, x, y, 860.97, 30) === 0) {
			appendSquare(x, y, 'floor-deco', null, dr, true);
		}
	}
	if(getSquareFeature(x, y, 'double') === 'wall') {
		if(getSquareFeature(x + dir[d].x, y + dir[d].y, 'double') === 'ceil') {
			if(rand(origin.f, x, y, 12.08, 2) === 0) {
				appendSquare(x, y, 'wall-deco-high', null, dr, true);
			}
		}
	}
}

function generateRoom(x1, y1, xs, ys) {
	if(Math.abs(x1) % 2 === 0 && Math.abs(y1) % 2 === 0) {
		if(rand(origin.f, x1, y1, 94.09, 12) === 0) {
			x1 = x1 - Math.floor(xs / 4) * 2;
			y1 = y1 - Math.floor(ys / 4) * 2;
			for(var y = y1; y < y1 + ys; y++) {
				for(var x = x1; x < x1 + xs; x++) {
					setSquare(x, y, 'floor');
					if(getSquareFeature(x, y, 'double') !== 'none') {
						setSquareFeature(x, y, 'double', 'ceil');
					}
				}
			}
		}
	}
}

function generateRoomAfter(x, y) {
	if(getSquareFeature(x, y, 'double') !== 'ceil' && getSquareFeature(x, y, 'double') !== 'none') {
		if(getSquareFeature(x - 1, y, 'double') === 'ceil') {
			setSquareFeature(x, y, 'double', 'wall');
		}
		if(getSquareFeature(x + 1, y, 'double') === 'ceil') {
			setSquareFeature(x, y, 'double', 'wall');
		}
		if(getSquareFeature(x, y - 1, 'double') === 'ceil') {
			setSquareFeature(x, y, 'double', 'wall');
		}
		if(getSquareFeature(x, y + 1, 'double') === 'ceil') {
			setSquareFeature(x, y, 'double', 'wall');
		}
	} else {
		if(hasSquare(x, y, 'door') > -1) {
			setSquareFeature(x, y, 'double', 'wall');
		}
	}
	if(hasSquare(x, y, 'floor') > -1 && hasSquare(x, y, 'pillar') === -1 && hasSquare(x, y, 'obstacle') === -1 && getSquareFeature(x, y, 'double') === 'wall') {
		generateDoor(x, y, true);
	}
}

function generateDoor(x, y, force, locked) {
	if(typeof force === "undefined") {
		var force = false;
	}
	var lk = '';
	if(typeof locked !== "undefined" && locked) {
		lk = ',locked';
	}
	if(Math.abs(x) % 2 === 0 && Math.abs(y + 1) % 2 === 0) {
		if(force || rand(origin.f, x, y, 388.92, 20) === 0) {
			if(!getSquareFeature(x, y, 'wood')) {
				if(setSquare(x, y, 'floor,door' + lk, null, '00')) {
					setSquare(x - 1, y, 'wall', null, '0', true, {double: 'wall', protected: true});
					setSquare(x + 1, y, 'wall', null, '0', true, {double: 'wall', protected: true});
					//setSquare(x, y - 1, 'floor');
					//setSquare(x, y + 1, 'floor');
				}
			}
		}
	} 
	if(Math.abs(x + 1) % 2 === 0 && Math.abs(y) % 2 === 0) {
		if(force || rand(origin.f, x, y, 129.01, 20) === 0) {
			if(!getSquareFeature(x, y, 'wood')) {
				if(setSquare(x, y, 'floor,door' + lk, null, '01')) {
					setSquare(x, y - 1, 'wall', null, '0', true, {double: 'wall', protected: true});
					setSquare(x, y + 1, 'wall', null, '0', true, {double: 'wall', protected: true});
					//setSquare(x - 1, y, 'floor');
					//setSquare(x + 1, y, 'floor');
				}
			}
		}
	}
}

function generatePillar(x, y) {
	if(Math.abs(x) % 2 === 1 || Math.abs(y) % 2 === 1) {
		if(rand(origin.f, x, y, 321.11, 20) === 0) {
			if(hasSquare(x, y, 'door-wood') === -1 && !appendSquare(x, y, 'pillar', 'wall-wood')) {
				setSquare(x, y, 'floor,pillar');
			}
		} else if(rand(origin.f, x, y, 321.11, 10) === 1) {
			if(hasSquare(x, y, 'door-wood') === -1 && !appendSquare(x, y, 'obstacle', 'wall-wood')) {
				var d = rand(origin.f, x, y, 612.77, 4);
				if(hasSquare(x + dir[d].x, y + dir[d].y, 'floor') > -1 && !getSquareFeature(x + dir[d].x, y + dir[d].y, 'wood') && hasSquare(x + dir[d].x, y + dir[d].y, 'pillar') === -1 && hasSquare(x - dir[d].x, y - dir[d].y, 'wall') > -1) {
					setSquare(x, y, 'floor,obstacle', '', '0' + d);
				}
			}
		}
	}
}

function generateRoomWood(x1, y1, xs, ys) {
	if(Math.abs(x1) % 2 === 1 || Math.abs(y1) % 2 === 1) {
		if(rand(origin.f, x1, y1, 109.90, 24) === 1) {
			x1 = x1 - Math.floor(xs / 2) * 2;
			y1 = y1 - Math.floor(ys / 2) * 2;
			for(var y = y1; y < y1 + ys; y++) {
				for(var x = x1; x < x1 + xs; x++) {
					//if(hasSquare(x, y, 'door') === -1) {
						if(hasSquare(x, y, 'wall') > -1) {
							setSquare(x, y, 'floor');
						}
						if(hasSquare(x, y, 'floor') > -1) {
							setSquareFeature(x, y, 'wood', true);
						}
						/*if(hasSquare(x, y, 'floor') > -1) {
							appendSquare(x, y, 'floor-wood', null, '', true);
						} else if(hasSquare(x, y, 'wall') > -1) {
							setSquare(x, y, 'floor,floor-wood');
						}*/
					//}
				}
			}
		}
	}
}

function generateRoomWoodAfter(x, y) {
	if(getSquareFeature(x, y, 'wood')) {
		for(var d = 0; d < 4; d++) {
			var lw = [checkLegalWood(x, y - 1), checkLegalWood(x + 1, y), checkLegalWood(x, y + 1), checkLegalWood(x - 1, y)];
			var ls = checkSurroundings(x, y, 'door-wood') && checkSurroundings(x, y, 'pillar') && checkSurroundings(x, y, 'obstacle') && checkSurroundings(x, y, 'pit');
			if(lw[d] && checkLegalWood(x, y, false)) {
				if(ls) {
					appendSquare(x, y, 'door-wood', null, d, true);
				} else {
					appendSquare(x, y, 'wall-wood', null, d, true);
				}
			}
		}
	}
}

function checkSurroundings(x, y, obj) {
	return hasSquare(x, y, obj) === -1 && hasSquare(x, y - 1, obj) === -1 && hasSquare(x + 1, y, obj) === -1 && hasSquare(x, y + 1, obj) === -1 && hasSquare(x - 1, y, obj) === -1;
}

function checkLegalWood(x, y, wood) {
	var isWood = false;
	if(typeof wood === "undefined" || wood) {
		isWood = getSquareFeature(x, y, 'wood');
	}
	if(hasSquare(x, y, 'wall') === -1 && hasSquare(x, y, 'stairs-up') === -1 && hasSquare(x, y, 'stairs-down') === -1 && hasSquare(x, y, 'door') === -1 && !isWood) {
		return true;
	}
	return false;
}

function getSquare(x, y) {
	if(x - origin.x + Math.floor(mapSize / 2) >= 0 && x - origin.x + Math.floor(mapSize / 2) < mapSize && y - origin.y + Math.floor(mapSize / 2) >= 0 && y - origin.y + Math.floor(mapSize / 2) < mapSize) {
		return map[x - origin.x + Math.floor(mapSize / 2)][y - origin.y + Math.floor(mapSize / 2)];
	}
	return null;
}
function getSquareObj(x, y) {
	var s = getSquare(x, y);
	if(s !== null) {
		return getSquare(x, y).obj;
	}
	return 'floor';
}
function getSquareFeatures(x, y) {
	var s = getSquare(x, y);
	if(s !== null) {
		return getSquare(x, y).features;
	}
	return null;
}
function getSquareFeature(x, y, feat) {
	var s = getSquare(x, y);
	if(s !== null) {
		return getSquare(x, y).features[feat];
	}
	return false;
}
function getSquareDirections(x, y) {
	var s = getSquare(x, y);
	if(s !== null) {
		return s.rotation;
	}
	return '0';
}
function getSquareDirection(x, y, ob) {
	var i = hasSquare(x, y, ob);
	if(i > -1) {
		return parseInt(getSquareDirections(x, y).substring(i, i + 1));
	}
	return 0;
}

function hasSquare(x, y, obf, d) {
	var dir = true;
	var object = getSquareObj(x, y).split(',');
	//var i = object.indexOf(obf);
	for(var i = 0; i < object.length; i++) {
		if(typeof d !== "undefined") {
			dir = getSquareDirections(x, y).substring(i, i + 1) === '' + d;
		}
		if(object[i] === obf && dir) {
			return i;
		}
	}
	return -1;
}

function setSquare(x, y, ob, a, d, force, feat) {
	var success = false;
	if(x - origin.x + Math.floor(mapSize / 2) >= 0 && x - origin.x + Math.floor(mapSize / 2) < mapSize && y - origin.y + Math.floor(mapSize / 2) >= 0 && y - origin.y + Math.floor(mapSize / 2) < mapSize) {
		if((typeof force !== undefined && force) || !getSquareFeature(x, y, 'protected')) {
			var oo = map[x - origin.x + Math.floor(mapSize / 2)][y - origin.y + Math.floor(mapSize / 2)].obj.split(',');
			var allowedOn = [];
			if(typeof a !== "undefined" && a !== null && a !== '') {
				var allowedOn = a.split(',');
			}
			for(var old = 0; old < oo.length; old++) {
				if(map[x - origin.x + Math.floor(mapSize / 2)][y - origin.y + Math.floor(mapSize / 2)] === null || allowedOn.length === 0 || allowedOn.indexOf(oo[old]) > -1) {
					success = true;
					map[x - origin.x + Math.floor(mapSize / 2)][y - origin.y + Math.floor(mapSize / 2)].obj = ob;
					if(typeof feat !== "undefined") {
						map[x - origin.x + Math.floor(mapSize / 2)][y - origin.y + Math.floor(mapSize / 2)].features = feat;
					}
					var obl = ob.split(',').length;
					var dr = getSquareDirections(x, y);
					if(typeof d !== "undefined" && d !== null) {
						if(d !== '') {
							dr = d;
						}
					} else {
						dr = '0';
					}
					dr = Array(obl + 1).join(dr).substring(0, obl);
					map[x - origin.x + Math.floor(mapSize / 2)][y - origin.y + Math.floor(mapSize / 2)].rotation = dr;
				}
			}
		}
	}
	return success;
}

function appendSquare(x, y, ob, a, d, force) {
	var sq = getSquareObj(x, y);
	var dr = getSquareDirections(x, y);
	return setSquare(x, y, sq + ',' + ob, a, dr + d, force);
}

function replaceSquare(x, y, ob1, ob2) {
	var sq = ',' + getSquareObj(x, y);
	if(typeof ob2 !== "undefined" && ob2 !== '') {
		ob2 = ',' + ob2;
	}
	sq = sq.replace(',' + ob1, ob2).substring(1);
	return setSquare(x, y, sq, null, '', true);
}

function equalsSquare(sq1, sq2) {
	if(sq1.obj === sq2.obj && sq1.rotation === sq2.rotation && JSON.stringify(sq1.features) === JSON.stringify(sq2.features)) {
		return true;
	}
	return false;
}

function replaceSquareIndex(x, y, i, ob) {
	if(i > -1) {
		var sq = getSquareObj(x, y).split(',');
		if(typeof ob !== "undefined" && ob !== '') {
			sq[i] = ob;
		} else {
			sq.splice(i, 1);
		}
		return setSquare(x, y, sq.join(), null, '', true);
	}
	return false;
}

function setSquareFeature(x, y, feat, val) {
	var s = getSquare(x, y);
	if(s !== null) {
		s.features[feat] = val;
		return true;
	}
	return false;
}

function drawAll() {
	for(var y = Math.floor((mapSize - viewSize) / 2); y < mapSize - Math.floor((mapSize - viewSize) / 2); y++) {
		for(var x = Math.floor((mapSize - viewSize) / 2); x < mapSize - Math.floor((mapSize - viewSize) / 2); x++) {
			drawSquare(x + origin.x - Math.floor(mapSize / 2), y + origin.y - Math.floor(mapSize / 2));
		}
	}
	drawRect(origin.x, origin.y, 0.2, 0.2, 0.6, 0.6, 0, '#FFFF00');
	/*if(debug) {
	    for(var y = 0; y < mapSize; y++) {
	    	for(var x = 0; x < mapSize; x++) {
	    		if(typeof map[x][y].mesh === "undefined" || map[x][y].mesh === null) {
	    			ctx.fillStyle = '#FF0000';
	    		} else {
	    			ctx.fillStyle = '#00FF00';
	    		}
	    		ctx.fillRect(x * 2, y * 2 + 400, 2, 2);
	    	}
	    }
	}*/
}

function drawSquare(x, y) {
	var ob = getSquareObj(x, y);//map[x - origin.x + Math.floor(mapSize / 2)][y - origin.y + Math.floor(mapSize / 2)].obj;
	var object = [];
	if(typeof ob !== "undefined" && ob !== null) {
		var object = ob.split(',');
	}
	for(o = 0; o < object.length; o++) {
		var d = parseInt(getSquareDirections(x, y).substring(o, o + 1));
		if(object[o] === 'floor') {
			drawRect(x, y, 0, 0, 1, 1, d, '#FFFFFF');
		} else if(object[o] === 'wall') {
			drawRect(x, y, 0, 0, 1, 1, d, '#777777');
		} else if(object[o] === 'wall-wood') {
			drawRect(x, y, 0, 0, 1, 0.1, d, '#994400');
		} else if(object[o] === 'door-wood') {
			drawRect(x, y, 0.2, 0, 0.6, 0.2, d, '#994400');
		} else if(object[o] === 'door-wood-open') {
			drawRect(x, y, 0.2, 0, 0.6, 0.2, d, '#FFAA88');
		} else if(object[o] === 'wall-switch') {
			drawRect(x, y, 0.4, 0, 0.2, 0.2, d, '#4444FF');
		} else if(object[o] === 'wall-switch-off') {
			drawRect(x, y, 0.4, 0, 0.2, 0.2, d, '#0000FF');
		} else if(object[o] === 'wall-deco') {
			drawRect(x, y, 0.45, 0, 0.1, 0.1, d, '#BBBBBB');
		} else if(object[o] === 'wall-deco-high') {
			drawRect(x, y, 0.45, 0, 0.1, 0.1, d, '#BBBBBB');
		} else if(object[o] === 'floor-deco') {
			drawRect(x, y, 0.45, 0.25, 0.1, 0.1, d, '#BBBBBB');
		} else if(object[o] === 'wall-secret') {
			drawRect(x, y, 0, 0, 1, 1, d, '#777777');
		} else if(object[o] === 'stairs-up') {
			drawRect(x, y, 0, 0, 1, 1, d, '#44FF44');
		} else if(object[o] === 'stairs-down') {
			drawRect(x, y, 0, 0, 1, 1, d, '#FF8888');
		} else if(object[o] === 'locked') {
			drawRect(x, y, 0.4, 0.4, 0.2, 0.2, d, '#FF3333');
		} else if(object[o] === 'door') {
			drawRect(x, y, 0.1, 0.4, 0.8, 0.2, d, '#777777');
		} else if(object[o] === 'door-open') {
			drawRect(x, y, 0.1, 0.4, 0.8, 0.2, d, '#CCCCCC');
		} else if(object[o] === 'test') {
			drawRect(x, y, 0.45, 0.45, 0.1, 0.1, d, '#FF88FF');
		} else if(object[o] === 'pillar') {
			drawRect(x, y, 0.2, 0.2, 0.6, 0.6, d, '#777777');
		} else if(object[o] === 'obstacle') {
			drawRect(x, y, 0.2, 0.2, 0.6, 0.6, d, '#BB7777');
		} else if(object[o] === 'teleport') {
			drawRect(x, y, 0, 0, 1, 1, d, '#88CCFF');
		} else if(object[o] === 'pit') {
			drawRect(x, y, 0.2, 0.2, 0.6, 0.6, d, '#000000');
		} else if(object[o] === 'pit-ceil') {
			drawRect(x, y, 0.2, 0.2, 0.6, 0.6, d, '#EEEEEE');
		} else if(object[o] === 'light') {
			drawRect(x, y, 0.45, 0.45, 0.1, 0.1, d, '#FFEE00');
		}
	}
	if(getSquareFeature(x, y, 'double') !== 'ceil') {
		drawRect(x, y, 0, 0, 1, 1, d, '#000000', 0.1);
	}
	if(getSquareFeature(x, y, 'protected')) {
		//drawRect(x, y, 0.45, 0.45, 0.1, 0.1, d, '#ff0000');
	}
	if(getSquareFeature(x, y, 'wood')) {
		//drawRect(x, y, 0, 0, 1, 1, d, '#FF8000', 0.1);
	}
}

//draw recttancle on square, based on a size of 1
function drawRect(x, y, x1, y1, x2, y2, d, c, a) {
	if(!stereo) {
		var xo = (x - origin.x + Math.floor(viewSize / 2));
		var yo = (y - origin.y + Math.floor(viewSize / 2));
		var xp, yp, xs, ys;
		ctx.fillStyle = c;
		ctx.globalAlpha = 1.0;
		if(typeof a !== "undefined") {
			ctx.globalAlpha = a;
		}
		switch(d) {
			case 0: xp = xo + x1;		yp = yo + y1;		xs = x2;	ys = y2;	break;
			case 1: xp = xo + 1 - y1;	yp = yo + x1;		xs = -y2;	ys = x2;	break;
			case 2: xp = xo + 1 - x1;	yp = yo + 1 - y1;	xs = -x2;	ys = -y2;	break;
			case 3: xp = xo + y1;		yp = yo + 1 - x1;	xs = y2;	ys = -x2;	break;
		}
		ctx.fillRect(xp * squareSize, yp * squareSize, xs * squareSize, ys * squareSize);
	}
}

function floorAction(x, y, d) {
	if(typeof d !== "undefined") {
		var d2 = (d + 2) % 4;
	} else if(typeof getSquareFeature(x, y, 'teleport') !== "undefined") {
		var rl = false;
		var s = getSquareFeature(x, y, 'teleport');
		if(typeof s.x !== "undefined") {
			origin.x = s.x;
			rl = true;
		}
		if(typeof s.y !== "undefined") {
			origin.y = s.y;
			rl = true;
		}
		if(typeof s.d !== "undefined") {
			origin.d = s.d;
		}
		if(typeof s.f !== "undefined") {
			origin.f = s.f;
			rl = true;
		}
		if(rl) {
			reloadAll();
		}
	} else if(hasSquare(x, y, 'pit') > -1) {
		origin.f--; reloadAll();
	}
	if(hasSquare(x, y, 'stairs-up', d2) > -1) {
		var d1 = (getSquareDirection(x, y, 'stairs-up') + 2) % 4;
		origin.f++;
		origin.x += dir[d1].x * 2;
		origin.y += dir[d1].y * 2;
		origin.d = d1;
		reloadAll(false);
	} else if(hasSquare(x, y, 'stairs-down', d) > -1) {
		var d1 = getSquareDirection(x, y, 'stairs-down');
		origin.f--;
		origin.x += dir[d1].x * 2;
		origin.y += dir[d1].y * 2;
		origin.d = d1;
		reloadAll(false);
	}
}

//return values:
//0 = no action
//1 = close action
//2 = open action
//check: only check if there is an action available
function wallAction(x, y, d, check) {
    var di1 = hasSquare(x, y, 'door-wood', d);
    var di2 = hasSquare(x + dir[d].x, y + dir[d].y, 'door-wood', (d + 2) % 4);
    var di3 = hasSquare(x, y, 'door-wood-open', d);
    var di4 = hasSquare(x + dir[d].x, y + dir[d].y, 'door-wood-open', (d + 2) % 4);
    if(di1 > -1) {
    	//WOODEN DOOR
    	if(typeof check === "undefined" || !check) {
	    	replaceSquareIndex(x, y, di1, 'door-wood-open');
	    	setMutation(x, y);
	        drawAll();
			tdDraw(x, y);
		}
    	return 2;
    } else if(di2 > -1) {
    	//WOODEN DOOR
    	if(typeof check === "undefined" || !check) {
	    	replaceSquareIndex(x + dir[d].x, y + dir[d].y, di2, 'door-wood-open');
	    	setMutation(x + dir[d].x, y + dir[d].y);
	        drawAll();
			tdDraw(x + dir[d].x, y + dir[d].y);
		}
    	return 2;
    } else if(playerCanMove(d) > -1) {
        //DOOR
        var di1 = hasSquare(x + dir[d].x, y + dir[d].y, 'door');
        var di2 = hasSquare(x + dir[d].x, y + dir[d].y, 'door-open');
        if(hasSquare(x + dir[d].x, y + dir[d].y, 'locked') === -1) {
	    	if(di1 > -1) {
    			if(typeof check === "undefined" || !check) {
		        	replaceSquareIndex(x + dir[d].x, y + dir[d].y, di1, 'door-open');
		        	setMutation(x + dir[d].x, y + dir[d].y);
			        drawAll();
					tdDraw(x + dir[d].x, y + dir[d].y);
				}
	        	return 2;
	        } else if(di2 > -1) {
	        	if(typeof check === "undefined" || !check) {
		        	replaceSquareIndex(x + dir[d].x, y + dir[d].y, di2, 'door');
		        	setMutation(x + dir[d].x, y + dir[d].y);
			        drawAll();
					tdDraw(x + dir[d].x, y + dir[d].y);
				}
	        	return 1;
	        }
	    }

        //WALL SWITCH
        var di1 = hasSquare(x + dir[d].x, y + dir[d].y, 'wall-switch', (d + 2) % 4);
        var di2 = hasSquare(x + dir[d].x, y + dir[d].y, 'wall-switch-off', (d + 2) % 4);
        if(di1 > -1 || di2 > -1) {
        	if(typeof check === "undefined" || !check) {
	        	var feat = getSquareFeatures(x + dir[d].x, y + dir[d].y);
	        	if(!replaceSquareIndex(x + dir[d].x, y + dir[d].y, di1, 'wall-switch-off')) {
					replaceSquareIndex(x + dir[d].x, y + dir[d].y, di2, 'wall-switch');
	        	}
	        	if(typeof feat.target !== "undefined") {
		        	var xt = feat.target.x;
		        	var yt = feat.target.y;
		        	var dt = feat.target.d;
		        	if(typeof dt === "undefined") {
		        		dt = '0';
		        	}
	        		var ss = clone(getSquare(xt, yt)); //source
		        	if(typeof feat.target.obj !== "undefined") {
		        		if(feat.target.obj !== '') {
			        		setSquare(xt, yt, feat.target.obj, '', dt);
			        	}
			        } else {
				        var di1 = hasSquare(xt, yt, 'door');
				        var di2 = hasSquare(xt, yt, 'door-open');
			        	if(di1 > 0) {
			        		replaceSquareIndex(xt, yt, di1, 'door-open');
			        	} else if(di2 > 0) {
			        		replaceSquareIndex(xt, yt, di2, 'door');
			        	} else {
							setSquare(xt, yt, 'floor', '', dt, true);
						}
			        }
			        if(typeof feat.target.mode !== "undefined") {
			        	if(feat.target.mode === 'toggle') {
			        		feat.target.obj = ss.obj;
			        		feat.target.d = ss.rotation;
			        	} else if(feat.target.mode === 'once') {
			        		feat.target.obj = '';
			        	}
			        }
		        	setMutation(x + dir[d].x, y + dir[d].y);
		        	setMutation(xt, yt);
			        drawAll();
					tdDraw(x + dir[d].x, y + dir[d].y);
					tdDraw(xt, yt);
		        }
		    }
        	return 2;
        }
    }
    if(di3 > -1) {
    	//WOODEN DOOR
    	if(typeof check === "undefined" || !check) {
	    	replaceSquareIndex(x, y, di3, 'door-wood');
	    	setMutation(x, y);
	        drawAll();
			tdDraw(x, y);
		}
    	return 1;
    } else if(di4 > -1) {
   		//WOODEN DOOR
   		if(typeof check === "undefined" || !check) {
	    	replaceSquareIndex(x + dir[d].x, y + dir[d].y, di4, 'door-wood');
	    	setMutation(x + dir[d].x, y + dir[d].y);
	        drawAll();
			tdDraw(x + dir[d].x, y + dir[d].y);
		}
    	return 1;
	}
	return 0;
}

function deleteRow(arr, row) {
	arr = arr.slice(0); // make copy
	arr.splice(row, 1);
	return arr;
}

function deleteColumn(arr, col) {
	for(var i = 0 ; i < arr.length ; i++) {
	   arr[i].splice(col, 1);
	}
	return arr;
}

function sleep(milliseconds) {
  	var start = new Date().getTime();
  	for (var i = 0; i < 1e7; i++) {
    	if ((new Date().getTime() - start) > milliseconds){
      		break;
    	}
  	}
}

var seedIndex = 437;
function random(s) {
    var x = Math.sin(s) * 10000;
    return x - Math.floor(x);
}
function rand() {
	var arg = Array.prototype.slice.call(arguments);
	var s = arg[arg.length - 1];
	var sum = 0;
	for (var x = 0; x < arg.length; x++){
		sum = sum + arg[x] * (random(x) + random(seedIndex));
	}
	return Math.floor(random(sum) * s); 
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}
function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return "";
}

function requestFullscreen() {
	var con = document.getElementById('view');
	if (con.requestFullscreen) {
		con.requestFullscreen();
	} else if (con.msRequestFullscreen) {
		con.msRequestFullscreen();
	} else if (con.mozRequestFullScreen) {
		con.mozRequestFullScreen();
	} else if (con.webkitRequestFullscreen) {
		con.webkitRequestFullscreen();
	}
}

function buttonEvents() {
	if(controlsEnabled && !keysFrozen) {
		var d = origin.d;
		var d2 = (origin.d + 2) % 4;
		if(tdGetSpriteOpacity('icon-forward') > 0.4) {
			tdMoveCamera(d);
		} else if(tdGetSpriteOpacity('icon-backward') > 0.4) {
			tdMoveCamera(d2);
		} else if(tdGetSpriteOpacity('icon-use') > 0.4) {
			wallAction(origin.x, origin.y, d);
		}
        for(s in tdSprite) {
            tdSprite[s].mesh.material.opacity = 0;
        }
	}
}

function getMutation(x, y) {
	if(typeof mutation !== "undefined") {
		var k = getMutationKey(origin.f, x, y);
	    if(k.f in mutation) {
	    	if(k.x in mutation[k.f]) {
	    		if(k.y in mutation[k.f][k.x]) {
	       			return mutation[k.f][k.x][k.y];
	       		}
	       	}
	    }
	}
    return null;
}
function setMutation(x1, y1) {
	var m = toMapCoord(x1, y1);
	if(m.x >= 0 && m.x < mapSize && m.y >= 0 && m.y < mapSize) {
		var k = getMutationKey(origin.f, x1, y1);
		if(typeof mutation[k.f] === "undefined") {
			mutation[k.f] = {};	
		}
		if(typeof mutation[k.f][k.x] === "undefined") {
			mutation[k.f][k.x] = {};
		}
		mutation[k.f][k.x][k.y] = clone(map[m.x][m.y]);
    }
}
function deleteMutation(x, y) {
	var m = getMutation(x, y);
	if(m !== null) {
		var k = getMutationKey(origin.f, x, y);
	    delete mutation[k.f][k.x][k.y];
	    if($.isEmptyObject(mutation[k.f][k.x])) {
	    	delete mutation[k.f][k.x];
	    	if($.isEmptyObject(mutation[k.f])) {
	    		delete mutation[k.f];
	    	}
	    }
	}
}
function getMutationKey(f, x, y) {
	return {
		f: 'F' + f,
		x: 'X' + x,
		y: 'Y' + y
	}
}

/*
function getMutation(x1, y1) {
    if(keyLocation(origin.f, x1, y1) in mutation) {
        return mutation[keyLocation(origin.f, x1, y1)];
    }
    return null;
}
function setMutation(x1, y1) {
	var x = toMapCoord(x1, y1).x;
	var y = toMapCoord(x1, y1).y;
	if(x1 - origin.x + Math.floor(mapSize / 2) >= 0 && x1 - origin.x + Math.floor(mapSize / 2) < mapSize && y1 - origin.y + Math.floor(mapSize / 2) >= 0 && y1 - origin.y + Math.floor(mapSize / 2) < mapSize) {
    	mutation[keyLocation(origin.f,x1,y1)] = clone(map[x1 - origin.x + Math.floor(mapSize / 2)][y1 - origin.y + Math.floor(mapSize / 2)]);
    }
}
function deleteMutation(x1,y1){
    delete mutation[keyLocation(origin.f,x1,y1)];
}
function keyLocation(f, x, y){
    return "F:" + f + ",X:" + x + ",Y:" + y;
}*/

function toMapCoord(x, y) {
	return { x: x - origin.x + Math.floor(mapSize / 2), y: y - origin.y + Math.floor(mapSize / 2) };
}

function toRealCoord(x, y) {
	return { x: x + origin.x - Math.floor(mapSize / 2), y: y + origin.y - Math.floor(mapSize / 2) };
}

function clone(o) {
	var j = $.extend(true, {}, o);
	return j;
	//return JSON.parse(JSON.stringify(o));
}

function fileExist(urlToFile) {
	try {
	    var xhr = new XMLHttpRequest();
	    xhr.open('HEAD', urlToFile, false);
	    xhr.send();
	} catch(err) {
	    xhr.abort();
		return false;
	}     
    if (xhr.status == "404") {
	    xhr.abort();
        return false;
    } else {
	    xhr.abort();
        return true;
    }
}

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

function printDebug() {
	if(debug) {
	    $('#debug').html('Camera: X ' + camera.position.x.toFixed(2) + ', Y ' + camera.position.y.toFixed(2) + ', Z ' + camera.position.z.toFixed(2) + ', RX ' + camera.rotation.x.toFixed(2) + ', RY ' + camera.rotation.y.toFixed(2) + ', RZ ' + camera.rotation.z.toFixed(2) + '<br>');
	    $('#debug').append('Light: X ' + light.position.x.toFixed(2) + ', Y ' + light.position.y.toFixed(2) + ', Z ' + light.position.z.toFixed(2) + ', RX ' + light.rotation.x.toFixed(2) + ', RY ' + light.rotation.y.toFixed(2) + ', RZ ' + light.rotation.z.toFixed(2) + '<br>');
	    $('#debug').append('Origin3D: X ' + origin.xt + ', Y ' + origin.yt + '<br>');
	    $('#debug').append('Objects: ' + scene.children.length);
	    stats.update();
	}
}

if(debug) {
	(function () {
	    "use strict";

	    var methods, generateNewMethod, i, j, cur, old, addEvent;

	    if ("console" in window) {
	        methods = [
	            "log", "assert", "clear", "count",
	            "debug", "dir", "dirxml", "error",
	            "exception", "group", "groupCollapsed",
	            "groupEnd", "info", "profile", "profileEnd",
	            "table", "time", "timeEnd", "timeStamp",
	            "trace", "warn"
	        ];

	        generateNewMethod = function (oldCallback, methodName) {
	            return function () {
	                var args;
	                //alert("called console." + methodName + ", with " + arguments.length + " argument(s)");
	                args = Array.prototype.slice.call(arguments, 0);
	                Function.prototype.apply.call(oldCallback, console, arguments);
	            };
	        };

	        for (i = 0, j = methods.length; i < j; i++) {
	            cur = methods[i];
	            if (cur in console) {
	                old = console[cur];
	                console[cur] = generateNewMethod(old, cur);
	            }
	        }
	    }

	    window.onerror = function (msg, url, line) {
	    	if($('body > #log').length === 0) {
	    		$('body').append('<div id="log"></div>')
	    	}
	        $('#log').text($('#log').html() + msg + ", " + url + ", line " + line);
	        $('#log').append('<br>');
	    };
	}());
}