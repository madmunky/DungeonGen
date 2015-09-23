var dir = [{x: 0, y: -1}, {x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}];
var mapSize = 25;
var viewSize = 19;
var tdViewSize = 21;
var squareSize = 20;
var keysFrozen = false;
var origin = {f: 0, x: 0, y: 0};
var map, mutation = {};
var canvas;
var ctx;

initPlayer();
loadGame(0);

$(function() {
	canvas = document.getElementById("canvas");
	ctx = canvas.getContext("2d");
	ctx.canvas.width  = viewSize * squareSize;
	ctx.canvas.height = viewSize * squareSize;
	initField();
	drawAll();

	$(document).keydown(function(e) {
		if(!keysFrozen) {
			var d = origin.d;
			var d1 = (origin.d + 1) % 4;
			var d2 = (origin.d + 2) % 4;
			var d3 = (origin.d + 3) % 4;
		    switch(e.which) {
		    	case 82:
				origin = {f: (Math.floor(Math.random() * 1000000) - 500000) * 2, x: (Math.floor(Math.random() * 1000000) - 500000) * 2, y: (Math.floor(Math.random() * 1000000) - 500000) * 2, d: Math.floor(Math.random() * 4)};
		    	initField(); drawAll(); tdDrawAll(); tdUpdateCamera(); // r
		    	break;

		        case 65:
				tdMoveCamera(d3); // a
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

		        case 33: origin.f++; initField(); drawAll(); tdDrawAll(); tdUpdateCamera(); // page up
		        break;

		        case 34: origin.f--; initField(); drawAll(); tdDrawAll(); tdUpdateCamera(); // page down
		        break;

		        case 32:
		        var di1 = hasSquare(origin.x, origin.y, 'door-wood', d);
		        var di2 = hasSquare(origin.x + dir[d].x, origin.y + dir[d].y, 'door-wood', (d + 2) % 4);
		        var di3 = hasSquare(origin.x, origin.y, 'door-wood-open', d);
		        var di4 = hasSquare(origin.x + dir[d].x, origin.y + dir[d].y, 'door-wood-open', (d + 2) % 4);
		        if(di1 > -1) {
		        	//WOODEN DOOR
		        	replaceSquareIndex(origin.x, origin.y, di1, 'door-wood-open');
		        	setMutation(origin.x, origin.y);
			        drawAll();
					tdDrawAll();
		        	break;
		        } else if(di2 > -1) {
		        	//WOODEN DOOR
		        	replaceSquareIndex(origin.x + dir[d].x, origin.y + dir[d].y, di2, 'door-wood-open');
		        	setMutation(origin.x + dir[d].x, origin.y + dir[d].y);
			        drawAll();
					tdDrawAll();
		        	break;
		        } else if(playerCanMove(d) > -1) {
			        //DOOR
			        var di1 = hasSquare(origin.x + dir[d].x, origin.y + dir[d].y, 'door');
			        var di2 = hasSquare(origin.x + dir[d].x, origin.y + dir[d].y, 'door-open');
		        	if(di1 > -1) {
			        	replaceSquareIndex(origin.x + dir[d].x, origin.y + dir[d].y, di1, 'door-open');
			        	setMutation(origin.x + dir[d].x, origin.y + dir[d].y);
				        drawAll();
						tdDrawAll();
			        	break;
			        } else if(di2 > -1) {
			        	replaceSquareIndex(origin.x + dir[d].x, origin.y + dir[d].y, di2, 'door');
			        	setMutation(origin.x + dir[d].x, origin.y + dir[d].y);
				        drawAll();
						tdDrawAll();
			        	break;
			        }

			        //WALL SWITCH
			        var di1 = hasSquare(origin.x + dir[d].x, origin.y + dir[d].y, 'wall-switch', (d + 2) % 4);
			        if(di1 > -1) {
			        	setSquare(origin.x + dir[d].x, origin.y + dir[d].y, 'floor', '', '', true);
			        	setMutation(origin.x + dir[d].x, origin.y + dir[d].y);
				        drawAll();
						tdDrawAll();
			        	break;
			        }
		        }
		        if(di3 > -1) {
		        	//WOODEN DOOR
		        	replaceSquareIndex(origin.x, origin.y, di3, 'door-wood');
		        	setMutation(origin.x, origin.y);
			        drawAll();
					tdDrawAll();
		        	break;
		        } else if(di4 > -1) {
		       		//WOODEN DOOR
		        	replaceSquareIndex(origin.x + dir[d].x, origin.y + dir[d].y, di4, 'door-wood');
		        	setMutation(origin.x + dir[d].x, origin.y + dir[d].y);
			        drawAll();
					tdDrawAll();
		        	break;
				}
		        break;

		        default: return; // exit this handler for other keys
		    }
	    }
	    e.preventDefault();
	});
	$('body input#coordinates').change(function() {
		//F: -1347, X: -35708, Y: -561, D: 0
		//F: 27062, X: -13494, Y: 41160, D: 0
		//F: 19272, X: 30367, Y: -22652, D: 3
		//F: 22600, X: -23948, Y: -24524, D: 0
		//F: 22969, X: 4298, Y: 27901, D: 0
		origin = parseCoordinates($(this).val());
		initField();
		drawAll();
		tdDrawAll();
		tdUpdateCamera();
	});
	$('body input#reset-game').click(function() {
		mutation = {};
		deleteGame(0);
		initField();
		drawAll();
		tdDrawAll();
		tdUpdateCamera();
	});
});

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

