var dir = [{x: 0, y: -1}, {x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}];
var mapSize = 30;
var viewSize = 30;
var tdViewSize = 20;
var squareSize = 15;
var keysFrozen = false;
var origin = {f: 0, x: 0, y: 0};
var map = [];
var mutation = {};
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
    tdDrawAll();

    $(document).keydown(function(e) {
        if(!keysFrozen) {
            var d = origin.d;
            var d1 = (origin.d + 1) % 4;
            var d2 = (origin.d + 2) % 4;
            var d3 = (origin.d + 3) % 4;
            switch(e.which) {
                case 82:
                origin = {f: (Math.floor(Math.random() * 100000) - 50000) * 2, x: (Math.floor(Math.random() * 100000) - 50000) * 2, y: (Math.floor(Math.random() * 100000) - 50000) * 2, d: Math.floor(Math.random() * 4)};
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
                if(setSquare(origin.x + dir[d].x, origin.y + dir[d].y, 'floor,door-open', 'door', -1) || setSquare(origin.x + dir[d].x, origin.y + dir[d].y, 'floor,door', 'door-open', -1)) {
                    setMutation(origin.x + dir[d].x, origin.y + dir[d].y);
                }
                drawAll();
                tdDrawAll();
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
    var mut = getCookie('dungeonChanges');
    if(str === '') {
        origin = {f: (Math.floor(Math.random() * 100000) - 50000) * 2, x: (Math.floor(Math.random() * 100000) - 50000) * 2, y: (Math.floor(Math.random() * 100000) - 50000) * 2, d: Math.floor(Math.random() * 4)};
        setCookie('player-coordinates', 'F: ' + origin.f + ', X: ' + origin.x + ', Y: ' + origin.y + ', D: ' + origin.d, 365);
        setCookie('dungeonChanges', JSON.stringify(mutation), 365);
    } else {
        origin = parseCoordinates(str);
    }
}

function initField() {
    clearField(origin.x - Math.floor(mapSize / 2), origin.y - Math.floor(mapSize / 2), origin.x - Math.floor(mapSize / 2) + mapSize, origin.y - Math.floor(mapSize / 2) + mapSize);
    generateField(origin.x - Math.floor(mapSize / 2), origin.y - Math.floor(mapSize / 2), origin.x - Math.floor(mapSize / 2) + mapSize, origin.y - Math.floor(mapSize / 2) + mapSize);
}

function initPart(d) {
    switch(d) {
        case 0:
            var ra = [0, 0, mapSize, 2];
            map = deleteColumn(map, mapSize - 1);
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

function clearField(x1, y1, x2, y2) {
        if(typeof map === "undefined") {
            map = [];
        }
        for(var x = x1 - origin.x + mapSize / 2; x < x2 - origin.x + mapSize / 2; x++) {
            if(typeof map[x] === "undefined" || map[x] === null) {
                map[x] = [];
            }
            for(var y = y1 - origin.y + mapSize / 2; y < y2 - origin.y + mapSize / 2; y++) {
                if(typeof map[x][y] === "undefined" || map[x][y] === null) {
                    map[x][y] = { obj: 'wall', mesh: null, rotation: 0 };
                }
                setSquare(x + x1, y + y1, 'wall', null, 0, true);
            }
        }
}

function generateField(x1, y1, x2, y2) {
    for(var y = Math.floor(y1 / 2) * 2; y <= Math.floor(y2 / 2) * 2; y += 2) {
        for(var x = Math.floor(x1 / 2) * 2; x <= Math.floor(x2 / 2) * 2; x += 2) {
            generateFloor(x, y);
        }
    }
    for(var y = y1; y <= y2; y++) {
        for(var x = x1; x <= x2; x++) {
            generateDoor(x, y);
        }
    }
    for(var y = Math.floor(y1 / 2) * 2; y <= Math.floor(y2 / 2) * 2; y += 2) {
        for(var x = Math.floor(x1 / 2) * 2; x <= Math.floor(x2 / 2) * 2; x += 2) {
            generateStairs(x, y);
        }
    }
    for(var y = y1; y <= y2; y++) {
        for(var x = x1; x <= x2; x++) {
            generateDeco(x, y);
        }
    }
    for(var y = y1; y <= y2; y++) {
        for(var x = x1; x <= x2; x++) {
            var sq = getMutation(x, y);
            if(sq !== null) {
                if(getSquare(x, y) !== sq) {
                    setSquare(x, y, sq, null, -1, true);
                } else {
                    deleteMutation(x, y);
                }
            }
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
            setSquare(x1 - 1, y, 'floor,door', 'corridor', 1);
            setSquare(x1 - 1, y - 1, 'wall,protected');
            setSquare(x1 - 1, y + 1, 'wall,protected');
        }
        if(rand(origin.f, x1 + xs, y, 287.45, 3) < 1 && hasSquare(x1 + xs, y, 'corridor')) {
            setSquare(x1 + xs, y, 'floor,door', 'corridor', 1);
            setSquare(x1 + xs, y - 1, 'wall,protected');
            setSquare(x1 + xs, y + 1, 'wall,protected');
        }
    }
    for(var x = x1; x < x1 + xs; x++) {
        if(rand(origin.f, x, y1 - 1, 893.83, 3) < 1 && hasSquare(x, y1 - 1, 'corridor')) {
            setSquare(x, y1 - 1, 'floor,door', 'corridor', 0);
            setSquare(x - 1, y1 - 1, 'wall,protected');
            setSquare(x + 1, y1 - 1, 'wall,protected');
        }
        if(rand(origin.f, x, y1 + ys, 117.97, 3) < 1 && hasSquare(x, y1 + ys, 'corridor')) {
            setSquare(x, y1 + ys, 'floor,door', 'corridor', 0);
            setSquare(x - 1, y1 + ys, 'wall,protected');
            setSquare(x + 1, y1 + ys, 'wall,protected');
        }
    }*/
}

function generateFloor(x, y) {
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
    if(rand(origin.f, x + 1, y, 234.92, 10) === 0) {
        setSquare(x + 1, y, 'floor,pillar', 'wall');
    }
    if(rand(origin.f, x, y + 1, 321.11, 10) === 0) {
        setSquare(x, y + 1, 'floor,pillar', 'wall');
    }
    if(rand(origin.f, x + 1, y + 1, 477.47, 10) === 0) {
        setSquare(x + 1, y + 1, 'floor,pillar', 'wall');
    }
    if(rand(origin.f, x, y, 833.23, 100) === 0) {
        setSquare(x, y, 'floor,wall-secret', 'wall');
    }
    if(rand(origin.f, x, y + 1, 923.01, 100) === 0) {
        setSquare(x, y + 1, 'floor,wall-secret', 'wall');
    }
    if(rand(origin.f, x + 1, y, 13.40, 100) === 0) {
        setSquare(x + 1, y, 'floor,wall-secret', 'wall');
    }
    if(rand(origin.f, x, y, 94.09, 8) === 0) {
        generateRoom(x, y, rand(origin.f, x, y, 859.35, 3) * 2 + 1, rand(origin.f, x, y, 123.76, 3) * 2 + 1);
    }
}

function generateDoor(x, y) {
    if(Math.abs((x)) % 2 === 0 && Math.abs((y + 1)) % 2 === 0) {
        if(rand(origin.f, x, y, 388.92, 7) === 0) {
            if(rand(origin.f, x, y, 129.01, 2) === 0) {
                if(setSquare(x, y, 'floor,door', null, 0)) {
                    setSquare(x - 1, y, 'wall,protected', null, 0, true);
                    setSquare(x + 1, y, 'wall,protected', null, 0, true);
                    setSquare(x, y - 1, 'floor,protected');
                    setSquare(x, y + 1, 'floor,protected');
                }
            }
        }
    }
    if(Math.abs((x + 1)) % 2 === 0 && Math.abs((y)) % 2 === 0) {
        if(rand(origin.f, x, y, 388.92, 7) === 0) {
            if(rand(origin.f, x, y, 129.01, 2) === 1) {
                if(setSquare(x, y, 'floor,door', null, 1)) {
                    setSquare(x, y - 1, 'wall,protected', null, 0, true);
                    setSquare(x, y + 1, 'wall,protected', null, 0, true);
                    setSquare(x - 1, y, 'floor,protected');
                    setSquare(x + 1, y, 'floor,protected');
                }
            }
        }
    }
}

function generateStairs(x, y) {
    if(rand(origin.f - 1, x, y, 0, 40) >= 1 && rand(origin.f, x, y, 0, 40) < 1) {
        d = rand(origin.f, x, y, 0, 4);
        d1 = (d + 1) % 4;
        d2 = (d + 2) % 4;
        d3 = (d + 3) % 4;
        if(rand(origin.f, x, y, 0, 4) < 3) {
            if(setSquare(x, y, 'stairsup', null, d, true)) {
                setSquare(x + dir[d].x, y + dir[d].y, 'floor,protected');
                setSquare(x + dir[d1].x, y + dir[d1].y, 'wall,protected', null, 0, true);
                setSquare(x + dir[d2].x, y + dir[d2].y, 'wall,protected', null, 0, true);
                setSquare(x + dir[d3].x, y + dir[d3].y, 'wall,protected', null, 0, true);
            }
        } else {
            appendSquare(x, y, 'pit-ceil');
        }
    }
    if(rand(origin.f - 1, x, y, 0, 40) < 1) {
        d = (rand(origin.f - 1, x, y, 0, 4) + 2) % 4;
        d1 = (d + 1) % 4;
        d2 = (d + 2) % 4;
        d3 = (d + 3) % 4;
        if(rand(origin.f - 1, x, y, 0, 4) < 3) {
            if(setSquare(x, y, 'stairsdown', null, d2, true)) {
                setSquare(x + dir[d].x, y + dir[d].y, 'floor,protected');
                setSquare(x + dir[d1].x, y + dir[d1].y, 'wall,protected', null, 0, true);
                setSquare(x + dir[d2].x, y + dir[d2].y, 'wall,protected', null, 0, true);
                setSquare(x + dir[d3].x, y + dir[d3].y, 'wall,protected', null, 0, true);
            }
        } else {
            setSquare(x, y, 'floor,pit');
        }
    }
}

function generateDeco(x, y) {
    if(hasSquare(x, y, 'wall')) {
        if(rand(origin.f, x, y, 860.97, 3) === 0) {
            appendSquare(x, y, 'wall-deco', null, rand(origin.f, x, y, 123.13, 4));
        }
    } else if(hasSquare(x, y, 'floor')) {
        if(rand(origin.f, x, y, 860.97, 30) === 0) {
            appendSquare(x, y, 'floor-deco', null, rand(origin.f, x, y, 123.13, 4));
        }
    }
}

function getSquare(x, y) {
    if(x - origin.x + mapSize / 2 >= 0 && x - origin.x + mapSize / 2 < mapSize && y - origin.y + mapSize / 2 >= 0 && y - origin.y + mapSize / 2 < mapSize) {
        return map[x - origin.x + mapSize / 2][y - origin.y + mapSize / 2].obj;
    }
    return 'floor';
}

function hasSquare(x, y, obf) {
    var object = getSquare(x, y).split(',');
    if(object.indexOf(obf) > -1) {
        return true;
    }
    return false;
}

function setSquare(x, y, ob, a, d, force) {
    var success = false;
    if(x - origin.x + mapSize / 2 >= 0 && x - origin.x + mapSize / 2 < mapSize && y - origin.y + mapSize / 2 >= 0 && y - origin.y + mapSize / 2 < mapSize) {
        if((typeof force !== undefined && force) || !hasSquare(x, y, 'protected')) {
            var objectold = map[x - origin.x + mapSize / 2][y - origin.y + mapSize / 2].obj.split(',');
            var allowedOn = [];
            if(typeof a !== "undefined" && a !== null && a !== '') {
                var allowedOn = a.split(',');
            }
            for(var old = 0; old < objectold.length; old++) {
                if(map[x - origin.x + mapSize / 2][y - origin.y + mapSize / 2] === null || allowedOn.length === 0 || allowedOn.indexOf(objectold[old]) > -1) {
                    success = true;
                    map[x - origin.x + mapSize / 2][y - origin.y + mapSize / 2].obj = ob;
                    if(typeof d !== "undefined" && d !== null) {
                        if(d > -1) {
                            map[x - origin.x + mapSize / 2][y - origin.y + mapSize / 2].rotation = d;
                        }
                    } else {
                        map[x - origin.x + mapSize / 2][y - origin.y + mapSize / 2].rotation = 0;
                    }
                }
            }
        }
    }
    return success;
}
function appendSquare(x, y, ob, a, d, force) {
    var sq = getSquare(x, y);
    return setSquare(x, y, sq + ',' + ob, a, d, force);
}
function drawAll() {
    for(var y = 0; y < viewSize; y++) {
        for(var x = 0; x < viewSize; x++) {
            drawSquare(x + origin.x - viewSize / 2, y + origin.y - viewSize / 2);
        }
    }
    ctx.fillStyle = '#FFFF00';
    ctx.fillRect(viewSize / 2 * squareSize, viewSize / 2 * squareSize, squareSize, squareSize);
}

function drawSquare(x, y) {
    var ob = map[x - origin.x + mapSize / 2][y - origin.y + mapSize / 2].obj;
    var object = [];
    if(typeof ob !== "undefined" && ob !== null) {
        var object = ob.split(',');
    }
    for(o = 0; o < object.length; o++) {
        if(object[o] === 'floor') {
            drawRect(x, y, 0, 0, 0, 1, 1, 0, '#FFFFFF');
        //} else if(object[o] === 'corridor') {
        //	drawRect(x, y, 0, 0, 0, 1, 1, 0, '#EEEEFF');
        } else if(object[o] === 'wall') {
            drawRect(x, y, 0, 0, 0, 1, 1, 1, '#999999');
        } else if(object[o] === 'protected') {
            drawRect(x, y, 0.45, 0.45, 0, 0.1, 0.1, 1, '#BBBBBB');
        } else if(object[o] === 'wall-secret') {
            drawRect(x, y, 0, 0, 0, 1, 1, 1, '#AAAAAA');
        } else if(object[o] === 'stairsup') {
            drawRect(x, y, 0, 0, 0, 1, 1, 1, '#44FF44');
        } else if(object[o] === 'stairsdown') {
            drawRect(x, y, 0, 0, 0, 1, 1, 1, '#FF8888');
        } else if(object[o] === 'door') {
            drawRect(x, y, 0, 0.4, 0, 1, 0.2, 1, '#bb8866');
            drawRect(x, y, 0.4, 0, 0, 0.2, 1, 1, '#bb8866');
        } else if(object[o] === 'door-open') {
            drawRect(x, y, 0, 0.4, 0, 1, 0.2, 1, '#ffccaa');
            drawRect(x, y, 0.4, 0, 0, 0.2, 1, 1, '#ffccaa');
        } else if(object[o] === 'test') {
            drawRect(x, y, 0, 0, 0, 1, 1, 1, '#FF88FF');
        } else if(object[o] === 'pillar') {
            drawRect(x, y, 0.2, 0.2, 0, 0.6, 0.6, 1, '#999999');
        } else if(object[o] === 'pit') {
            drawRect(x, y, 0.2, 0.2, 0, 0.6, 0.6, 0.01, '#000000');
        } else if(object[o] === 'pit-ceil') {
            drawRect(x, y, 0.2, 0.2, 0, 0.6, 0.6, 0.01, '#EEEEEE');
        }
    }
}

//draw recttancle on square, based on a size of 1
function drawRect(x, y, x1, y1, z1, x2, y2, z2, c) {
    var xo = (x - origin.x + viewSize / 2);
    var yo = (y - origin.y + viewSize / 2);
    ctx.fillStyle = c;
    ctx.fillRect(xo * squareSize + x1 * squareSize, yo * squareSize + y1 * squareSize, x2 * squareSize, y2 * squareSize);
}

function floorAction(x, y) {
    if(hasSquare(x, y, 'stairsup')) {
        origin.f++; initField(); drawAll();
    } else if(hasSquare(x, y, 'stairsdown')) {
        origin.f--; initField(); drawAll();
    } else if(hasSquare(x, y, 'pit')) {
        origin.f--; initField(); drawAll(); floorAction(x, y);
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

var seedIndex = 1;
function seedRandom() {
    return random(seedIndex) * 857;
}
function random(s) {
    var x = Math.sin(s) * 10000;
    return x - Math.floor(x);
}
/*function rand(f, x, y, n, max) {
    var arg = Array.prototype.slice.call(arguments);
    var sum = (f * (1 + seedRandom())) + (x * (2 + seedRandom())) + (y * (3 + seedRandom())) + (n * (4 + seedRandom())) + (max * (5 + seedRandom()));
    return Math.floor(random(sum) * max);
}*/
function rand() {
    var arg = Array.prototype.slice.call(arguments);
    var s = arg[arg.length - 1];
    var sum = 0;
    for (var x = 0;x < arg.length;x++){
        sum = sum + arg[x] * (x + seedRandom());
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
        if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
    }
    return "";
}

function getMutation(x1, y1) {
//    if (typeof mutation == 'undefined'){
//        var mutation = {};
//    }
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
