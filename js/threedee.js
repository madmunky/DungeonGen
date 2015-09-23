var timer = 0;
var imagePath = '../images/';
var imageMax = 100;
var tdScreenWidth = 800;
var tdScreenHeight = 600;
var scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, 1, tdViewSize);
var vertexShader = document.getElementById( 'vertexShaderDepth' ).textContent;
var fragmentShader = document.getElementById( 'fragmentShaderDepth' ).textContent;
var camera = new THREE.PerspectiveCamera( 35, tdScreenWidth / tdScreenHeight, 1, tdViewSize ); //1.5, 18
scene.add(camera);

var renderer = new THREE.WebGLRenderer({ antialias: true});
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setClearColor(0x000000, 1.0);
renderer.gammaInput = true;
renderer.gammaOutput = true;
renderer.setSize( tdScreenWidth, tdScreenHeight );
renderer.shadowMapEnabled = true;
renderer.shadowMapType = THREE.PCFSoftShadowMap;
renderer.shadowMapSoft = true;
renderer.shadowCameraNear = 1;
renderer.shadowCameraFar = tdViewSize;
renderer.shadowCameraFov = 35;

var cubeMapPath = imagePath + 'cubemap/';
var cubeMapUrls = [
    cubeMapPath + '1.jpg', cubeMapPath + '2.jpg',
    cubeMapPath + '3.jpg', cubeMapPath + '4.jpg',
    cubeMapPath + '5.jpg', cubeMapPath + '6.jpg'
];
var reflectionCube = THREE.ImageUtils.loadTextureCube(cubeMapUrls);
reflectionCube.format = THREE.RGBFormat;

var aryImageLoader = [];

var ambientLight;
var light;
var plane, plane2;
var tdTexture = {};
var tdGeometry = [];
var tdMaterial = {
    'wall': {
        image: 'wall',
        bump: true,
        normal: true,
        specular: true
    },
    'wall-x20': {
        image: 'wall',
        bump: true,
        normal: true,
        specular: true,
        scale: {x: 2, y: 1}
    },
    'wall-secret': {
        image: 'wall-secret',
        transparent: true,
        bump: true,
        opacity: 0.5
    },
    'wall-wood': {
        image: 'wall-wood',
        bump: true,
        normal: true,
        specular: true
    },
    'wall-wood-x05': {
        image: 'wall-wood',
        bump: true,
        normal: true,
        specular: true,
        scale: {x: 0.5, y: 1}
    },
    'wall-wood-x025': {
        image: 'wall-wood',
        bump: true,
        normal: true,
        specular: true,
        scale: {x: 0.25, y: 1}
    },
    'wall-wood-x05-y025': {
        image: 'wall-wood',
        bump: true,
        normal: true,
        specular: true,
        scale: {x: 0.5, y: 0.25}
    },
    'door': {
        image: 'door',
        bump: true,
        transparent: true
    },
    'floor': {
        image: 'floor',
        bump: true,
        normal: true,
        specular: true,
        shadow: false
    },
    'pit': {
        color: '#000000',
        shadow: false
    },
    'teleport': {
        image: 'teleport',
        shadow: false,
        transparent: true,
        opacity: 0.5,
        blend: THREE.AdditiveBlending,
        animate: 'random,10'
    },
    'wall-switch': {
        image: 'wall-switch',
        transparent: true,
        shadow: false
    },
    'wall-deco': {
        image: 'wall-deco',
        transparent: true,
        bump: true,
        shadow: false
    },
    'floor-deco': {
        image: 'floor-deco',
        transparent: true,
        bump: false,
        shadow: false
    },
    'test': {
        color: '#FF00FF',
        bump: false,
        shadow: false
    }
};
tdCreateMaterials();
tdCreateLight();
tdUpdateCamera();

var stats = new Stats();
stats.setMode(0); // 0: fps, 1: ms, 2: mb
stats.domElement.style.position = 'absolute';
stats.domElement.style.left = '0px';
stats.domElement.style.bottom = '0px';
document.body.appendChild(stats.domElement);

function startEngine() {
    document.getElementById('view').appendChild(renderer.domElement);
    tdDrawAll();
    animate();
}
function animate() {
    requestAnimationFrame(animate);
    render();
    stats.update();
}
function render() {
    for (var ob in tdMaterial) {
        if(typeof tdMaterial[ob].animate !== 'undefined' && tdMaterial[ob].animate.split(',')[0] === 'random') {
            var at = parseInt(tdMaterial[ob].animate.split(',')[1]);
            if(timer % (60 / at) === 0) {
                var tex = ob;
                if(typeof tdTexture[tex] !== "undefined") {
                    for(var i = 0; i < tdTexture[tex].length; i++) {
                        tdTexture[tex][i].offset.x = Math.random();
                        tdTexture[tex][i].offset.y = Math.random();
                    }
                }
            }
        }
    }
    timer++;
    $('#debug').html('Camera: X ' + camera.position.x.toFixed(2) + ', Y ' + camera.position.y.toFixed(2) + ', Z ' + camera.position.z.toFixed(2) + ', RX ' + camera.rotation.x.toFixed(2) + ', RY ' + camera.rotation.y.toFixed(2) + ', RZ ' + camera.rotation.z.toFixed(2) + '<br>');
    $('#debug').append('Light: X ' + light.position.x.toFixed(2) + ', Y ' + light.position.y.toFixed(2) + ', Z ' + light.position.z.toFixed(2) + ', RX ' + light.rotation.x.toFixed(2) + ', RY ' + light.rotation.y.toFixed(2) + ', RZ ' + light.rotation.z.toFixed(2));
    TWEEN.update();
    renderer.render(scene, camera);
}

