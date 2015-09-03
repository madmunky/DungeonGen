var imagePath = '../images/';
var imageMax = 100;
var tdScreenWidth = 800;
var tdScreenHeight = 600;
var scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, 1, 18);
var camera = new THREE.PerspectiveCamera( 35, tdScreenWidth / tdScreenHeight, 0.5, 18 ); //1.5, 18
scene.add(camera);
mirrorCubeCamera = new THREE.CubeCamera( 0.1, 18, 512 );
scene.add( mirrorCubeCamera );
var renderer = new THREE.WebGLRenderer({ antialias: true});
renderer.setClearColor(0x000000, 1.0); 
renderer.shadowMapEnabled = true;
renderer.shadowMapType = THREE.PCFShadowMap;
renderer.setSize( tdScreenWidth, tdScreenHeight );
renderer.shadowMapType = THREE.PCFSoftShadowMap;

var aryImageLoader = [];

var ambientLight;
var light;
var plane, plane2;
var tdTexture = {
    'wall': [{
        image: 'wall',
        bump: true,
        multi: true
    }],
    'wallsecret': [{
        image: 'wall-s',
        transparent: true,
        bump: true
    }],
    'door': [{
        image: 'door',
        bump: true,
        transparent: true,
        multi: true
    }],
    'floor': [{
        image: 'floor',
        bump: true,
        multi: true
    }],
    'pit': [{
        color: '#000000',
        shadow: false
    }],
    'wall-deco': [{
        image: 'wall-deco',
        transparent: true,
        bump: false,
        shadow: false,
        multi: true
    }],
    'floor-deco': [{
        image: 'floor-deco',
        transparent: true,
        bump: false,
        shadow: false,
        multi: true
    }],
    'test': [{
        color: '#FF00FF',
        bump: false,
        shadow: false
    }]
};
tdCreateTextures();
tdCreateLight();
tdUpdateCamera();
//tdTexture['floor'][0].texture.repeat.x = viewSize * 1;
//tdTexture['floor'][0].texture.repeat.y = viewSize * 1;

//START OF STATS
var stats = new Stats();
stats.setMode(0); // 0: fps, 1: ms, 2: mb
// align top-left
stats.domElement.style.position = 'absolute';
stats.domElement.style.left = '0px';
stats.domElement.style.bottom = '0px';
document.body.appendChild( stats.domElement );
var update = function() {
    stats.begin();
    // monitored code goes here
    stats.end();
    requestAnimationFrame(update);
};
requestAnimationFrame(update);
//END OF STATS

function startEngine() {
    //plane = tdCreatePlane(0, -1);
    //plane2 = tdCreatePlane(1, 1);
    document.getElementById('view').appendChild( renderer.domElement );
    render();
}

function render() {
    TWEEN.update();
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}