function initPlayer() {
	var str = getCookie('player-coordinates');
	if(str === '') {
		origin = {f: (Math.floor(Math.random() * 100000) - 50000) * 2, x: (Math.floor(Math.random() * 100000) - 50000) * 2, y: (Math.floor(Math.random() * 100000) - 50000) * 2, d: Math.floor(Math.random() * 4)};
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
	} else if(hasSquare(origin.x + xo, origin.y + yo, 'wall-secret') === -1 && (hasSquare(origin.x + xo, origin.y + yo, 'wall') > -1 || hasSquare(origin.x + xo, origin.y + yo, 'pillar') > -1 || hasSquare(origin.x + xo, origin.y + yo, 'door') > -1)) {
    	return 0;
    }
    return 1;
}

function initField() {
	clearField(origin.x - Math.floor(mapSize / 2), origin.y - Math.floor(mapSize / 2), origin.x - Math.floor(mapSize / 2) + mapSize, origin.y - Math.floor(mapSize / 2) + mapSize, true);
	generateField(origin.x - Math.floor(mapSize / 2), origin.y - Math.floor(mapSize / 2), origin.x - Math.floor(mapSize / 2) + mapSize, origin.y - Math.floor(mapSize / 2) + mapSize);
}

function initPart(d) {
	switch(d) {
		case 0:
			var ra = [0, 0, mapSize, 2];
			map = deleteColumn(map, mapSize);
			for (var i = 0; i < mapSize; i++) {
		        map[i].unshift(null);
		    }
			break;
		case 1:
			var ra = [mapSize - 2, 0, mapSize, mapSize];
			map = deleteRow(map, 0);
			map.push(null);
			break;
		case 2:
			var ra = [0, mapSize - 2, mapSize, mapSize];
			map = deleteColumn(map, 0);
			for (var i = 0; i < mapSize; i++) {
		        map[i].push(null);
		    }
			break;
		case 3:
			var ra = [0, 0, 2, mapSize];
			map = deleteRow(map, mapSize - 1);
			map.unshift(null);
			break;
		default:
			break;
	}
	clearField(origin.x - Math.floor(mapSize / 2) + ra[0], origin.y - Math.floor(mapSize / 2) + ra[1], origin.x - Math.floor(mapSize / 2) + ra[2], origin.y - Math.floor(mapSize / 2) + ra[3]);
	generateField(origin.x - Math.floor(mapSize / 2) + ra[0], origin.y - Math.floor(mapSize / 2) + ra[1], origin.x - Math.floor(mapSize / 2) + ra[2], origin.y - Math.floor(mapSize / 2) + ra[3]);
	drawAll();
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
				map[x][y] = { obj: 'wall', mesh: null, rotation: '0' };
			}
			setSquare(toRealCoord(x, y).x, toRealCoord(x, y).y, 'wall', null, '0', force);
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
			generateDoor(x, y);
			generateStairs(x, y);
			generateDeco(x, y);
			generatePillar(x, y);
			generateRoomWood(x, y, rand(origin.f, x, y, 859.35, 2) * 2 + 1, rand(origin.f, x, y, 123.76, 2) * 2 + 1);
		}
	}
	for(var y = y1; y < y2; y++) {
		for(var x = x1; x < x2; x++) {
			generateWood(x, y);
		}
	}
	for(var y = y1; y < y2; y++) {
		for(var x = x1; x < x2; x++) {
			replaceSquare(x, y, 'floor-wood', 'floor');
		}
	}
	for(var y = y1; y < y2; y++) {
		for(var x = x1; x < x2; x++) {
			var sq = getMutation(x, y);
			if(sq !== null) {
				if(getSquare(x, y) !== sq) {
					setSquare(x, y, sq, null, '', true);
				} else {
					deleteMutation(x, y);
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
		if(rand(origin.f, x, y, 94.09, 12) === 0) {
			generateRoom(x, y, rand(origin.f, x, y, 859.35, 3) * 2 + 1, rand(origin.f, x, y, 123.76, 3) * 2 + 1);
		}
	}
}

function generateRoom(x1, y1, xs, ys) {
	x1 = x1 - Math.floor(xs / 2) * 2;
	y1 = y1 - Math.floor(ys / 2) * 2;
	for(var y = y1; y < y1 + ys; y++) {
		for(var x = x1; x < x1 + xs; x++) {
			setSquare(x, y, 'floor', 'wall');
		}
	}
	/*for(var y = y1; y < y1 + ys; y++) {
		if(rand(origin.f, x1 - 1, y, 388.92, 3) < 1 && hasSquare(x1 - 1, y, 'corridor')) {
			setSquare(x1 - 1, y, 'floor,door', 'corridor', '1');
			setSquare(x1 - 1, y - 1, 'wall,protected');
			setSquare(x1 - 1, y + 1, 'wall,protected');
		}
		if(rand(origin.f, x1 + xs, y, 287.45, 3) < 1 && hasSquare(x1 + xs, y, 'corridor')) {
			setSquare(x1 + xs, y, 'floor,door', 'corridor', '1');
			setSquare(x1 + xs, y - 1, 'wall,protected');
			setSquare(x1 + xs, y + 1, 'wall,protected');
		}
	}
	for(var x = x1; x < x1 + xs; x++) {
		if(rand(origin.f, x, y1 - 1, 893.83, 3) < 1 && hasSquare(x, y1 - 1, 'corridor')) {
			setSquare(x, y1 - 1, 'floor,door', 'corridor', '0');
			setSquare(x - 1, y1 - 1, 'wall,protected');
			setSquare(x + 1, y1 - 1, 'wall,protected');
		}
		if(rand(origin.f, x, y1 + ys, 117.97, 3) < 1 && hasSquare(x, y1 + ys, 'corridor')) {
			setSquare(x, y1 + ys, 'floor,door', 'corridor', '0');
			setSquare(x - 1, y1 + ys, 'wall,protected');
			setSquare(x + 1, y1 + ys, 'wall,protected');
		}
	}*/
}

function generateRoomWood(x1, y1, xs, ys) {
	if(Math.abs(x1) % 2 === 1 || Math.abs(y1) % 2 === 1) {
		if(rand(origin.f, x1, y1, 94.09, 24) === 1) {
			x1 = x1 - Math.floor(xs / 2) * 2;
			y1 = y1 - Math.floor(ys / 2) * 2;
			for(var y = y1; y < y1 + ys; y++) {
				for(var x = x1; x < x1 + xs; x++) {
					setSquare(x, y, 'floor-wood');
				}
			}
		}
	}
}

function generateWood(x, y) {
	if(hasSquare(x, y, 'floor-wood') > -1) {
		if(checkLegalWood(x, y - 1)) {
			if(rand(origin.f, x, y, 300.23, 4) === 0 && hasSquare(x, y - 1, 'pillar') === -1) {
				appendSquare(x, y, 'door-wood', null, '0');
			} else {
				appendSquare(x, y, 'wall-wood', null, '0');
			}
		}
		if(checkLegalWood(x + 1, y)) {
			if(rand(origin.f, x, y, 912.12, 4) === 0 && hasSquare(x + 1, y, 'pillar') === -1) {
				appendSquare(x, y, 'door-wood', null, '1');
			} else {
				appendSquare(x, y, 'wall-wood', null, '1');
			}
		}
		if(checkLegalWood(x, y + 1)) {
			if(rand(origin.f, x, y, 12.09, 4) === 0 && hasSquare(x, y + 1, 'pillar') === -1) {
				appendSquare(x, y, 'door-wood', null, '2');
			} else {
				appendSquare(x, y, 'wall-wood', null, '2');
			}
		}
		if(checkLegalWood(x - 1, y)) {
			if(rand(origin.f, x, y, 772.37, 4) === 0 && hasSquare(x - 1, y, 'pillar') === -1) {
				appendSquare(x, y, 'door-wood', null, '3');
			} else {
				appendSquare(x, y, 'wall-wood', null, '3');
			}
		}
	}
}

function generatePillar(x, y) {
	if(Math.abs(x) % 2 !== 0 || Math.abs(y) % 2 !== 0) {
		if(rand(origin.f, x, y, 321.11, 10) === 0) {
			if(hasSquare(x, y, 'door-wood') === -1 && !appendSquare(x, y, 'pillar', 'wall-wood')) {
				setSquare(x, y, 'floor,pillar');
			}
		}
	}
}

function checkLegalWood(x, y) {
	if((hasSquare(x, y, 'wall') === -1 || hasSquare(x, y, 'wall-switch') !== -1) && hasSquare(x, y, 'door') === -1 && hasSquare(x, y, 'floor-wood') === -1) {
		return true;
	}
	return false;
}

function generateDoor(x, y) {
	if(Math.abs(x) % 2 === 0 && Math.abs(y + 1) % 2 === 0) {
		if(rand(origin.f, x, y, 388.92, 20) === 0) {
			if(setSquare(x, y, 'floor,door,protected', null, '0')) {
				setSquare(x - 1, y, 'wall,protected', null, '0', true);
				setSquare(x + 1, y, 'wall,protected', null, '0', true);
				setSquare(x, y - 1, 'floor');
				setSquare(x, y + 1, 'floor');
			}
		}
	} 
	if(Math.abs(x + 1) % 2 === 0 && Math.abs(y) % 2 === 0) {
		if(rand(origin.f, x, y, 129.01, 20) === 0) {
			if(setSquare(x, y, 'floor,door,protected', null, '1')) {
				setSquare(x, y - 1, 'wall,protected', null, '0', true);
				setSquare(x, y + 1, 'wall,protected', null, '0', true);
				setSquare(x - 1, y, 'floor');
				setSquare(x + 1, y, 'floor');
			}
		}
	}
}

function generateStairs(x, y) {
	if(Math.abs(x) % 2 === 0 && Math.abs(y) % 2 === 0) {
		if(rand(origin.f - 1, x, y, 0, 40) >= 1 && rand(origin.f, x, y, 0, 40) < 1) {
			d = rand(origin.f, x, y, 0, 4);
			d1 = (d + 1) % 4;
			d2 = (d + 2) % 4;
			d3 = (d + 3) % 4;
			if(rand(origin.f, x, y, 0, 4) < 3) {
				if(setSquare(x, y, 'stairsup,protected', null, d, true)) {
					setSquare(x + dir[d1].x, y + dir[d1].y, 'wall,protected', null, '0', true);
					setSquare(x + dir[d2].x, y + dir[d2].y, 'wall,protected', null, '0', true);
					setSquare(x + dir[d3].x, y + dir[d3].y, 'wall,protected', null, '0', true);
					setSquare(x + dir[d].x, y + dir[d].y, 'floor');
				}
			} else {
				appendSquare(x, y, 'pit-ceil', null, '', true);
			}
		}
		if(rand(origin.f - 1, x, y, 0, 40) < 1) {
			d = (rand(origin.f - 1, x, y, 0, 4) + 2) % 4;
			d1 = (d + 1) % 4;
			d2 = (d + 2) % 4;
			d3 = (d + 3) % 4;
			if(rand(origin.f - 1, x, y, 0, 4) < 3) {
				if(setSquare(x, y, 'stairsdown,protected', null, d2, true)) {
					setSquare(x + dir[d1].x, y + dir[d1].y, 'wall,protected', null, '0', true);
					setSquare(x + dir[d2].x, y + dir[d2].y, 'wall,protected', null, '0', true);
					setSquare(x + dir[d3].x, y + dir[d3].y, 'wall,protected', null, '0', true);
					setSquare(x + dir[d].x, y + dir[d].y, 'floor');
				}
			} else {
				setSquare(x, y, 'floor,pit', null, '', true);
			}
		}
		if(getSquare(x, y) === 'floor') {
			var e = 0;
			var d1 = 0;
			for(var d = 0; d < 4; d++) {
				if(hasSquare(x + dir[d].x, y + dir[d].y, 'floor') > -1) {
					d1 = (rand(origin.f, x, y, 919.19, 3) + d + 1) % 4;
					e++;
				}
			}
			if(e <= 1) {
				switch(rand(origin.f, x, y, 811.77, 12)) {
					case 0:
					setSquare(x + dir[d1].x, y + dir[d1].y, 'wall,wall-switch', '', '0' + (d1 + 2) % 4);
					break;
					case 1:
					setSquare(x, y, 'floor,teleport', '', '0' + d1);					
					break;
					case 2:
					setSquare(x + dir[d1].x, y + dir[d1].y, 'floor,wall-secret', 'wall');
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
	if(hasSquare(x, y, 'door') > -1) {
		d = '';
	}
	if(hasSquare(x, y, 'wall') > -1 && hasSquare(x, y, 'wall-switch') === -1) {
		if(rand(origin.f, x, y, 860.97, 2) === 0) {
			if(hasSquare(x + dir[d].x, y + dir[d].y, 'wall') === -1) {
				appendSquare(x, y, 'wall-deco', null, d, true);
			}
		}
	} else if(hasSquare(x, y, 'floor') > -1 && hasSquare(x, y, 'pit') === -1) {
		if(rand(origin.f, x, y, 860.97, 30) === 0) {
			appendSquare(x, y, 'floor-deco', null, d, true);
		}
	}
}

function getSquare(x, y) {
	if(x - origin.x + Math.floor(mapSize / 2) >= 0 && x - origin.x + Math.floor(mapSize / 2) < mapSize && y - origin.y + Math.floor(mapSize / 2) >= 0 && y - origin.y + Math.floor(mapSize / 2) < mapSize) {
		return map[x - origin.x + Math.floor(mapSize / 2)][y - origin.y + Math.floor(mapSize / 2)].obj;
	}
	return 'floor';
}

function getSquareDirection(x, y, ob) {
	var i = hasSquare(x, y, ob);
	if(i > -1) {
		return parseInt(getSquareDirections(x, y).substring(i, i + 1));
	}
	return 0;
}

function getSquareDirections(x, y) {
	if(x - origin.x + Math.floor(mapSize / 2) >= 0 && x - origin.x + Math.floor(mapSize / 2) < mapSize && y - origin.y + Math.floor(mapSize / 2) >= 0 && y - origin.y + Math.floor(mapSize / 2) < mapSize) {
		return map[x - origin.x + Math.floor(mapSize / 2)][y - origin.y + Math.floor(mapSize / 2)].rotation;
	}
	return '0';
}

function hasSquare(x, y, obf, d) {
	var dir = true;
	var object = getSquare(x, y).split(',');
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

function setSquare(x, y, ob, a, d, force) {
	var success = false;
	if(x - origin.x + Math.floor(mapSize / 2) >= 0 && x - origin.x + Math.floor(mapSize / 2) < mapSize && y - origin.y + Math.floor(mapSize / 2) >= 0 && y - origin.y + Math.floor(mapSize / 2) < mapSize) {
		if((typeof force !== undefined && force) || hasSquare(x, y, 'protected') === -1) {
			var oo = map[x - origin.x + Math.floor(mapSize / 2)][y - origin.y + Math.floor(mapSize / 2)].obj.split(',');
			var allowedOn = [];
			if(typeof a !== "undefined" && a !== null && a !== '') {
				var allowedOn = a.split(',');
			}
			for(var old = 0; old < oo.length; old++) {
				if(map[x - origin.x + Math.floor(mapSize / 2)][y - origin.y + Math.floor(mapSize / 2)] === null || allowedOn.length === 0 || allowedOn.indexOf(oo[old]) > -1) {
					success = true;
					map[x - origin.x + Math.floor(mapSize / 2)][y - origin.y + Math.floor(mapSize / 2)].obj = ob;
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
	var sq = getSquare(x, y);
	var dr = getSquareDirections(x, y);
	return setSquare(x, y, sq + ',' + ob, a, dr + d, force);
}

function replaceSquare(x, y, ob1, ob2) {
	var sq = ',' + getSquare(x, y);
	if(typeof ob2 !== "undefined" && ob2 !== '') {
		ob2 = ',' + ob2;
	}
	sq = sq.replace(',' + ob1, ob2).substring(1);
	return setSquare(x, y, sq, null, '', true);
}

function replaceSquareIndex(x, y, i, ob) {
	var sq = getSquare(x, y).split(',');
	if(typeof ob !== "undefined" && ob !== '') {
		sq[i] = ob;
	} else {
		sq.splice(i, 1);
	}
	return setSquare(x, y, sq.join(), null, '', true);
}

function drawAll() {
	for(var y = Math.floor((mapSize - viewSize) / 2); y < mapSize - Math.floor((mapSize - viewSize) / 2); y++) {
		for(var x = Math.floor((mapSize - viewSize) / 2); x < mapSize - Math.floor((mapSize - viewSize) / 2); x++) {
			drawSquare(x + origin.x - Math.floor(mapSize / 2), y + origin.y - Math.floor(mapSize / 2));
		}
	}
	drawRect(origin.x, origin.y, 0.2, 0.2, 0.6, 0.6, 0, '#FFFF00');
	//ctx.fillStyle = '#FFFF00';
	//ctx.fillRect(Math.floor(viewSize / 2) * squareSize, Math.floor(viewSize / 2) * squareSize, squareSize, squareSize);
}

function drawSquare(x, y) {
	var ob = getSquare(x, y);//map[x - origin.x + Math.floor(mapSize / 2)][y - origin.y + Math.floor(mapSize / 2)].obj;
	var object = [];
	if(typeof ob !== "undefined" && ob !== null) {
		var object = ob.split(',');
	}
	for(o = 0; o < object.length; o++) {
		var d = parseInt(getSquareDirections(x, y).substring(o, o + 1));
		if(object[o] === 'floor') {
			drawRect(x, y, 0, 0, 1, 1, d, '#FFFFFF');
		//} else if(object[o] === 'corridor') {
		//	drawRect(x, y, 0, 0, 0, 1, 1, 0, 0, '#EEEEFF');
		} else if(object[o] === 'wall') {
			drawRect(x, y, 0, 0, 1, 1, d, '#999999');
		} else if(object[o] === 'wall-wood') {
			drawRect(x, y, 0, 0, 1, 0.1, d, '#994400');
		} else if(object[o] === 'door-wood') {
			drawRect(x, y, 0.2, 0, 0.6, 0.2, d, '#994400');
		} else if(object[o] === 'door-wood-open') {
			drawRect(x, y, 0.2, 0, 0.6, 0.2, d, '#FFAA88');
		} else if(object[o] === 'floor-wood') {
			drawRect(x, y, 0, 0, 1, 1, d, '#FFEEDD');
		} else if(object[o] === 'wall-switch') {
			drawRect(x, y, 0.4, 0, 0.2, 0.2, d, '#0000FF');
		} else if(object[o] === 'wall-deco') {
			drawRect(x, y, 0.45, 0, 0.1, 0.1, d, '#BBBBBB');
		} else if(object[o] === 'floor-deco') {
			drawRect(x, y, 0.45, 0.25, 0.1, 0.1, d, '#BBBBBB');
		} else if(object[o] === 'wall-secret') {
			drawRect(x, y, 0, 0, 1, 1, d, '#AAAAAA');
		} else if(object[o] === 'stairsup') {
			drawRect(x, y, 0, 0, 1, 1, d, '#44FF44');
		} else if(object[o] === 'stairsdown') {
			drawRect(x, y, 0, 0, 1, 1, d, '#FF8888');
		} else if(object[o] === 'door') {
			drawRect(x, y, 0.1, 0.4, 0.8, 0.2, d, '#999999');
		} else if(object[o] === 'door-open') {
			drawRect(x, y, 0.1, 0.4, 0.8, 0.2, d, '#CCCCCC');
		} else if(object[o] === 'test') {
			drawRect(x, y, 0.45, 0.45, 0.1, 0.1, d, '#FF88FF');
		} else if(object[o] === 'pillar') {
			drawRect(x, y, 0.2, 0.2, 0.6, 0.6, d, '#999999');
		} else if(object[o] === 'teleport') {
			drawRect(x, y, 0, 0, 1, 1, d, '#88CCFF');
		} else if(object[o] === 'pit') {
			drawRect(x, y, 0.2, 0.2, 0.6, 0.6, d, '#000000');
		} else if(object[o] === 'pit-ceil') {
			drawRect(x, y, 0.2, 0.2, 0.6, 0.6, d, '#EEEEEE');
		} else if(object[o] === 'protected') {
			//drawRect(x, y, 0.45, 0.45, 0.1, 0.1, d, '#FF0000');
		}
	}
}

//draw recttancle on square, based on a size of 1
function drawRect(x, y, x1, y1, x2, y2, d, c) {
	var xo = (x - origin.x + Math.floor(viewSize / 2));
	var yo = (y - origin.y + Math.floor(viewSize / 2));
	var xp, yp, xs, ys;
	ctx.fillStyle = c;
	switch(d) {
		case 0: xp = xo + x1;		yp = yo + y1;		xs = x2;	ys = y2;	break;
		case 1: xp = xo + 1 - y1;	yp = yo + x1;		xs = -y2;	ys = x2;	break;
		case 2: xp = xo + 1 - x1;	yp = yo + 1 - y1;	xs = -x2;	ys = -y2;	break;
		case 3: xp = xo + y1;		yp = yo + 1 - x1;	xs = y2;	ys = -x2;	break;
	}
	ctx.fillRect(xp * squareSize, yp * squareSize, xs * squareSize, ys * squareSize);
}

function floorAction(x, y, d) {
	if(typeof d !== "undefined") {
		var d2 = (d + 2) % 4;
	}
	if(hasSquare(x, y, 'stairsup', d2) > -1) {
		origin.f++; initField(); drawAll(); tdDrawAll();
	} else if(hasSquare(x, y, 'stairsdown', d) > -1) {
		origin.f--; initField(); drawAll(); tdDrawAll();
	} else if(hasSquare(x, y, 'teleport') > -1) {
		var d1 = getSquareDirection(x, y, 'teleport');
		origin.x = origin.x + dir[d1].x * 2;
		origin.y = origin.y + dir[d1].y * 2;
		initField(); drawAll(); tdDrawAll();
	} else if(hasSquare(x, y, 'pit') > -1) {
		origin.f--; initField(); drawAll(); tdDrawAll(); floorAction(x, y);
	}
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
/*
function getMutation(x1, y1) {
	var f = 'f' + origin.f;
	var x = 'x' + x1;
	var y = 'y' + y1;
	if(typeof mutation[f] !== "undefined") {
		if(typeof mutation[f][x] !== "undefined") {
			if(typeof mutation[f][x][y] !== "undefined") {
				return mutation[f][x][y];
			}
		}
	}
	return null;
}

function setMutation(x1, y1) {
	var f = 'f' + origin.f;
	var x = 'x' + x1;
	var y = 'y' + y1;
	if(typeof mutation[f] === "undefined") {
		mutation[f] = [];
	}
	if(typeof mutation[f][x] === "undefined") {
		mutation[f][x] = [];
	}
	mutation[f][x][y] = getSquare(x, y);
}

function deleteMutation(x1, y1) {
	var f = 'f' + origin.f;
	var x = 'x' + x1;
	var y = 'y' + y1;
	if(typeof mutation[f] !== "undefined") {
		if(typeof mutation[f][x] !== "undefined") {
			if(typeof mutation[f][x][y] !== "undefined") {
				var i = mutation[f][x].indexOf(y);
				mutation[f][x].splice(y, i, 1);
			}
		}
	}
}*/
function getMutation(x1, y1) {
    if (keyLocation(origin.f,x1,y1) in mutation){
        return mutation[keyLocation(origin.f,x1,y1)];
    }
    return null;
}
function setMutation(x1, y1) {
    mutation[keyLocation(origin.f,x1,y1)] = getSquare(x1, y1);
}

function deleteMutation(x1,y1){
    delete map[keyLocation(origin.f,x1,y1)];
}

function keyLocation(f,x,y){
    return "F:"+f+",X:"+x+",Y:"+y;
}

function toMapCoord(x, y) {
	return { x: x - origin.x + Math.floor(mapSize / 2), y: y - origin.y + Math.floor(mapSize / 2) };
}

function toRealCoord(x, y) {
	return { x: x + origin.x - Math.floor(mapSize / 2), y: y + origin.y - Math.floor(mapSize / 2) };
}