function tdCreateMaterials() {
    var img = null;
    for (var ob in tdMaterial) {
        var i = 0;
        var tex = ob;
        tdMaterial[ob].material = [];
        if(typeof tdMaterial[ob].image !== "undefined" && tdMaterial[ob].image !== '') {
            if(typeof tdTexture[tex] === "undefined") {
                tdTexture[tex] = [];
            }
            while(true) {
                if(typeof tdTexture[tex][i] === "undefined") {
                    img = tdMaterial[ob].image + '-' + i;
                    if(fileExist(imagePath + img + '.jpg')) {
                        aryImageLoader.push({Name: img, Value: false});
                        tdTexture[tex][i] = new THREE.ImageUtils.loadTexture(imagePath + img + '.jpg', {}, function(img) {checkImageLoading(img)});
                    } else if(fileExist(imagePath + img + '.png')) {
                        aryImageLoader.push({Name: img, Value: false});
                        tdTexture[tex][i] = new THREE.ImageUtils.loadTexture(imagePath + img + '.png', {}, function(img) {checkImageLoading(img)});
                    } else {
                        break;
                    }
                    if(typeof tdMaterial[ob].scale !== "undefined") {
                        tdTexture[tex][i].repeat.set(tdMaterial[ob].scale.x, tdMaterial[ob].scale.y);
                    }
                }
                var trans = false;
                if(typeof tdMaterial[ob].transparent !== "undefined" && tdMaterial[ob].transparent) {
                    trans = true;
                }
                var shine = 1;
                var norm = null;
                if(typeof tdMaterial[ob].normal !== "undefined" && tdMaterial[ob].normal) {
                    if(typeof tdTexture['norm-' + tdMaterial[ob].image] === 'undefined') {
                        tdTexture['norm-' + tdMaterial[ob].image] = [];
                    }
                    if(typeof tdTexture['norm-' + tdMaterial[ob].image][i] === 'undefined') {
                        var img = imagePath + 'norm/' + tdMaterial[ob].image + '-' + i;
                        if(fileExist(img + '.jpg')) {
                            tdTexture['norm-' + tdMaterial[ob].image][i] = new THREE.ImageUtils.loadTexture(img + '.jpg', {}, function(img) {checkImageLoading(img)});
                            norm = tdTexture['norm-' + tdMaterial[ob].image][i];
                            shine = 20;
                        } else if(fileExist(img + '.png')) {
                            tdTexture['norm-' + tdMaterial[ob].image][i] = new THREE.ImageUtils.loadTexture(img + '.png', {}, function(img) {checkImageLoading(img)});
                            norm = tdTexture['norm-' + tdMaterial[ob].image][i];
                            shine = 20;
                        }
                    }
                }
                var bump = null;
                if(norm === null && typeof tdMaterial[ob].bump !== "undefined" && tdMaterial[ob].bump) {
                    bump = tdTexture[tex][i];
                    if(typeof tdTexture['bump-' + tdMaterial[ob].image] === 'undefined') {
                        tdTexture['bump-' + tdMaterial[ob].image] = [];
                    }
                    if(typeof tdTexture['bump-' + tdMaterial[ob].image][i] === 'undefined') {
                        var img = imagePath + 'bump/' + tdMaterial[ob].image + '-' + i;
                        if(fileExist(img + '.jpg')) {
                            tdTexture['bump-' + tdMaterial[ob].image][i] = new THREE.ImageUtils.loadTexture(img + '.jpg', {}, function(img) {checkImageLoading(img)});
                            bump = tdTexture['bump-' + tdMaterial[ob].image][i];
                            shine = 20;
                        } else if(fileExist(img + '.png')) {
                            tdTexture['bump-' + tdMaterial[ob].image][i] = new THREE.ImageUtils.loadTexture(img + '.png', {}, function(img) {checkImageLoading(img)});
                            bump = tdTexture['bump-' + tdMaterial[ob].image][i];
                            shine = 20;
                        }
                    }
                }
                var spec = null;
                var specC = 0x000000;
                if(typeof tdMaterial[ob].specular !== "undefined" && tdMaterial[ob].specular) {
                    if(typeof tdTexture['spec-' + tdMaterial[ob].image] === 'undefined') {
                        tdTexture['spec-' + tdMaterial[ob].image] = [];
                    }
                    if(typeof tdTexture['spec-' + tdMaterial[ob].image][i] === 'undefined') {
                        var img = imagePath + 'spec/' + tdMaterial[ob].image + '-' + i;
                        if(fileExist(img + '.jpg')) {
                            tdTexture['spec-' + tdMaterial[ob].image][i] = new THREE.ImageUtils.loadTexture(img + '.jpg', {}, function(img) {checkImageLoading(img)});
                            spec = tdTexture['spec-' + tdMaterial[ob].image][i];
                            specC = 0x444444;
                            shine = 20;
                        } else if(fileExist(img + '.png')) {
                            tdTexture['spec-' + tdMaterial[ob].image][i] = new THREE.ImageUtils.loadTexture(img + '.png', {}, function(img) {checkImageLoading(img)});
                            spec = tdTexture['spec-' + tdMaterial[ob].image][i];
                            specC = 0x444444;
                            shine = 20;
                        }
                    }
                }
                var refl = null;
                if(typeof tdMaterial[ob].reflection !== "undefined" && tdMaterial[ob].reflection) {
                    refl = reflectionCube;
                }
                var opac = 1.0;
                if(typeof tdMaterial[ob].opacity !== "undefined" && tdMaterial[ob].opacity) {
                    opac = tdMaterial[ob].opacity;
                }
                var blend = THREE.NormalBlending;
                if(typeof tdMaterial[ob].blending !== "undefined") {
                    blend = tdMaterial[ob].blending;
                }
                var parameters = {
                    map: tdTexture[tex][i],
                    bumpMap: bump,
                    bumpScale: 0.04,
                    normalMap: norm,
                    specularMap: spec,
                    specular: specC,
                    shininess: shine,
                    blending: blend,
                    transparent: trans,
                    opacity: opac,
                    side: THREE.FrontSide,
                    envMap: refl
                };
                tdTexture[tex][i].wrapT = tdTexture[tex][i].wrapS = THREE.RepeatWrapping;
                tdTexture[tex][i].anisotropy = 16;
                tdMaterial[ob].material[i] = new THREE.MeshPhongMaterial(parameters);
                i++;
            }
        } else if(typeof tdMaterial[ob].color !== "undefined" && tdMaterial[ob].color !== null) {
            tdMaterial[ob].material[i] = new THREE.MeshLambertMaterial( {color: tdMaterial[ob].color, side: THREE.FrontSide} );
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
    light.intensity = 3;
    light.distance = tdViewSize;
    light.angle = 90 * Math.PI / 180;
    light.shadowDarkness = 0.5;
    light.castShadow = true;
    light.shadowCameraNear = true;
    light.shadowMapWidth = 1024;
    light.shadowMapHeight = 1024;

    light.target = camera;

    scene.add(ambientLight);
    camera.add(light);
}

function tdDrawAll() {
    tdClearWorld();
    for(var x = -Math.floor(tdViewSize / 2) - 1; x <= Math.floor(tdViewSize / 2) + 1; x++) {
        for(var y = -Math.floor(tdViewSize / 2) - 1; y <= Math.floor(tdViewSize / 2) + 1; y++) {
            if(Math.floor(mapSize / 2) + x >= 0 && Math.floor(mapSize / 2) + x / 2 < mapSize && Math.floor(mapSize / 2) + y >= 0 && Math.floor(mapSize / 2) + y < mapSize) {
                map[Math.floor(mapSize / 2) + x][Math.floor(mapSize / 2) + y].mesh = tdCreateObject(x, y);
            }
        }
    }
}

function tdDeletePart(x1, y1, x2, y2) {
    for(var x = x1; x < x2; x++) {
        for(var y = y1; y < y2; y++) {
            tdClearObject(map[x][y]);
        }
    }
}

function tdCreateObject(x, y) {
    var xo = x + origin.x;
    var yo = y + origin.y;
    var ob = getSquare(xo, yo).split(',');
    var ms = null;
    var msg = new THREE.Object3D();
    var seed = 0;
    msg.position.x = (x + origin.x % 150) * 1.5;
    msg.position.y = 0;
    msg.position.z = (y + origin.y % 150) * 1.5;

    for(var o = 0; o < ob.length; o++) {
        var mat = '', type = '';
        var x1 = 0, y1 = 0, z1 = 0, x2 = 1, y2 = 1, z2 = 0;
        var rnd = 1;
        switch(ob[o].replace(/[0-9]/g, '')) {
            case 'wall': x1 = 0, y1 = 0, z1 = 0, x2 = 1, y2 = 1, z2 = 1; type = 'wall'; mat = 'wall'; rnd = 100; seed = 129.22; break;
            case 'wall-wood': x1 = 0, y1 = 0.99, z1 = 0, x2 = 1, y2 = 0.02, z2 = 1; type = 'wall-wood'; mat = 'wall-wood'; rnd = 100; seed = 444.01; break;
            case 'door-wood': x1 = 0, y1 = 0.99, z1 = 0, x2 = 1, y2 = 0.02, z2 = 1; type = 'door-wood'; mat = 'wall-wood-x05'; rnd = 100; seed = 444.01; break;
            case 'door-wood-open': x1 = 0, y1 = 0.99, z1 = 0, x2 = 1, y2 = 0.02, z2 = 1; type = 'door-wood-open'; mat = 'wall-wood-x05'; rnd = 100; seed = 444.01; break;
            case 'floor': x1 = 0, y1 = 0, z1 = 0, x2 = 1, y2 = 1, z2 = 1; type = 'floor-ceil'; mat = 'floor'; rnd = 100; break;
            case 'wall-secret': x1 = 0, y1 = 0, z1 = 0, x2 = 1, y2 = 1, z2 = 1; type = 'wall-secret'; mat = 'wall-secret'; rnd = 100; break;
            case 'pillar': x1 = 0.35, y1 = 0.35, z1 = 0, x2 = 0.3, y2 = 0.3, z2 = 1; type = 'pillar'; mat = 'wall'; rnd = 100; seed = 129.22; break;
            case 'door': x1 = 0, y1 = 0.45, z1 = 0, x2 = 1, y2 = 0.1, z2 = 1; type = 'door'; mat = 'door'; rnd = 100; break;
            case 'door-open': x1 = 0, y1 = 0.45, z1 = 0, x2 = 1, y2 = 0.1, z2 = 1; type = 'door-open'; mat = 'door'; rnd = 100; break;
            case 'teleport': x1 = 0, y1 = 0, z1 = 0, x2 = 1, y2 = 1, z2 = 1; type = 'box4'; mat = 'teleport'; rnd = 100; seed = 51.33; break;
            case 'pit': x1 = 0.2, y1 = 0.2, z1 = 0.001, x2 = 0.6, y2 = 0.6, z2 = 1; type = 'floor-deco'; mat = 'pit'; break;
            case 'pit-ceil': x1 = 0.2, y1 = 0.2, z1 = -0.001, x2 = 0.6, y2 = 0.6, z2 = 1; type = 'ceil-deco'; mat = 'pit'; break;
            case 'stairsup': x1 = 0, y1 = 0, z1 = 0, x2 = 1, y2 = 1, z2 = 1; type = 'stairs-up'; mat = 'wall'; rnd = 100; break;
            case 'stairsdown': x1 = 0, y1 = 0, z1 = -1, x2 = 1, y2 = 1, z2 = 1; type = 'stairs-down'; mat = 'wall'; rnd = 100; break;
            case 'wall-switch': x1 = 0, y1 = 1.001, z1 = 0, x2 = 1, y2 = 1, z2 = 1; type = 'wall-deco'; mat = 'wall-switch'; seed = 123.43; break;
            case 'wall-deco': x1 = 0, y1 = 1.001, z1 = 0, x2 = 1, y2 = 1, z2 = 1; type = 'wall-deco'; mat = 'wall-deco'; seed = 860.97; break;
            case 'floor-deco': x1 = 0, y1 = 0, z1 = 0.001, x2 = 1, y2 = 1, z2 = 1; type = 'floor-deco'; mat = 'floor-deco'; break;
            default: break;
        }
        var d = parseInt(getSquareDirections(xo, yo).substring(o, o + 1));
        ms = drawObject(type, msg, origin.f, xo, yo, x1, y1, z1, x2, y2, z2, d, type, mat, rnd, seed);
        if(ms !== null) {
            tdRotateInWorld('y', ms, (-(d + 2) * 90) * Math.PI / 180);
        }
    }
    scene.add(msg);
    return msg;
}

function drawObject(type, msg, f, x, y, x1, y1, z1, x2, y2, z2, d, metatype, mat, rnd, seed) {
    var m = null;
    var ms = null;
    var g = null;
    var d1 = (d + 1) % 4;
    var d2 = (d + 2) % 4;
    var d3 = (d + 3) % 4;
    var geotype = type + '-' + x2 + '-' + y2 + '-' + z2;
    if(mat !== '' && metatype !== '') {
        switch(metatype) {
            case 'box':
            m = tdMaterial[mat].material[rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), seed, tdMaterial[mat].material.length)];
            ms = new THREE.Mesh(tdGeometry[geotype], m);
            ms.scale.set(1.5, 1.0, 1.5);
            ms.rotation.y = (-(d + 2) * 90) * Math.PI / 180;
            ms.position.x = (x1 + (x2 / 2)) * 1.5 - 0.75;
            ms.position.y = (z1 + (z2 / 2)) * 1.0;
            ms.position.z = (y1 + (y2 / 2)) * 1.5 - 0.75;
            if(typeof tdGeometry[geotype] === "undefined" || tdGeometry[geotype] === null) {
                tdGeometry[geotype] = new THREE.BoxGeometry(x2, z2, y2, 1, 1);
                if(type === 'box4') {
                    tdGeometry[geotype].faces.splice(4, 4); //remove top and bottom
                }
            }
            msg.add(ms);
            break;

            case 'floor':
            m = tdMaterial[mat].material[rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor((x + rnd / 2) / rnd), Math.floor((y + rnd / 2) / rnd), seed, tdMaterial[mat].material.length)]
            if(typeof tdGeometry[geotype] === "undefined" || tdGeometry[geotype] === null) {
                tdGeometry[geotype] = new THREE.PlaneBufferGeometry(x2, y2, 1, 1);
            }
            ms = new THREE.Mesh(tdGeometry[geotype], m);
            ms.scale.set(1.5, 1.5, 1.0);
            ms.position.set((x1 + (x2 / 2)) * 1.5 - 0.75, (z1 + (z2 / 2)) * 1.0 - 0.5, (y1 + (y2 / 2)) * 1.5 - 0.75);
            ms.rotation.y = (-(d + 2) * 90) * Math.PI / 180;
            ms.rotateX(-Math.PI / 2);
            msg.add(ms);
            break;

            case 'ceil':
            m = tdMaterial[mat].material[rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor((x + rnd / 2) / rnd), Math.floor((y + rnd / 2) / rnd), seed, tdMaterial[mat].material.length)];
            if(typeof tdGeometry[geotype] === "undefined" || tdGeometry[geotype] === null) {
                tdGeometry[geotype] = new THREE.PlaneBufferGeometry(x2, y2, 1, 1);
            }
            ms = new THREE.Mesh(tdGeometry[geotype], m);
            ms.scale.set(1.5, 1.5, 1.0);
            ms.position.set((x1 + (x2 / 2)) * 1.5 - 0.75, (z1 + (z2 / 2)) * 1.0 + 0.5, (y1 + (y2 / 2)) * 1.5 - 0.75);
            ms.rotation.y = (-(d + 2) * 90) * Math.PI / 180;
            ms.rotateX(-3.0 * Math.PI / 2);
            msg.add(ms);
            break;
            
            case 'wall-deco':
            m = tdMaterial[mat].material[rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), seed, tdMaterial[mat].material.length)];
            if(typeof tdGeometry[geotype] === "undefined" || tdGeometry[geotype] === null) {
                tdGeometry[geotype] = new THREE.PlaneBufferGeometry(x2, y2, 1, 1);
            }
            ms = new THREE.Mesh(tdGeometry[geotype], m);
            ms.scale.set(1.5, 1.0, 1.0);
            ms.position.set((x1 + (x2 / 2)) * 1.5 - 0.75, (z1 + (z2 / 2)) * 1.0, 0);//(0, 0.5, 0);
            ms.rotation.y = (-(d + 2) * 90) * Math.PI / 180;
            ms.translateZ(y1 * 0.75);
            msg.add(ms);
            break;

            case 'cylinder':
            m = tdMaterial[mat].material[rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), seed, tdMaterial[mat].material.length)];
            if(typeof tdGeometry[geotype] === "undefined" || tdGeometry[geotype] === null) {
                tdGeometry[geotype] = new THREE.CylinderGeometry(x2 * 0.5, y2 * 0.5, z2, 16);
            }
            ms = new THREE.Mesh(tdGeometry[geotype], m);
            ms.scale.set(1.5, 1.0, 1.5);
            ms.position.set((x1 + (x2 / 2)) * 1.5 - 0.75, (z1 + (z2 / 2)) * 1.0, (y1 + (y2 / 2)) * 1.5 - 0.75);
            ms.rotation.y = rand(f, x, y, 191.09, 360) * Math.PI / 180;
            msg.add(ms);
            break;

            case 'cylinder-rx':
            m = tdMaterial[mat].material[rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), seed, tdMaterial[mat].material.length)];
            if(typeof tdGeometry[geotype] === "undefined" || tdGeometry[geotype] === null) {
                tdGeometry[geotype] = new THREE.CylinderGeometry(x2 * 0.5, y2 * 0.5, z2, 16);
            }
            ms = new THREE.Mesh(tdGeometry[geotype], m);
            ms.scale.set(1.5, 1.0, 1.5);
            ms.position.set((x1 + (x2 / 2)) * 1.5 - 0.75, (z1 + (z2 / 2)) * 1.0, (y1 + (y2 / 2)) * 1.5 - 0.75);
            ms.rotation.x = 90 * Math.PI / 180;
            ms.rotation.y = rand(f, x, y, 191.09, 360) * Math.PI / 180;
            msg.add(ms);
            break;

            case 'cylinder-rz':
            m = tdMaterial[mat].material[rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), seed, tdMaterial[mat].material.length)];
            if(typeof tdGeometry[geotype] === "undefined" || tdGeometry[geotype] === null) {
                tdGeometry[geotype] = new THREE.CylinderGeometry(x2 * 0.5, y2 * 0.5, z2, 16);
            }
            ms = new THREE.Mesh(tdGeometry[geotype], m);
            ms.scale.set(1.5, 1.0, 1.5);
            ms.position.set((x1 + (x2 / 2)) * 1.5 - 0.75, (z1 + (z2 / 2)) * 1.0, (y1 + (y2 / 2)) * 1.5 - 0.75);
            ms.rotation.z = 90 * Math.PI / 180;
            ms.rotation.x = rand(f, x, y, 191.09, 360) * Math.PI / 180;
            msg.add(ms);
            break;



            case 'wall':
            var ms = new THREE.Object3D();
            ms1 = drawObject(type, ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'box4', mat, rnd, 129.22);
            if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 391.87, 4) === 0) {
                //ms1 = drawObject('wall-rim-1', ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'wall-rim-1', mat, rnd, 129.22);
                ms1 = drawObject(type, ms, f, x, y, x1 - 0.05, y1 - 0.05, z1, 0.101, 0.101, z2, 0, 'cylinder', 'wall-wood-x05', rnd, 444.01);
                ms1 = drawObject(type, ms, f, x, y, x1 - 0.05, y1 + 0.95, z1, 0.100, 0.100, z2, 0, 'cylinder', 'wall-wood-x05', rnd, 444.01);
                ms1 = drawObject(type, ms, f, x, y, x1 + 0.95, y1 - 0.05, z1, 0.099, 0.099, z2, 0, 'cylinder', 'wall-wood-x05', rnd, 444.01);
                ms1 = drawObject(type, ms, f, x, y, x1 + 0.95, y1 + 0.95, z1, 0.098, 0.098, z2, 0, 'cylinder', 'wall-wood-x05', rnd, 444.01);
            } else if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 391.87, 4) === 1) {
                //ms1 = drawObject('wall-rim-2', ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'wall-rim-2', mat, rnd, 129.22);
                ms1 = drawObject(type, ms, f, x, y, x1 + 0.45, y1 - 0.05, z1 + 0.25, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rz', 'wall-wood-x05', rnd, 444.01);
                ms1 = drawObject(type, ms, f, x, y, x1 + 0.95, y1 + 0.45, z1 + 0.25, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rx', 'wall-wood-x05', rnd, 444.01);
                ms1 = drawObject(type, ms, f, x, y, x1 + 0.45, y1 + 0.95, z1 + 0.25, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rz', 'wall-wood-x05', rnd, 444.01);
                ms1 = drawObject(type, ms, f, x, y, x1 - 0.05, y1 + 0.45, z1 + 0.25, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rx', 'wall-wood-x05', rnd, 444.01);
                ms1 = drawObject(type, ms, f, x, y, x1 + 0.45, y1 - 0.05, z1 - 0.75, 0.099, 0.099, z2 * 1.5, 0, 'cylinder-rz', 'wall-wood-x05', rnd, 444.01);
                ms1 = drawObject(type, ms, f, x, y, x1 + 0.95, y1 + 0.45, z1 - 0.75, 0.099, 0.099, z2 * 1.5, 0, 'cylinder-rx', 'wall-wood-x05', rnd, 444.01);
                ms1 = drawObject(type, ms, f, x, y, x1 + 0.45, y1 + 0.95, z1 - 0.75, 0.099, 0.099, z2 * 1.5, 0, 'cylinder-rz', 'wall-wood-x05', rnd, 444.01);
                ms1 = drawObject(type, ms, f, x, y, x1 - 0.05, y1 + 0.45, z1 - 0.75, 0.099, 0.099, z2 * 1.5, 0, 'cylinder-rx', 'wall-wood-x05', rnd, 444.01);
            }
            msg.add(ms);
            break;

            case 'wall-wood':
            var ms = new THREE.Object3D();
            ms1 = drawObject(type, ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'box4', mat, rnd, seed);
            if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 391.87, 4) === 0) {
                ms1 = drawObject(type, ms, f, x, y, -0.05, 0.95, z1, 0.1, 0.1, z2, 0, 'cylinder', 'wall-wood-x05', rnd, seed);
                ms1 = drawObject(type, ms, f, x, y, 0.95, 0.95, z1, 0.1, 0.1, z2, 0, 'cylinder', 'wall-wood-x05', rnd, seed);
            } else if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 391.87, 4) === 1) {
                ms1 = drawObject(type, ms, f, x, y, 0.45, 0.95, z1 + 0.25, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rz', 'wall-wood-x05', rnd, seed);
                ms1 = drawObject(type, ms, f, x, y, 0.45, 0.95, z1 - 0.75, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rz', 'wall-wood-x05', rnd, seed);
            }
            msg.add(ms);
            break;

            case 'door-wood':
            var ms = new THREE.Object3D();
            ms1 = drawObject(type, ms, f, x, y, x1, y1, z1, 0.25, y2, z2, 0, 'box4', 'wall-wood-x025', rnd, seed);
            ms1 = drawObject(type, ms, f, x, y, x1 + 0.75, y1, z1, 0.25, y2, z2, 0, 'box4', 'wall-wood-x025', rnd, seed);
            ms1 = drawObject(type, ms, f, x, y, x1 + 0.25, y1, 0.75, 0.5, y2, 0.25, 0, 'box4', 'wall-wood-x05-y025', rnd, seed);
            ms1 = drawObject(type, ms, f, x, y, x1 + 0.26, y1 + 0.005, z1, 0.48, y2 - 0.01, 0.74, 0, 'box4', 'wall-wood', rnd, seed);
            if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 391.87, 4) === 0) {
                ms1 = drawObject(type, ms, f, x, y, -0.05, 0.95, z1, 0.1, 0.1, z2, 0, 'cylinder', 'wall-wood-x05', rnd, seed);
                ms1 = drawObject(type, ms, f, x, y, 0.95, 0.95, z1, 0.1, 0.1, z2, 0, 'cylinder', 'wall-wood-x05', rnd, seed);
            } else if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 391.87, 4) === 1) {
                ms1 = drawObject(type, ms, f, x, y, 0.45, 0.95, z1 + 0.25, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rz', 'wall-wood-x05', rnd, seed);
                ms1 = drawObject(type, ms, f, x, y, 0.45, 0.95, z1 - 0.75, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rz', 'wall-wood-x05', rnd, seed);
            }
            msg.add(ms);
            break;

            case 'door-wood-open':
            var ms = new THREE.Object3D();
            ms1 = drawObject(type, ms, f, x, y, x1, y1, z1, 0.25, y2, z2, 0, 'box4', 'wall-wood-x025', rnd, seed);
            ms1 = drawObject(type, ms, f, x, y, x1 + 0.75, y1, z1, 0.25, y2, z2, 0, 'box4', 'wall-wood-x025', rnd, seed);
            ms1 = drawObject(type, ms, f, x, y, x1 + 0.25, y1, 0.75, 0.5, y2, 0.25, 0, 'box4', 'wall-wood-x05-y025', rnd, seed);
            if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 391.87, 4) === 0) {
                ms1 = drawObject(type, ms, f, x, y, -0.05, 0.95, z1, 0.1, 0.1, z2, 0, 'cylinder', 'wall-wood-x05', rnd, seed);
                ms1 = drawObject(type, ms, f, x, y, 0.95, 0.95, z1, 0.1, 0.1, z2, 0, 'cylinder', 'wall-wood-x05', rnd, seed);
            } else if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 391.87, 4) === 1) {
                ms1 = drawObject(type, ms, f, x, y, 0.45, 0.95, z1 + 0.25, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rz', 'wall-wood-x05', rnd, seed);
                ms1 = drawObject(type, ms, f, x, y, 0.45, 0.95, z1 - 0.75, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rz', 'wall-wood-x05', rnd, seed);
            }
            msg.add(ms);
            break;

            case 'wall-secret':
            var ms = new THREE.Object3D();
            ms1 = drawObject('wall', ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'wall', 'wall', rnd, 129.22);
            ms1 = drawObject(type, ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'box4', mat, rnd, 929.39);
            msg.add(ms);
            break;

            case 'stairs':
            var ms = new THREE.Object3D();
            /*if(typeof tdGeometry[geotype] === "undefined" || tdGeometry[geotype] === null) {
                var tdGeometry[geotype] = new THREE.PlaneBufferGeometry(x2, y2, 1, 1);
            }
            ms = new THREE.Mesh(tdGeometry[geotype], tdMaterial[mat].material[rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), seed, tdMaterial[mat].material.length)].material);
            ms.scale.set(1.5, 1.8027, 1.0);
            ms.position.set((x1 + (x2 / 2)) * 1.5 - 0.75, (z1 + (z2 / 2)) * 1.0, (y1 + (y2 / 2)) * 1.5 - 0.75);
            ms.rotateX(-56.61 * Math.PI / 180);
            msg.add(ms);*/
            for(var s = 0; s < 10; s++) {
                ms1 = drawObject(type, ms, f, x, y, x1 + 0.01, -0.98 + y1 + s * 0.1, z1 - s * 0.1 + 0.01, x2 * 0.98, y2 * 0.98, z2 * 0.98, 0, 'box', 'wall', rnd, 129.22);
            }
            msg.add(ms);
            break;

            case 'box4':
            var ms = new THREE.Object3D();
            ms1 = drawObject(type, ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'box', mat, rnd, seed);
            msg.add(ms);
            break;

            case 'pillar':
            var ms = new THREE.Object3D();
            if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 529.52, 3) === 0) {
                ms1 = drawObject(type, ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'cylinder', mat, rnd, 129.22);
                ms1 = drawObject(type, ms, f, x, y, x1 - 0.1, y1 - 0.1, z1 - 0.8, x2 + 0.2, y2 + 0.2, z2, 0, 'cylinder', 'wall-x20', rnd, 129.22);
                ms1 = drawObject(type, ms, f, x, y, x1 - 0.1, y1 - 0.1, z1 + 0.8, x2 + 0.2, y2 + 0.2, z2, 0, 'cylinder', 'wall-x20', rnd, 129.22);
            } else if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 529.52, 3) === 0) {
                ms1 = drawObject(type, ms, f, x, y, x1 - 0.1, y1 - 0.1, z1, x2 + 0.2, y2 + 0.2, z2, 0, 'cylinder', 'wall-x20', rnd, 129.22);
            } else {
                ms1 = drawObject(type, ms, f, x, y, x1 - 0.1, y1 + 0.15, z1, x2 + 0.2, 0, z2, 0, 'cylinder', 'wall-x20', rnd, 129.22);
                ms1 = drawObject(type, ms, f, x, y, x1 + 0.15, y1 - 0.1, z1, 0, y2 + 0.2, z2, 0, 'cylinder', 'wall-x20', rnd, 129.22);
            }
            msg.add(ms);
            break;

            case 'door':
            var ms = new THREE.Object3D();
            ms1 = drawObject(type, ms, f, x, y, x1 + x2 * 0.1, y1 + (y2 * 0.4), z1, x2 * 0.8, y2 * 0.2, z2, 0, 'box', mat, rnd, 356.11);
            ms1 = drawObject('door-rim', ms, f, x, y, x1 + 0.9, y1, z1, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            ms1 = drawObject('door-rim', ms, f, x, y, x1 - 0.9, y1, z1, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            msg.add(ms);
            break;

            case 'door-open':
            var ms = new THREE.Object3D();
            ms1 = drawObject(type, ms, f, x, y, x1 + x2 * 0.1, y1 + (y2 * 0.4), z1 + z2 * 0.8, x2 * 0.8, y2 * 0.2, z2, 0, 'box', mat, rnd, 356.11);
            ms1 = drawObject('door-rim', ms, f, x, y, x1 + 0.9, y1, z1, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            ms1 = drawObject('door-rim', ms, f, x, y, x1 - 0.9, y1, z1, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            msg.add(ms);
            break;

            case 'floor-ceil':
            var ms = new THREE.Object3D();
            ms1 = drawObject(type, ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'floor', mat, rnd, 51.33);
            //ms1.rotation.z = ((map[x - origin.x + mapSize / 2][y - origin.y + mapSize / 2].rotation + 2) * 90) * Math.PI / 180;
            ms1 = drawObject(type, ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'ceil', mat, rnd, 51.33);
            //ms1.rotation.z = ((map[x - origin.x + mapSize / 2][y - origin.y + mapSize / 2].rotation + 2) * 90) * Math.PI / 180;
            msg.add(ms);
            break;

            case 'floor-deco':
            var ms = new THREE.Object3D();
            ms1 = drawObject(type, ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'floor', mat, rnd, 707.89);
            msg.add(ms);
            break;

            case 'ceil-deco':
            var ms = new THREE.Object3D();
            ms1 = drawObject(type, ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'ceil', mat, rnd, 110.07);
            msg.add(ms);
            break;

            case 'stairs-up':
            var ms = new THREE.Object3D();
            ms1 = drawObject(type, ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'stairs', mat, rnd, 129.22);
            ms1 = drawObject('floor', ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'floor', 'floor', rnd, 51.33);
            ms1 = drawObject('box4', ms, f + 1, x, y, x1 - 1, y1, z1 + 1, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            ms1 = drawObject('box4', ms, f + 1, x, y, x1 + 1, y1, z1 + 1, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            ms1 = drawObject('box4', ms, f + 1, x, y + 1, x1, y1 + 1, z1 + 1, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            msg.add(ms);
            break;

            case 'stairs-down':
            var ms = new THREE.Object3D();
            ms1 = drawObject(type, ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'stairs', mat, rnd, 129.22);
            ms1 = drawObject('floor', ms, f, x, y, x1, y1, z1 + 1, x2, y2, z2, 0, 'ceil', 'floor', rnd, 51.33);
            ms1 = drawObject('box4', ms, f - 1, x - 1, y, x1 - 1, y1, z1, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            ms1 = drawObject('box4', ms, f - 1, x + 1, y, x1 + 1, y1, z1, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            msg.add(ms);
            break;
        }
        if(ms !== null) {
            if(typeof tdMaterial[mat].shadow === "undefined" || tdMaterial[mat].shadow) {
                ms.castShadow = true;
                if(typeof tdMaterial[mat].transparent !== "undefined" && tdMaterial[mat].transparent) {
                    //if(m !== null) {
                        //var uniforms = { texture:  { type: "t", value: m.texture } };
                        ms.customDepthMaterial = new THREE.ShaderMaterial( { vertexShader: vertexShader, fragmentShader: fragmentShader } );
                    //}
                }
            }
            ms.receiveShadow = true;
            return ms;
        }
    }
    return null;
}

function tdMoveCamera(d) {
    var xo = dir[d].x;
    var yo = dir[d].y;
    if(playerCanMove(d) === 1) {
        keysFrozen = true;
        origin.x = origin.x + xo;
        origin.y = origin.y + yo;
        initField();
        drawAll();
        tdDrawAll();
        new TWEEN.Tween( {x: origin.x % 150 - xo, y: origin.y % 150 - yo} )
            .to( {x: origin.x % 150, y: origin.y % 150}, 400)
            .easing(TWEEN.Easing.Sinusoidal.InOut)
            .onUpdate(function() {
                camera.position.x = this.x * 1.5;
                camera.position.z = this.y * 1.5;
                camera.translateZ(1.25);
            })
            .onComplete(function() {
                keysFrozen = false;
                floorAction(origin.x, origin.y);
                tdUpdateCamera();
            })
            .start();
    }
}

function tdRotateCamera(d) {
    keysFrozen = true;
    var do1 = -Math.PI / 2 * origin.d;
    var d1 = -Math.PI / 2 * d;
    origin.d = (origin.d + d + 4) % 4;
    new TWEEN.Tween( {d: do1} )
        .to( {d: do1 + d1}, 400)
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .onUpdate(function() {
            camera.position.x = origin.x % 150 * 1.5;
            camera.position.z = origin.y % 150 * 1.5;
            camera.rotation.y = this.d;
            camera.translateZ(1.25);
        })
        .onComplete(function() {
            keysFrozen = false;
            floorAction(origin.x, origin.y, origin.d);
            tdUpdateCamera();
        })
        .start();
}

function tdClearObject(obj) {
    if (obj !== ambientLight && obj !== light && obj !== plane && obj !== plane2 && obj !== camera) {
        if (obj.children !== undefined) {
            for (var c = obj.children.length - 1; c >= 0; c--) {
                obj.remove(obj.children[c]);
            }
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
    camera.position.x = origin.x % 150 * 1.5;
    camera.position.z = origin.y % 150 * 1.5;
    camera.rotation.y = -Math.PI / 2 * origin.d;
    camera.position.y = 0.5;
    camera.translateZ(1.25);
    
    light.position.set(0, 0, 0.4);

    var coo = 'F: ' + origin.f + ', X: ' + origin.x + ', Y: ' + origin.y + ', D: ' + origin.d
    $('body input#coordinates').val(coo);
    setCookie('player-coordinates', coo, 365);
}

function tdRotateInWorld(axis, object, radians) {
    switch(axis) {
        case 'x': var a = new THREE.Vector3(1,0,0); break;
        case 'y': var a = new THREE.Vector3(0,1,0); break;
        case 'z': var a = new THREE.Vector3(0,0,1); break;
    }
    var rotWorldMatrix = new THREE.Matrix4();
    rotWorldMatrix.makeRotationAxis(a.normalize(), radians);
    rotWorldMatrix.multiply(object.matrix);
    object.matrix = rotWorldMatrix;
    object.rotation.setFromRotationMatrix(object.matrix);
}

function fileExist(urlToFile) {
	try {
	    var xhr = new XMLHttpRequest();
	    xhr.open('HEAD', urlToFile, false);
	    xhr.send();
	} catch(err) {
		return false;
	}     
    if (xhr.status == "404") {
        return false;
    } else {
        return true;
    }
}