function tdCreateTextures() {
    for (var ob in tdTexture) {
        var breaking = false;
        for(var j = 0; j < tdTexture[ob].length; j++) {
            var i = j;
            if(typeof tdTexture[ob][i].image !== "undefined" && tdTexture[ob][i].image !== null) {
                var img = tdTexture[ob][i].image;
                do {
                    if(typeof tdTexture[ob][j].multi !== "undefined" && tdTexture[ob][j].multi) {
                        if(tdTexture[ob].length <= i) {
                            tdTexture[ob][i] = {};
                        } 
                        tdTexture[ob][i].image = img + '-' + i;
                    }
                    if(fileExist(imagePath + tdTexture[ob][i].image + '.jpg')) {
                        var strName = tdTexture[ob][i].image;
                        aryImageLoader.push({Name: tdTexture[ob][i].image, Value: false});
                        tdTexture[ob][i].texture = new THREE.ImageUtils.loadTexture(imagePath + tdTexture[ob][i].image + '.jpg', {}, function(strName) { checkImageLoading(strName)});
                    } else if(fileExist(imagePath + tdTexture[ob][i].image + '.png')) {
                        var strName = tdTexture[ob][i].image;
                        aryImageLoader.push({Name: tdTexture[ob][i].image, Value: false});
                        tdTexture[ob][i].texture = new THREE.ImageUtils.loadTexture(imagePath + tdTexture[ob][i].image + '.png', {}, function(strName) { checkImageLoading(strName)});
                    } else {
                        tdTexture[ob].pop();
                        breaking = true;
                        break;
                    }
                    var trans = false;
                    if(typeof tdTexture[ob][j].transparent !== "undefined" || tdTexture[ob][j].transparent) {
                        trans = true;
                    }
                    var bump = null;
                    if(typeof tdTexture[ob][j].bump !== "undefined" || tdTexture[ob][j].bump) {
                        bump = tdTexture[ob][i].texture;
                    }
                    var refl = null;
                    if(typeof tdTexture[ob][j].reflection !== "undefined" || tdTexture[ob][j].reflection) {
                        refl = mirrorCubeCamera.renderTarget;
                    }               
                    tdTexture[ob][i].material = new THREE.MeshPhongMaterial( {map: tdTexture[ob][i].texture, transparent: trans, shininess: 10, side: THREE.SingleSide, bumpMap: bump, bumpScale: 0.05, envMap: refl} );
                    tdTexture[ob][i].texture.wrapT = THREE.RepeatWrapping;
                    tdTexture[ob][i].texture.wrapS = THREE.RepeatWrapping;
                    i++;
                } while(typeof tdTexture[ob][j].multi !== "undefined" && tdTexture[ob][j].multi);
            } else if(typeof tdTexture[ob][i].color !== "undefined" && tdTexture[ob][i].color !== null) {
                tdTexture[ob][i].material = new THREE.MeshLambertMaterial( {color: tdTexture[ob][i].color, side: THREE.SingleSide} );
            }
            if(breaking) {
                break;
            }
        }
    }
}

function checkImageLoading(strImageName){

    var filename = strImageName.sourceFile.split('\\').pop().split('/').pop();
    filename = filename.substring(0,filename.indexOf('.'))
    var boolFinished = true;

    for (x = 0; x < aryImageLoader.length;x++){
        if (aryImageLoader[x].Name == filename){
            aryImageLoader[x].Value = true;
        }
         if (aryImageLoader[x].Value == false){
             boolFinished = false;
         }
    }
    if (boolFinished){
        aryImageLoader = [];
        console.log("All Images Loaded, Its now safe to start the engine!");
        startEngine();
    }

}

function tdCreateLight() {
    ambientLight = new THREE.AmbientLight(0x404850); //404850
    light = new THREE.SpotLight(0xffeedd);
    light.intensity = 1.5;
    light.distance = 18;
    light.angle = Math.PI * 1.5;
    light.shadowDarkness = 0.5;
    light.castShadow = true;
    light.shadowCameraNear = true;
    light.shadowMapWidth = 1024;
    light.shadowMapHeight = 1024;

    scene.add(ambientLight);
    camera.add(light);

    renderer.shadowMapSoft = false;

    renderer.shadowCameraNear = 0.015;
    renderer.shadowCameraFar = 18;
    renderer.shadowCameraFov = 35;
}

function tdCreatePlane(y, r) {
    var g = new THREE.PlaneBufferGeometry( viewSize * 1.5, viewSize * 1.5,  viewSize * 1.5, viewSize * 1.5  );
    pl = new THREE.Mesh( g, tdTexture['floor'][0].material );
    pl.position.y = y;
    pl.rotation.x = r * (Math.PI / 2);
    pl.receiveShadow = true;
    scene.add( pl );
    return pl
}

function tdDrawAll() {
    //tdClearWorld();
    for(var x = 0; x < viewSize; x++) {
        for(var y = 0; y < viewSize; y++) {
            if(x - viewSize / 2 > -12 && x - viewSize / 2 < 12 && y - viewSize / 2 > -12 && y - viewSize / 2 < 12) {
                if(typeof map[x][y].mesh !== "undefined" && map[x][y].mesh !== null) {
                    tdClearObject(map[x][y].mesh);
                }
                map[x][y].mesh = tdCreateObject(x + origin.x - viewSize / 2, y + origin.y - viewSize / 2);
            }
        }
    }
}

function tdCreateObject(x, y) {
    var ob = getFloor(x, y).split(',');
    var msg = new THREE.Object3D();
    var seed = 0;
    msg.position.x = (x - origin.x) * 1.5;
    msg.position.y = 0;//(z1 + (z2 / 2)) * 1.0;
    msg.position.z = (y - origin.y) * 1.5;
    msg.rotation.y = (-(map[x - origin.x + viewSize / 2][y - origin.y + viewSize / 2].rotation + 2) * 90) * Math.PI / 180;

    /*g = new THREE.BoxGeometry( 0.02, 0.02, 0.02, 10 );
    pivot = new THREE.Mesh(g, tdTexture['test'][0].material);
    pivot.position.x = 0;
    pivot.position.y = 0;
    pivot.position.z = 0;
    msg.add(pivot);*/


    for(var o = 0; o < ob.length; o++) {
        var mat = '', type = '';
        var x1 = 0, y1 = 0, z1 = 0, x2 = 1, y2 = 1, z2 = 0;
        var rnd = 1;
        //if(ob[o] !== 'floor') {
            switch(ob[o].replace(/[0-9]/g, '')) {
                case 'wall': x1 = 0, y1 = 0, z1 = 0.001, x2 = 1, y2 = 1, z2 = 0.998; type = 'box'; mat = 'wall'; rnd = 100; break;
                case 'floor': x1 = 0, y1 = 0, z1 = 0, x2 = 1, y2 = 1, z2 = 1; type = 'floor-ceil'; mat = 'floor'; rnd = 100; break;
                case 'wallsecret': x1 = 0, y1 = 0, z1 = 0.001, x2 = 1, y2 = 1, z2 = 0.998; type = 'box'; mat = 'wallsecret'; break;
                case 'pillar': x1 = 0.3, y1 = 0.3, z1 = 0.001, x2 = 0.4, y2 = 0.4, z2 = 0.998; type = 'cylinder'; mat = 'wall'; rnd = 100; break;
                case 'door': x1 = 0, y1 = 0.45, z1 = 0.001, x2 = 1, y2 = 0.1, z2 = 0.998; type = 'door'; mat = 'door'; rnd = 100; break;
                case 'door-open': x1 = 0, y1 = 0.45, z1 = 0.001, x2 = 1, y2 = 0.1, z2 = 0.998; type = 'door-open'; mat = 'door'; rnd = 100; break;
                case 'pit': x1 = 0.2, y1 = 0.2, z1 = 0.001, x2 = 0.6, y2 = 0.6, z2 = 1; type = 'floor'; mat = 'pit'; break;
                case 'stairsup': x1 = 0, y1 = 0, z1 = 0.001, x2 = 1, y2 = 1, z2 = 0.998; type = 'stairs-up'; mat = 'wall'; rnd = 100; break;
                case 'stairsdown': x1 = 0, y1 = 0, z1 = -0.999, x2 = 1, y2 = 1, z2 = 0.998; type = 'stairs-down'; mat = 'wall'; rnd = 100; break;
                case 'wall-deco': x1 = 0, y1 = 0, z1 = 0, x2 = 1, y2 = 1.001, z2 = 1; type = 'wall-deco'; mat = 'wall-deco'; seed = 860.97; break;
                case 'floor-deco': x1 = 0, y1 = 0, z1 = 0.001, x2 = 1, y2 = 1, z2 = 1; type = 'floor'; mat = 'floor-deco'; seed = 860.97; break;
                default: break;
            }
            drawObject(msg, x, y, x1, y1, z1, x2, y2, z2, 0, type, mat, rnd, seed);
        //}
    }
    scene.add(msg);
    return msg;
}

function drawObject(msg, x, y, x1, y1, z1, x2, y2, z2, d, type, mat, rnd, seed) {
    var ms = null;
    var g = null;
    d1 = (d + 1) % 4;
    d2 = (d + 2) % 4;
    d3 = (d + 3) % 4;
    if(mat !== '' && type !== '') {
        switch(type) {
            case 'box':
            /*g = new THREE.BoxGeometry( x2, z2, y2, 1 );
            ms = new THREE.Mesh(g, tdTexture[mat][rand(Math.floor(origin.f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 129.22, tdTexture[mat].length)].material);
            ms.scale.set(1.5, 1.0, 1.5);
            ms.rotation.y = (-(d + 2) * 90) * Math.PI / 180;
            ms.position.x = (x1 + (x2 / 2)) * 1.5 - 0.75;
            ms.position.y = (z1 + (z2 / 2)) * 1.0;
            ms.position.z = (y1 + (y2 / 2)) * 1.5 - 0.75;
            msg.add(ms);*/
            ms1 = drawObject(msg, x, y, x1, y1, z1, x2, y2, z2, 0, 'wall-deco', mat, rnd, 129.22);
            ms1 = drawObject(msg, x, y, x1, y1, z1, x2, y2, z2, 1, 'wall-deco', mat, rnd, 129.22);
            ms1 = drawObject(msg, x, y, x1, y1, z1, x2, y2, z2, 2, 'wall-deco', mat, rnd, 129.22);
            ms1 = drawObject(msg, x, y, x1, y1, z1, x2, y2, z2, 3, 'wall-deco', mat, rnd, 129.22);
            break;

            case 'door':
            ms1 = drawObject(msg, x, y, x1 + x2 * 0.1, y1 + (y2 * 0.4), z1, x2 * 0.8, y2 * 0.2, z2, 0, 'box', mat, rnd, 356.11);
            ms1 = drawObject(msg, x, y, x1 + 0.9, y1, z1, x2, y2, z2, 0, 'box', 'wall', rnd, 129.22);
            ms1 = drawObject(msg, x, y, x1 - 0.9, y1, z1, x2, y2, z2, 0, 'box', 'wall', rnd, 129.22);
            break;

            case 'door-open':
            ms1 = drawObject(msg, x, y, x1 + x2 * 0.1, y1 + (y2 * 0.2), z1 + z2 * 0.8, x2 * 0.8, y2 * 0.6, z2, 0, 'box', mat, rnd, 356.11);
            ms1 = drawObject(msg, x, y, x1 + 0.9, y1, z1, x2, y2, z2, 0, 'box', 'wall', rnd, 129.22);
            ms1 = drawObject(msg, x, y, x1 - 0.9, y1, z1, x2, y2, z2, 0, 'box', 'wall', rnd, 129.22);
            break;

            case 'floor-ceil':
            ms1 = drawObject(msg, x, y, x1, y1, z1, x2, y2, z2, 0, 'floor', mat, rnd, 51.33);
            ms1 = drawObject(msg, x, y, x1, y1, z1, x2, y2, z2, 0, 'ceil', mat, rnd, 631.11);
            break;

            case 'stairs-up':
            ms1 = drawObject(msg, x, y, x1, y1, z1, x2, y2, z2, 0, 'stairs', mat, rnd, 129.22);
            ms1 = drawObject(msg, x, y, x1, y1, z1, x2, y2, z2, 0, 'floor', 'floor', rnd, 129.22);
            ms1 = drawObject(msg, x, y, x1 - 1, y1, z1 + 1, x2, y2, z2, 0, 'box', 'wall', rnd, 129.22);
            ms1 = drawObject(msg, x, y, x1 + 1, y1, z1 + 1, x2, y2, z2, 0, 'box', 'wall', rnd, 129.22);
            ms1 = drawObject(msg, x, y, x1, y1 + 1, z1 + 1, x2, y2, z2, 0, 'box', 'wall', rnd, 129.22);
            break;

            case 'stairs-down':
            ms1 = drawObject(msg, x, y, x1, y1, z1, x2, y2, z2, 0, 'stairs', mat, rnd, 129.22);
            ms1 = drawObject(msg, x, y, x1, y1, z1 + 1, x2, y2, z2, 0, 'ceil', 'floor', rnd, 129.22);
            ms1 = drawObject(msg, x, y, x1 - 1, y1, z1, x2, y2, z2, 0, 'box', 'wall', rnd, 129.22);
            ms1 = drawObject(msg, x, y, x1 + 1, y1, z1, x2, y2, z2, 0, 'box', 'wall', rnd, 129.22);
            break;
            
            case 'wall-deco':
            var g = new THREE.PlaneBufferGeometry(x2, y2, 1, 1);
            ms = new THREE.Mesh(g, tdTexture[mat][rand(Math.floor(origin.f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), seed, tdTexture[mat].length)].material);
            ms.scale.set(1.5, 1.0, 1.0);
            ms.position.set((z1 + (x2 / 2)) * 1.5 - 0.75, (z1 + (z2 / 2)) * 1.0, (y1 + (y2 / 2)) * 1.5 - 0.75);//(0, 0.5, 0);
            ms.rotation.y = (-(d + 2) * 90) * Math.PI / 180;
            ms.translateZ(y2 * 0.75);
            msg.add(ms);
            break;

            case 'floor':
            var g = new THREE.PlaneBufferGeometry(x2, y2, 1, 1);
            ms = new THREE.Mesh(g, tdTexture[mat][rand(Math.floor(origin.f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), seed, tdTexture[mat].length)].material);
            ms.scale.set(1.5, 1.5, 1.0);
            ms.position.set((x1 + (x2 / 2)) * 1.5 - 0.75, (z1 + (z2 / 2)) * 1.0 - 0.5, (y1 + (y2 / 2)) * 1.5 - 0.75);
            ms.rotation.y = (-(d + 2) * 90) * Math.PI / 180;
            ms.rotateX(-Math.PI / 2);
            msg.add(ms);
            break;

            case 'ceil':
            var g = new THREE.PlaneBufferGeometry(x2, y2, 1, 1);
            ms = new THREE.Mesh(g, tdTexture[mat][rand(Math.floor(origin.f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), seed, tdTexture[mat].length)].material);
            ms.scale.set(1.5, 1.5, 1.0);
            ms.position.set((x1 + (x2 / 2)) * 1.5 - 0.75, (z1 + (z2 / 2)) * 1.0 + 0.5, (y1 + (y2 / 2)) * 1.5 - 0.75);
            ms.rotation.y = (-(d + 2) * 90) * Math.PI / 180;
            ms.rotateX(-3.0 * Math.PI / 2);
            msg.add(ms);
            break;

            case 'stairs':
            var g = new THREE.PlaneBufferGeometry(x2, y2, 1, 1);
            ms = new THREE.Mesh(g, tdTexture[mat][rand(Math.floor(origin.f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), seed, tdTexture[mat].length)].material);
            ms.scale.set(1.5, 1.8027, 1.0);
            ms.position.set((x1 + (x2 / 2)) * 1.5 - 0.75, (z1 + (z2 / 2)) * 1.0, (y1 + (y2 / 2)) * 1.5 - 0.75);
            ms.rotation.y = (-(d + 2) * 90) * Math.PI / 180;
            ms.rotateX(-123.39 * Math.PI / 180);
            msg.add(ms);
            break;

            case 'cylinder':
            g = new THREE.CylinderGeometry(x2 * 0.5, y2 * 0.5, z2, 16);
            ms = new THREE.Mesh(g, tdTexture[mat][rand(Math.floor(origin.f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), seed, tdTexture[mat].length)].material);
            ms.scale.set(1.5, 1.0, 1.5);
            ms.position.set((x1 + (x2 / 2)) * 1.5 - 0.75, (z1 + (z2 / 2)) * 1.0, (y1 + (y2 / 2)) * 1.5 - 0.75);
            //ms.rotation.y = (-(d + 2) * 90) * Math.PI / 180;
            msg.add(ms);
            break;
        }
        if(ms !== null) {
            if(typeof tdTexture[mat][0].shadow === "undefined" || tdTexture[mat][0].shadow) {
                ms.castShadow = true;
            }
            ms.receiveShadow = true;
            return ms;
        }
    }
    return null;
}

function tdMoveCamera(xo, yo) {
    if(hasFloor(origin.x + xo, origin.y + yo, 'wallsecret') || (!hasFloor(origin.x + xo, origin.y + yo, 'wall') && !hasFloor(origin.x + xo, origin.y + yo, 'wall2') && !hasFloor(origin.x + xo, origin.y + yo, 'pillar') && !hasFloor(origin.x + xo, origin.y + yo, 'door'))) {
        keysFrozen = true;
        origin.x = origin.x + xo;
        origin.y = origin.y + yo;
        //light.position.x = 0;
        //light.position.z = 0;
        //light.translateZ(1.45);
        initField();
        new TWEEN.Tween( {x: origin.x - xo, y: origin.y - yo} )
            .to( {x: origin.x, y: origin.y}, 400)
            .easing(TWEEN.Easing.Sinusoidal.InOut)
            .onUpdate(function() {
                camera.position.x = (this.x - origin.x + xo) * 1.5;
                camera.position.z = (this.y - origin.y + yo) * 1.5;
                camera.translateZ(1.25);
                
                //light.position.x = 0;
                //light.position.y = -0.5;
                //light.position.z = 0;
                //light.translateZ(0.3);
            })
            .onComplete(function() {
                keysFrozen = false;
                floorAction(origin.x, origin.y);
                tdDrawAll();
                tdUpdateCamera();
            })
            .start();
    }
}

function tdRotateCamera(d) {
    //origin.d = d;
    //tdUpdateCamera();

    keysFrozen = true;
    var do1 = -Math.PI / 2 * origin.d;
    var d1 = -Math.PI / 2 * d;
    origin.d = (origin.d + d + 4) % 4;
    new TWEEN.Tween( {d: do1} )
        .to( {d: do1 + d1}, 400)
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .onUpdate(function() {
            camera.position.x = 0;
            camera.position.z = 0;
            camera.rotation.y = this.d;
            camera.translateZ(1.25);

            //light.position.x = 0;
            //light.position.z = 0;
            //light.rotation.y = this.d;
            //light.translateZ(0.3);
        })
        .onComplete(function() {
            keysFrozen = false;
            tdUpdateCamera();
        })
        .start();
}

function tdClearObject(obj) {
    if (obj !== ambientLight && obj !== light && obj !== plane && obj !== plane2 && obj !== camera && obj !== mirrorCubeCamera) {
        if (obj.children !== undefined) {
            for (var c = obj.children.length - 1; c >= 0; c--) {
                if(typeof obj.children[c].geometry !== "undefined") {
                    obj.children[c].geometry.dispose();
                }
                obj.remove(obj.children[c]);
            }
        }
        if(typeof obj.geometry !== "undefined") {
            obj.geometry.dispose();
        }
        scene.remove(obj);
    }
}

function tdClearWorld() {
    var obj, i;
    for (i = scene.children.length - 1; i >= 0 ; i--) {
        obj = scene.children[i];
        tdClearObject(obj);
    }
}

function tdUpdateCamera() {
    camera.position.x = 0;
    camera.position.z = 0;
    camera.rotation.y = -Math.PI / 2 * origin.d;
    camera.position.y = 0.5;
    camera.translateZ(1.25);

    light.position.x = 0;
    light.position.y = -0.5;
    light.position.z = 0;
    //light.rotation.y = -Math.PI / 2 * origin.d;
    light.translateZ(0.3);

    $('body input#coordinates').val('F: ' + origin.f + ', X: ' + origin.x + ', Y: ' + origin.y + ', D: ' + origin.d);
}

function fileExist(urlToFile) {
    var xhr = new XMLHttpRequest();
    xhr.open('HEAD', urlToFile, false);
    xhr.send();
     
    if (xhr.status == "404") {
        return false;
    } else {
        return true;
    }
}