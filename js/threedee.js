var timer = 0;
var imagePath = 'images/';
var tdScreenWidth = 800;
var tdScreenHeight = 600;
var vertexShader = document.getElementById( 'vertexShaderDepth' ).textContent;
var fragmentShader = document.getElementById( 'fragmentShaderDepth' ).textContent;

var cubeMapPath = imagePath + 'cubemap/';
var cubeMapUrls = [
    cubeMapPath + '1.jpg', cubeMapPath + '2.jpg',
    cubeMapPath + '3.jpg', cubeMapPath + '4.jpg',
    cubeMapPath + '5.jpg', cubeMapPath + '6.jpg'
];

var aryImageLoader = [];

var scene, renderer, camera;
var light, ambientLight;
var plane, plane2;
var reflectionCube;
var tdTexture = {};
var tdGeometry = [];
var tdMaterial = {
    'wall': {
        image: 'wall',
        normal: true,
        specular: true,
        len: 28
    },
    'wall-x20': {
        image: 'wall',
        normal: true,
        specular: true,
        scale: {x: 2, y: 1},
        len: 28
    },
    'wall-x01': {
        image: 'wall',
        normal: true,
        specular: true,
        scale: {x: 0.1, y: 1},
        len: 28
    },
    'wall-x05': {
        image: 'wall',
        normal: true,
        specular: true,
        scale: {x: 0.5, y: 1},
        len: 28
    },
    'wall-y01': {
        image: 'wall',
        normal: true,
        specular: true,
        scale: {x: 1, y: 0.1},
        len: 28
    },
    'wall-secret': {
        image: 'wall-secret',
        transparent: true,
        opacity: 0.5,
        len: 6
    },
    'wall-wood': {
        image: 'wall-wood',
        transparent: true,
        normal: true,
        specular: true,
        len: 15
    },
    'wall-wood-x05': {
        image: 'wall-wood',
        transparent: true,
        normal: true,
        specular: true,
        scale: {x: 0.5, y: 1},
        len: 15
    },
    'wall-wood-x01': {
        image: 'wall-wood',
        transparent: true,
        normal: true,
        specular: true,
        scale: {x: 0.1, y: 1},
        len: 15
    },
    'wall-wood-y01': {
        image: 'wall-wood',
        transparent: true,
        normal: true,
        specular: true,
        scale: {x: 1, y: 0.1},
        len: 15
    },
    'door-wood-left': {
        image: 'wall-wood',
        transparent: true,
        normal: true,
        specular: true,
        scale: {x: 0.25, y: 1},
        len: 15
    },
    'door-wood-right': {
        image: 'wall-wood',
        transparent: true,
        normal: true,
        specular: true,
        scale: {x: 0.25, y: 1},
        translate: {x: 0.75, y: 0},
        len: 15
    },
    'door-wood-top': {
        image: 'wall-wood',
        transparent: true,
        normal: true,
        specular: true,
        scale: {x: 0.5, y: 0.25},
        translate: {x: 0.25, y: 0.75},
        len: 15
    },
    'door': {
        image: 'door',
        transparent: true,
        normal: true,
        specular: true,
        len: 15
    },
    'floor': {
        image: 'floor',
        normal: true,
        specular: true,
        len: 24
    },
    'teleport': {
        image: 'teleport',
        shadow: false,
        transparent: true,
        opacity: 0.5,
        blend: THREE.AdditiveBlending,
        animate: 'random,10',
        len: 1
    },
    'wall-switch': {
        image: 'wall-switch',
        transparent: true,
        normal: true,
        shadow: false,
        len: 9
    },
    'wall-switch-off': {
        color: '#333333',
        image: 'wall-switch',
        transparent: true,
        normal: true,
        shadow: false,
        len: 9
    },
    'wall-deco': {
        image: 'wall-deco',
        transparent: true,
        normal: true,
        shadow: false,
        len: 23
    },
    'floor-deco': {
        image: 'floor-deco',
        transparent: true,
        normal: false,
        shadow: false,
        len: 8
    },
    'test': {
        color: '#FF00FF',
        len: 1
    }
};

function tdAnimate() {
    requestAnimationFrame(tdAnimate);
    tdRender();
}
function tdRender() {
    for (var ob in tdMaterial) {
        if(typeof tdMaterial[ob].animate !== 'undefined' && tdMaterial[ob].animate.split(',')[0] === 'random') {
            var at = parseInt(tdMaterial[ob].animate.split(',')[1]);
            if(timer % (60 / at) === 0) {
                //var tex = ob;
                if(typeof tdTexture[ob] !== "undefined") {
                    for(var i = 0; i < tdTexture[ob].length; i++) {
                        tdTexture[ob][i].offset.x = Math.random();
                        tdTexture[ob][i].offset.y = Math.random();
                    }
                }
            }
        }
    }
    timer++;
    printDebug();
    TWEEN.update();
    renderer.render(scene, camera);
}

function tdCreateMaterial(ob, i) {
    //var tex = ob;
    var img = tdMaterial[ob].image + '-' + i;
    if(typeof tdMaterial[ob].material === "undefined") {
        tdMaterial[ob].material = [];
    } else if(typeof tdMaterial[ob].material[i] !== "undefined") {
        return tdMaterial[ob].material[i];
    }
    if(typeof tdMaterial[ob].image !== "undefined" && tdMaterial[ob].image !== '') {
        var color = null;
        if(typeof tdMaterial[ob].color !== "undefined") {
            color = tdMaterial[ob].color;
        }
        var trans = false;
        if(typeof tdMaterial[ob].transparent !== "undefined" && tdMaterial[ob].transparent) {
            trans = true;
        }
        var metal = false;
        if(typeof tdMaterial[ob].metal !== "undefined" && tdMaterial[ob].metal) {
            metal = true;
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
            color: color,
            specular: new THREE.Color(0x000000),
            metal: metal,
            blending: blend,
            transparent: trans,
            opacity: opac,
            side: THREE.FrontSide,
            envMap: refl
        };
        tdMaterial[ob].material[i] = new THREE.MeshPhongMaterial(parameters);

        if(typeof tdTexture[ob] === "undefined") {
            tdTexture[ob] = [];
        }
        if(typeof tdTexture[ob][i] === "undefined") {
            var loader = new THREE.ImageLoader( loadingManager );
            loader.load(imagePath + img + '.jpg',
                function(image) {
                    tdUpdateTexture(image, ob, i);
                },
                function(xhr) {},
                function(xhr) {
                    loadingCountError++;
                    loader.load(imagePath + img + '.png',
                        function(image) {
                            tdUpdateTexture(image, ob, i);
                        },
                        function() {
                        },
                        function() {
                            tdTexture[ob][i] = null;
                        }
                    );
                }
            );
        } else if(tdTexture[ob][i] === null) {
            return null;
        }
        if(typeof tdMaterial[ob].normal !== "undefined" && tdMaterial[ob].normal) {
            var pre = 'norm';
            if(typeof tdTexture[pre + '-' + ob] === "undefined") {
                tdTexture[pre + '-' + ob] = [];
            }
            if(typeof tdTexture[pre + '-' + ob][i] === 'undefined') {
                var loader = new THREE.ImageLoader( loadingManager );
                loader.load(imagePath + pre + '/' + img + '.jpg',
                    function(image) {
                        tdUpdateNormal(image, ob, i);
                    },
                    function(xhr) {},
                    function(xhr) {
                        loadingCountError++;
                    }
                );
            }
        }
        if(typeof tdMaterial[ob].specular !== "undefined" && tdMaterial[ob].specular) {
            var pre = 'spec';
            if(typeof tdTexture[pre + '-' + ob] === "undefined") {
                tdTexture[pre + '-' + ob] = [];
            }
            if(typeof tdTexture[pre + '-' + ob][i] === 'undefined') {
                var loader = new THREE.ImageLoader( loadingManager );
                loader.load(imagePath + pre + '/' + img + '.jpg',
                    function(image) {
                        tdUpdateSpecular(image, ob, i);
                    },
                    function(xhr) {},
                    function(xhr) {
                        loadingCountError++;
                    }
                );
            }
        }

        return tdMaterial[ob].material[i];
        //i++;
        //}
    } else if(typeof tdMaterial[ob].color !== "undefined" && tdMaterial[ob].color !== null) {
        tdMaterial[ob].material[i] = new THREE.MeshLambertMaterial( {color: tdMaterial[ob].color, side: THREE.FrontSide} );
    }
    return null;
}

function tdUpdateTexture(image, ob, i) {
    if(typeof tdMaterial[ob].material[i] !== "undefined") {

        (function(image, ob, i) {
            setTimeout(function() {
                tdTexture[ob][i] = new THREE.Texture();
                tdTexture[ob][i].image = image;
                if(typeof tdMaterial[ob].scale !== "undefined") {
                    tdTexture[ob][i].repeat.set(tdMaterial[ob].scale.x, tdMaterial[ob].scale.y);
                }
                if(typeof tdMaterial[ob].translate !== "undefined") {
                    tdTexture[ob][i].offset.x = tdMaterial[ob].translate.x;
                    tdTexture[ob][i].offset.y = tdMaterial[ob].translate.y;
                }
                tdTexture[ob][i].wrapT = tdTexture[ob][i].wrapS = THREE.RepeatWrapping;
                tdTexture[ob][i].anisotropy = 16;
                tdTexture[ob][i].needsUpdate = true;
                tdMaterial[ob].material[i].map = tdTexture[ob][i];
                tdMaterial[ob].material[i].needsUpdate = true;
                if(tdMaterial[ob].material[i].map.image.src.endsWith('.png') && typeof tdMaterial['shade-' + ob] !== "undefined" && typeof tdMaterial['shade-' + ob].material !== "undefined" && typeof tdMaterial['shade-' + ob].material[i] !== "undefined") {
                    var uniforms = { texture: { type: "t", value: tdMaterial[ob].material[i].map } };
                    tdMaterial['shade-' + ob].material[i].uniforms = uniforms;
                    tdMaterial['shade-' + ob].material[i].needsUpdate = true;
                }
            }, 1);
        })(image, ob, i);
    }
}

function tdUpdateNormal(image, ob, i) {
    if(typeof tdMaterial[ob].material[i] !== "undefined") {
        (function(image, ob, i) {
            setTimeout(function() {
                tdTexture['norm-' + ob][i] = new THREE.Texture();
                tdTexture['norm-' + ob][i].image = image;
                tdTexture['norm-' + ob][i].needsUpdate = true;
                tdMaterial[ob].material[i].normalMap = tdTexture['norm-' + ob][i];
                tdMaterial[ob].material[i].needsUpdate = true;
            }, 1);
        })(image, ob, i);
    }
}

function tdUpdateSpecular(image, ob, i) {
    if(typeof tdMaterial[ob].material[i] !== "undefined") {
        (function(image, ob, i) {
            setTimeout(function() {
                tdTexture['spec-' + ob][i] = new THREE.Texture();
                tdTexture['spec-' + ob][i].image = image;
                tdTexture['spec-' + ob][i].needsUpdate = true;
                tdMaterial[ob].material[i].specularMap = tdTexture['spec-' + ob][i];
                tdMaterial[ob].material[i].specular = new THREE.Color(0x302820);
                tdMaterial[ob].material[i].shininess = 20;
                tdMaterial[ob].material[i].needsUpdate = true;
            }, 1);
        })(image, ob, i);
    }
}

function tdCreateMaterials() {
    for (var ob in tdMaterial) {
        var i = 0;
        while(tdCreateMaterial(ob, i) !== null) {
            i++;
        }
    }
}

function tdCreateScene() {
    var canvas = document.getElementById('view');

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true});
    canvas.width  = window.innerWidth - viewSize * squareSize - 10;
    canvas.height = window.innerHeight - 70;
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setClearColor(0x000000, 1.0);
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.shadowMapEnabled = true;
    renderer.shadowMapType = THREE.PCFSoftShadowMap;
    renderer.shadowMapSoft = true;
    renderer.shadowCameraNear = 0.5;
    renderer.shadowCameraFar = tdViewSize;
    renderer.shadowCameraFov = 35;
    renderer.setViewport(0, 0, canvas.width, canvas.height);
    renderer.setSize( canvas.width, canvas.height );
    reflectionCube = THREE.ImageUtils.loadTextureCube(cubeMapUrls);
    reflectionCube.format = THREE.RGBFormat;

    camera = new THREE.PerspectiveCamera( 35, canvas.width / canvas.height, 1, tdViewSize );
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 1, tdViewSize);
    scene.add(camera);
    window.addEventListener('resize', function () {
        canvas.width  = window.innerWidth - viewSize * squareSize - 10;
        canvas.height = window.innerHeight - 70;
        renderer.setViewport(0, 0, canvas.width, canvas.height);
        renderer.setSize( canvas.width, canvas.height );
        camera.aspect = canvas.width / canvas.height;
        camera.updateProjectionMatrix();
    });
}

function tdCreateLight() {
    ambientLight = new THREE.AmbientLight(0x302820);
    light = new THREE.SpotLight(0xf0e0d0);
    light.intensity = 3;
    light.distance = tdViewSize;
    //light.angle = 90 * Math.PI / 180;
    light.shadowDarkness = 0.75;
    light.castShadow = true;
    light.shadowCameraNear = 1.5;
    light.shadowCameraFar = tdViewSize;
    light.shadowMapWidth = 1024;
    light.shadowMapHeight = 1024;
    //light.shadowCameraVisible = true;

    light.target = camera;

    scene.add(ambientLight);
    camera.add(light);
}

function tdDraw(x, y) {
    var c = toMapCoord(x, y);
    if(c.x >= 0 && c.x < mapSize && c.y >= 0 && c.y < mapSize) {
        var c = toMapCoord(x, y);
        tdClearObject(map[c.x][c.y].mesh);
        map[c.x][c.y].mesh = tdCreateObject(x, y);
    }
}

function tdDrawAll(force) {
    if(typeof force !== "undefined" || force) {
        tdClearWorld();
        origin.xt = origin.x;
        origin.yt = origin.y;
    }
    var i = 0;
    for(var x = -Math.floor(tdViewSize / 2) - 1; x <= Math.floor(tdViewSize / 2) + 1; x++) {
        for(var y = -Math.floor(tdViewSize / 2) - 1; y <= Math.floor(tdViewSize / 2) + 1; y++) {
            //if(typeof force !== "undefined" || force || typeof scene.getObjectByName(keyLocation(origin.f, origin.x + x, origin.y + y)) === "undefined") {
            if(typeof force !== "undefined" || force || typeof map[Math.floor(mapSize / 2) + x][Math.floor(mapSize / 2) + y].mesh === "undefined") {
                tdDraw(origin.x + x, origin.y + y);
                i++;
            }
        }
    }
    console.log('Meshes updated: ' + i);
}

function tdCreateObject(x, y) {
    //var xo = x + origin.x;
    //var yo = y + origin.y;
    var ob = getSquareObj(x, y).split(',');
    var ms = null;
    var msg = new THREE.Object3D();
    msg.name = 'F' + origin.f + ',X' + x + ',Y' + y;
    msg.position.x = (x - origin.xt) * 1.5;
    msg.position.y = 0;
    msg.position.z = (y - origin.yt) * 1.5;

    for(var o = 0; o < ob.length; o++) {
        var mat = '', type = '';
        var x1 = 0, y1 = 0, z1 = 0, x2 = 1, y2 = 1, z2 = 0;
        var seed = 0;
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
            case 'teleport': x1 = 0, y1 = 0, z1 = 0, x2 = 1, y2 = 1, z2 = 1; type = 'box4'; mat = 'teleport'; rnd = 100; seed = 515.78; break;
            case 'pit': x1 = 0, y1 = 0, z1 = 0, x2 = 1, y2 = 1, z2 = 1; type = 'pit'; mat = 'floor'; rnd = 100; seed = 51.33; break;
            case 'pit-ceil': x1 = 0, y1 = 0, z1 = 2, x2 = 1, y2 = 1, z2 = 1; type = 'pit'; mat = 'floor'; rnd = 100; seed = 51.33; break;
            case 'stairs-up': x1 = 0, y1 = 0, z1 = 0, x2 = 1, y2 = 1, z2 = 1; type = 'stairs-up'; mat = 'wall'; rnd = 100; break;
            case 'stairs-down': x1 = 0, y1 = 0, z1 = -1, x2 = 1, y2 = 1, z2 = 1; type = 'stairs-down'; mat = 'wall'; rnd = 100; break;
            case 'wall-switch': x1 = 0, y1 = 1.001, z1 = 0, x2 = 1, y2 = 1, z2 = 1; type = 'wall-deco'; mat = 'wall-switch'; seed = 123.43; break;
            case 'wall-switch-off': x1 = 0, y1 = 1.001, z1 = 0, x2 = 1, y2 = 1, z2 = 1; type = 'wall-deco'; mat = 'wall-switch-off'; seed = 123.43; break;
            case 'wall-deco': x1 = 0, y1 = 1.001, z1 = 0, x2 = 1, y2 = 1, z2 = 1; type = 'wall-deco'; mat = 'wall-deco'; seed = 860.97; break;
            case 'floor-deco': x1 = 0, y1 = 0, z1 = 0.001, x2 = 1, y2 = 1, z2 = 1; type = 'floor-deco'; mat = 'floor-deco'; break;
            case 'high-ceil': x1 = 0, y1 = 0, z1 = 1, x2 = 1, y2 = 1, z2 = 1; type = 'high-ceil'; mat = 'floor'; rnd = 100; seed = 51.33; break;
            case 'high-wall': x1 = 0, y1 = 0, z1 = 1, x2 = 1, y2 = 1, z2 = 1; type = 'wall'; mat = 'wall'; rnd = 100; seed = 129.22; break;
            case 'light': x1 = 0, y1 = 0, z1 = 1.9, x2 = 1, y2 = 1, z2 = 1; type = 'light'; mat = ''; rnd = 100; seed = 821.95; break;
            default: break;
        }
        var d = parseInt(getSquareDirections(x, y).substring(o, o + 1));
        ms = tdDrawObject(type, msg, origin.f, x, y, x1, y1, z1, x2, y2, z2, d, type, mat, rnd, seed);
        if(ms !== null) {
            tdRotateInWorld('y', ms, (-(d + 2) * 90) * Math.PI / 180);
        }
    }
    scene.add(msg);
    return msg;
}

function tdDrawObject(type, msg, f, x, y, x1, y1, z1, x2, y2, z2, d, metatype, mat, rnd, seed) {
    var m = null;
    var ms = null;
    var ms1 = null;
    var d1 = (d + 1) % 4;
    var d2 = (d + 2) % 4;
    var d3 = (d + 3) % 4;
    var geotype = type + '-' + x2 + '-' + y2 + '-' + z2;
    if(metatype !== '') {
        switch(metatype) {
            case 'box':
            i = rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), seed, tdMaterial[mat].len);
            m = tdCreateMaterial(mat, i);
            if(m !== null) {
                if(typeof tdGeometry[geotype] === "undefined" || tdGeometry[geotype] === null) {
                    tdGeometry[geotype] = new THREE.BoxGeometry(x2, z2, y2, 1, 1);
                }
                ms = new THREE.Mesh(tdGeometry[geotype], m);
                ms.scale.set(1.5, 1.0, 1.5);
                ms.rotation.y = (-(d + 2) * 90) * Math.PI / 180;
                ms.position.x = (x1 + (x2 / 2)) * 1.5 - 0.75;
                ms.position.y = (z1 + (z2 / 2)) * 1.0;
                ms.position.z = (y1 + (y2 / 2)) * 1.5 - 0.75;
            }
            break;

            case 'box4':
            var i = rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), seed, tdMaterial[mat].len);
            m = tdCreateMaterial(mat, i);
            if(m !== null) {
                if(typeof tdGeometry[geotype] === "undefined" || tdGeometry[geotype] === null) {
                    tdGeometry[geotype] = new THREE.BoxGeometry(x2, z2, y2, 1, 1);
                    tdGeometry[geotype].faces.splice(4, 4); //remove top and bottom
                }
                ms = new THREE.Mesh(tdGeometry[geotype], m);
                ms.scale.set(1.5, 1.0, 1.5);
                ms.rotation.y = (-(d + 2) * 90) * Math.PI / 180;
                ms.position.x = (x1 + (x2 / 2)) * 1.5 - 0.75;
                ms.position.y = (z1 + (z2 / 2)) * 1.0;
                ms.position.z = (y1 + (y2 / 2)) * 1.5 - 0.75;
            }
            break;

            case 'floor':
            var i = rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor((x + rnd / 2) / rnd), Math.floor((y + rnd / 2) / rnd), seed, tdMaterial[mat].len);
            m = tdCreateMaterial(mat, i);
            if(m !== null) {
                if(typeof tdGeometry[geotype] === "undefined" || tdGeometry[geotype] === null) {
                    tdGeometry[geotype] = new THREE.PlaneBufferGeometry(x2, y2, 1, 1);
                }
                ms = new THREE.Mesh(tdGeometry[geotype], m);
                ms.scale.set(1.5, 1.5, 1.0);
                ms.position.set((x1 + (x2 / 2)) * 1.5 - 0.75, (z1 + (z2 / 2)) * 1.0 - 0.5, (y1 + (y2 / 2)) * 1.5 - 0.75);
                ms.rotation.y = (-(d + 2) * 90) * Math.PI / 180;
                ms.rotateX(-Math.PI / 2);
            }
            break;

            case 'ceil':
            var i = rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor((x + rnd / 2) / rnd), Math.floor((y + rnd / 2) / rnd), seed, tdMaterial[mat].len);
            m = tdCreateMaterial(mat, i);
            if(m !== null) {
                if(typeof tdGeometry[geotype] === "undefined" || tdGeometry[geotype] === null) {
                    tdGeometry[geotype] = new THREE.PlaneBufferGeometry(x2, y2, 1, 1);
                }
                ms = new THREE.Mesh(tdGeometry[geotype], m);
                ms.scale.set(1.5, 1.5, 1.0);
                ms.position.set((x1 + (x2 / 2)) * 1.5 - 0.75, (z1 + (z2 / 2)) * 1.0 + 0.5, (y1 + (y2 / 2)) * 1.5 - 0.75);
                ms.rotation.y = (-(d + 2) * 90) * Math.PI / 180;
                ms.rotateX(-3.0 * Math.PI / 2);
            }
            break;
            
            case 'wall-deco':
            var i = rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), seed, tdMaterial[mat].len);
            m = tdCreateMaterial(mat, i);
            if(m !== null) {
                if(typeof tdGeometry[geotype] === "undefined" || tdGeometry[geotype] === null) {
                    tdGeometry[geotype] = new THREE.PlaneBufferGeometry(x2, y2, 1, 1);
                }
                ms = new THREE.Mesh(tdGeometry[geotype], m);
                ms.scale.set(1.5, 1.0, 1.0);
                ms.position.set((x1 + (x2 / 2)) * 1.5 - 0.75, (z1 + (z2 / 2)) * 1.0, 0);//(0, 0.5, 0);
                ms.rotation.y = (-(d + 2) * 90) * Math.PI / 180;
                ms.translateZ(y1 * 0.75);
            }
            break;

            case 'ramp-reversed':
            var i = rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor((x + rnd / 2) / rnd), Math.floor((y + rnd / 2) / rnd), seed, tdMaterial[mat].len);
            m = tdCreateMaterial(mat, i);
            if(m !== null) {
                if(typeof tdGeometry[geotype] === "undefined" || tdGeometry[geotype] === null) {
                    tdGeometry[geotype] = new THREE.PlaneBufferGeometry(x2, y2, 1, 1);
                }
                ms = new THREE.Mesh(tdGeometry[geotype], m);
                ms.scale.set(1.5, 1.8027, 1.0);
                ms.position.set((x1 + (x2 / 2)) * 1.5 - 0.75, (z1 + (z2 / 2)) * 1.0 + 1.0, (y1 + (y2 / 2)) * 1.5 - 0.75);
                ms.rotateX(124 * Math.PI / 180);
            }
            break;

            case 'cylinder':
            var i = rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), seed, tdMaterial[mat].len);
            m = tdCreateMaterial(mat, i);
            if(m !== null) {
                if(typeof tdGeometry[geotype] === "undefined" || tdGeometry[geotype] === null) {
                    tdGeometry[geotype] = new THREE.CylinderGeometry(x2 * 0.5, y2 * 0.5, z2, 9);
                }
                ms = new THREE.Mesh(tdGeometry[geotype], m);
                ms.scale.set(1.5, 1.0, 1.5);
                ms.position.set((x1 + (x2 / 2)) * 1.5 - 0.75, (z1 + (z2 / 2)) * 1.0, (y1 + (y2 / 2)) * 1.5 - 0.75);
            }
            break;

            case 'cylinder-rx':
            var i = rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), seed, tdMaterial[mat].len);
            m = tdCreateMaterial(mat, i);
            if(m !== null) {
                if(typeof tdGeometry[geotype] === "undefined" || tdGeometry[geotype] === null) {
                    tdGeometry[geotype] = new THREE.CylinderGeometry(x2 * 0.5, y2 * 0.5, z2, 9);
                }
                ms = new THREE.Mesh(tdGeometry[geotype], m);
                ms.scale.set(1.5, 1.0, 1.5);
                ms.position.set((x1 + (x2 / 2)) * 1.5 - 0.75, (z1 + (z2 / 2)) * 1.0, (y1 + (y2 / 2)) * 1.5 - 0.75);
                ms.rotation.x = 90 * Math.PI / 180;
            }
            break;

            case 'cylinder-rz':
            var i = rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), seed, tdMaterial[mat].len);
            m = tdCreateMaterial(mat, i);
            if(m !== null) {
                if(typeof tdGeometry[geotype] === "undefined" || tdGeometry[geotype] === null) {
                    tdGeometry[geotype] = new THREE.CylinderGeometry(x2 * 0.5, y2 * 0.5, z2, 9);
                }
                ms = new THREE.Mesh(tdGeometry[geotype], m);
                ms.scale.set(1.5, 1.0, 1.5);
                ms.position.set((x1 + (x2 / 2)) * 1.5 - 0.75, (z1 + (z2 / 2)) * 1.0, (y1 + (y2 / 2)) * 1.5 - 0.75);
                ms.rotation.z = 90 * Math.PI / 180;
            }
            break;



            case 'wall':
            ms = new THREE.Object3D();
            ms1 = tdDrawObject(type, ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'box4', mat, rnd, 129.22);
            tdHideWallFaces(ms1, x, y);
            if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 391.87, 6) === 0) {
                ms1 = tdDrawObject(type, ms, f, x, y, x1 - 0.05, y1 - 0.05, z1, 0.101, 0.101, z2, 0, 'cylinder', 'wall-wood-x05', rnd, 444.01);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 - 0.05, y1 + 0.95, z1, 0.100, 0.100, z2, 0, 'cylinder', 'wall-wood-x05', rnd, 444.01);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 + 0.95, y1 - 0.05, z1, 0.099, 0.099, z2, 0, 'cylinder', 'wall-wood-x05', rnd, 444.01);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 + 0.95, y1 + 0.95, z1, 0.098, 0.098, z2, 0, 'cylinder', 'wall-wood-x05', rnd, 444.01);
            } else if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 391.87, 6) === 1) {
                ms1 = tdDrawObject(type, ms, f, x, y, x1 + 0.45, y1 - 0.05, z1 + 0.25, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rz', 'wall-wood-x05', rnd, 444.01);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 + 0.95, y1 + 0.45, z1 + 0.25, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rx', 'wall-wood-x05', rnd, 444.01);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 + 0.45, y1 + 0.95, z1 + 0.25, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rz', 'wall-wood-x05', rnd, 444.01);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 - 0.05, y1 + 0.45, z1 + 0.25, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rx', 'wall-wood-x05', rnd, 444.01);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 + 0.45, y1 - 0.05, z1 - 0.75, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rz', 'wall-wood-x05', rnd, 444.01);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 + 0.95, y1 + 0.45, z1 - 0.75, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rx', 'wall-wood-x05', rnd, 444.01);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 + 0.45, y1 + 0.95, z1 - 0.75, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rz', 'wall-wood-x05', rnd, 444.01);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 - 0.05, y1 + 0.45, z1 - 0.75, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rx', 'wall-wood-x05', rnd, 444.01);
            } else if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 391.87, 6) === 2) {
                if(rand(f, x, y, 197.76, 2) === 0) {
                    ms1 = tdDrawObject('box4', ms, f, x, y, x1 - 0.05, y1 - 0.05, z1, 0.101, 0.101, z2, 0, 'box4', 'wall-wood-x01', rnd, 444.01);
                }
            }
            break;

            case 'wall-wood':
            ms = new THREE.Object3D();
            ms1 = tdDrawObject(type, ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'box4', mat, rnd, seed);
            if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 391.87, 6) === 0) {
                ms1 = tdDrawObject(type, ms, f, x, y, -0.05, 0.95, z1, 0.1, 0.1, z2, 0, 'cylinder', 'wall-wood-x05', rnd, seed);
                ms1 = tdDrawObject(type, ms, f, x, y, 0.95, 0.95, z1, 0.1, 0.1, z2, 0, 'cylinder', 'wall-wood-x05', rnd, seed);
            } else if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 391.87, 6) === 1) {
                ms1 = tdDrawObject(type, ms, f, x, y, 0.45, 0.95, z1 + 0.25, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rz', 'wall-wood-x05', rnd, seed);
                ms1 = tdDrawObject(type, ms, f, x, y, 0.45, 0.95, z1 - 0.75, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rz', 'wall-wood-x05', rnd, seed);
            }
            break;

            case 'door-wood':
            ms = new THREE.Object3D();
            ms1 = tdDrawObject(type, ms, f, x, y, x1, y1, z1, 0.25, y2, z2, 0, 'box4', 'door-wood-left', rnd, seed);
            ms1 = tdDrawObject(type, ms, f, x, y, x1 + 0.75, y1, z1, 0.25, y2, z2, 0, 'box4', 'door-wood-right', rnd, seed);
            ms1 = tdDrawObject(type, ms, f, x, y, x1 + 0.25, y1, 0.75, 0.5, y2, 0.25, 0, 'box', 'door-wood-top', rnd, seed);
            ms1 = tdDrawObject(type, ms, f, x, y, x1 + 0.26, y1 + 0.005, z1, 0.48, y2 - 0.01, 0.74, 0, 'box4', 'wall-wood', rnd, seed);
            if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 391.87, 6) === 0) {
                ms1 = tdDrawObject(type, ms, f, x, y, -0.05, 0.95, z1, 0.1, 0.1, z2, 0, 'cylinder', 'wall-wood-x05', rnd, seed);
                ms1 = tdDrawObject(type, ms, f, x, y, 0.95, 0.95, z1, 0.1, 0.1, z2, 0, 'cylinder', 'wall-wood-x05', rnd, seed);
            } else if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 391.87, 6) === 1) {
                ms1 = tdDrawObject(type, ms, f, x, y, 0.45, 0.95, z1 + 0.25, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rz', 'wall-wood-x05', rnd, seed);
                ms1 = tdDrawObject(type, ms, f, x, y, 0.45, 0.95, z1 - 0.75, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rz', 'wall-wood-x05', rnd, seed);
            }
            break;

            case 'door-wood-open':
            ms = new THREE.Object3D();
            ms1 = tdDrawObject(type, ms, f, x, y, x1, y1, z1, 0.25, y2, z2, 0, 'box4', 'door-wood-left', rnd, seed);
            ms1 = tdDrawObject(type, ms, f, x, y, x1 + 0.75, y1, z1, 0.25, y2, z2, 0, 'box4', 'door-wood-right', rnd, seed);
            ms1 = tdDrawObject(type, ms, f, x, y, x1 + 0.25, y1, 0.75, 0.5, y2, 0.25, 0, 'box', 'door-wood-top', rnd, seed);
            if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 391.87, 6) === 0) {
                ms1 = tdDrawObject(type, ms, f, x, y, -0.05, 0.95, z1, 0.1, 0.1, z2, 0, 'cylinder', 'wall-wood-x05', rnd, seed);
                ms1 = tdDrawObject(type, ms, f, x, y, 0.95, 0.95, z1, 0.1, 0.1, z2, 0, 'cylinder', 'wall-wood-x05', rnd, seed);
            } else if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 391.87, 6) === 1) {
                ms1 = tdDrawObject(type, ms, f, x, y, 0.45, 0.95, z1 + 0.25, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rz', 'wall-wood-x05', rnd, seed);
                ms1 = tdDrawObject(type, ms, f, x, y, 0.45, 0.95, z1 - 0.75, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rz', 'wall-wood-x05', rnd, seed);
            }
            break;

            case 'wall-secret':
            ms = new THREE.Object3D();
            ms1 = tdDrawObject('wall', ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'wall', 'wall', rnd, 129.22);
            ms1 = tdDrawObject(type, ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'box4', mat, rnd, 929.39);
            break;

            case 'pit':
            if(z1 === 0 || hasSquare(x, y, 'high-ceil') === -1) {
                var i = rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor((x + rnd / 2) / rnd), Math.floor((y + rnd / 2) / rnd), seed, tdMaterial[mat].len);
                ms = new THREE.Object3D();
                tdLoadObjectOBJ(type, ms, x1, y1, z1, x2, y2, z2, 0, type, mat, i);
            }
            break;

            case 'stairs':
            ms = new THREE.Object3D();
            for(var s = 0; s < 10; s++) {
                ms1 = tdDrawObject(type, ms, f, x, y, x1, y1 + s * 0.1, z1 - s * 0.1 + 0.9, x2, y2 * 0.1, z2 * 0.1, 0, 'box', 'wall-y01', rnd, 129.22);
            }
            break;

            case 'pillar':
            ms = new THREE.Object3D();
            if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 529.52, 3) === 0) {
                ms1 = tdDrawObject(type, ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'cylinder', mat, rnd, 129.22);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 - 0.1, y1 - 0.1, z1 - 0.8, x2 + 0.2, y2 + 0.2, z2, 0, 'cylinder', 'wall-x20', rnd, 129.22);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 - 0.1, y1 - 0.1, z1 + 0.8, x2 + 0.2, y2 + 0.2, z2, 0, 'cylinder', 'wall-x20', rnd, 129.22);
            } else if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 529.52, 3) === 0) {
                ms1 = tdDrawObject(type, ms, f, x, y, x1 - 0.1, y1 - 0.1, z1, x2 + 0.2, y2 + 0.2, z2, 0, 'cylinder', 'wall-x20', rnd, 129.22);
            } else {
                ms1 = tdDrawObject(type, ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'cylinder', mat, rnd, 129.22);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 - 0.1, y1 + 0.15, 0.6, x2 + 0.2, 0, 0.4, 0, 'cylinder', 'wall-x20', rnd, 129.22);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 + 0.15, y1 - 0.1, z1, 0, y2 + 0.2, 0.4, 0, 'cylinder', 'wall-x20', rnd, 129.22);
            }
            break;

            case 'door':
            ms = new THREE.Object3D();
            ms1 = tdDrawObject(type, ms, f, x, y, x1 + x2 * 0.1, y1 + (y2 * 0.4), z1, x2 * 0.8, y2 * 0.2, z2, 0, 'box', mat, rnd, 356.11);
            ms1 = tdDrawObject('door-rim', ms, f, x, y, x1 + 0.9, y1, z1, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            ms1 = tdDrawObject('door-rim', ms, f, x, y, x1 - 0.9, y1, z1, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            break;

            case 'door-open':
            ms = new THREE.Object3D();
            ms1 = tdDrawObject(type, ms, f, x, y, x1 + x2 * 0.1, y1 + (y2 * 0.4), z1 + z2 * 0.8, x2 * 0.8, y2 * 0.2, z2, 0, 'box', mat, rnd, 356.11);
            ms1 = tdDrawObject('door-rim', ms, f, x, y, x1 + 0.9, y1, z1, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            ms1 = tdDrawObject('door-rim', ms, f, x, y, x1 - 0.9, y1, z1, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            break;

            case 'floor-ceil':
            ms = new THREE.Object3D();
            if(type === 'high-ceil') {
                if(hasSquare(x, y, 'wall') > -1 || hasSquare(x, y, 'door') > -1 || hasSquare(x, y, 'door-open') > -1 || hasSquare(x, y, 'pillar') > -1) {
                    ms1 = tdDrawObject('wall', ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'wall', 'wall', rnd, 129.22);
                    ms1 = tdDrawObject(type, ms, f, x, y, x1, y1, z1 - 1, x2, y2, z2, 0, 'ceil', mat, rnd, 51.33);
                } else {
                    ms1 = tdDrawObject(type, ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'ceil', mat, rnd, 51.33);
                }
            } else {
                if(hasSquare(x, y, 'pit') === -1) {
                    ms1 = tdDrawObject(type, ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'floor', mat, rnd, 51.33);
                }
                if(hasSquare(x, y, 'high-ceil') === -1 && hasSquare(x, y, 'pit-ceil') === -1) {
                    ms1 = tdDrawObject(type, ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'ceil', mat, rnd, 51.33);
                }
                if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 391.87, 6) === 2) {
                    if(rand(f, x, y, 197.76, 2) === 0) {
                        ms1 = tdDrawObject('box4', ms, f, x, y, x1 - 0.05, y1 - 0.05, z1, 0.101, 0.101, z2, 0, 'box4', 'wall-wood-x01', rnd, 444.01);
                    }
                } else if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 391.87, 6) === 3) {
                    ms1 = tdDrawObject('box', ms, f, x, y, x1, y1 - 0.05, z1 + 0.95, x2, 0.101, 0.05, 0, 'box', 'wall-wood-y01', rnd, 444.01);
                    ms1 = tdDrawObject('box', ms, f, x, y, x1, y1 + 0.95, z1 + 0.95, x2, 0.101, 0.05, 0, 'box', 'wall-wood-y01', rnd, 444.01);
                    ms1 = tdDrawObject('box', ms, f, x, y, x1 - 0.05, y1 + 0.05, z1 + 0.95, 0.101, y2 - 0.1, 0.05, 0, 'box', 'wall-wood-y01', rnd, 444.01);
                    ms1 = tdDrawObject('box', ms, f, x, y, x1 + 0.95, y1 + 0.05, z1 + 0.95, 0.101, y2 - 0.1, 0.05, 0, 'box', 'wall-wood-y01', rnd, 444.01);
                }
            }
            break;

            case 'high-ceil':
            ms1 = tdDrawObject(type, msg, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'floor-ceil', 'floor', rnd, 51.33);
            break;

            case 'floor-deco':
            ms = new THREE.Object3D();
            ms1 = tdDrawObject(type, ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'floor', mat, rnd, 707.89);
            break;

            case 'ceil-deco':
            ms = new THREE.Object3D();
            ms1 = tdDrawObject(type, ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'ceil', mat, rnd, 110.07);
            break;

            case 'stairs-up':
            ms = new THREE.Object3D();
            ms1 = tdDrawObject(type, ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'stairs', mat, rnd, 129.22);
            ms1 = tdDrawObject(type, ms, f, x, y, x1, y1 - 1, z1 + 1, x2, y2, z2, 0, 'stairs', mat, rnd, 129.22);
            ms1 = tdDrawObject('floor', ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'floor', 'floor', rnd, 51.33);
            ms1 = tdDrawObject('box4', ms, f, x + dir[d1].x, y + dir[d1].y, x1 - 1, y1, z1 + 1, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            ms1 = tdDrawObject('box4', ms, f, x + dir[d3].x, y + dir[d3].y, x1 + 1, y1, z1 + 1, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            ms1 = tdDrawObject('box4', ms, f, x + dir[d2].x, y + dir[d2].y, x1, y1 + 1, z1 + 1, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            ms1 = tdDrawObject('box4', ms, f, x + dir[d1].x, y + dir[d1].y, x1 - 1, y1 - 1, z1 + 1, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            ms1 = tdDrawObject('box4', ms, f, x + dir[d3].x, y + dir[d3].y, x1 + 1, y1 - 1, z1 + 1, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            ms1 = tdDrawObject('ramp-reversed', ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'ramp-reversed', 'floor', rnd, 51.33);
            break;

            case 'stairs-down':
            ms = new THREE.Object3D();
            ms1 = tdDrawObject(type, ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'stairs', mat, rnd, 129.22);
            ms1 = tdDrawObject('floor', ms, f, x, y, x1, y1, z1 + 1, x2, y2, z2, 0, 'ceil', 'floor', rnd, 51.33);
            ms1 = tdDrawObject('box4', ms, f, x + dir[d1].x, y + dir[d1].y, x1 - 1, y1, z1, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            ms1 = tdDrawObject('box4', ms, f, x + dir[d3].x, y + dir[d3].y, x1 + 1, y1, z1, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            ms1 = tdDrawObject('box4', ms, f, x + dir[d1].x, y + dir[d1].y, x1 - 1, y1 + 1, z1, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            ms1 = tdDrawObject('box4', ms, f, x + dir[d3].x, y + dir[d3].y, x1 + 1, y1 + 1, z1, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            ms1 = tdDrawObject('ramp-reversed', ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'ramp-reversed', 'floor', rnd, 51.33);
            ms1 = tdDrawObject('ramp-reversed', ms, f, x, y, x1, y1 + 1, z1 - 1, x2, y2, z2, 0, 'ramp-reversed', 'floor', rnd, 51.33);
            break;

            case 'light':
            /*ms = new THREE.Object3D();
            ms1 = new THREE.SpotLight(0xf0e0d0);
            ms1.position.set( x1, z1, y1 );
            ms1.angle = Math.PI / 2;
            ms1.exponent = 5;
            ms1.shadowCameraNear = 0.5;
            ms1.shadowCameraFar = tdViewSize;
            ms1.shadowCameraFov = 35;
            ms1.intensity = 5;
            ms1.distance = 12;
            ms1.shadowDarkness = 0.75;
            ms1.shadowMapWidth = 256;
            ms1.shadowMapHeight = 256;
            ms1.castShadow = true;
            ms1.target = ms;
            ms.add(ms1);*/
            break;
        }
        if(ms !== null) {
            if(mat !== '' && (typeof tdMaterial[mat].shadow === "undefined" || tdMaterial[mat].shadow)) {
                ms.castShadow = true;
                if(typeof tdMaterial[mat].transparent !== "undefined" && tdMaterial[mat].transparent && typeof ms.material !== "undefined" && typeof i !== "undefined") {
                    if(typeof tdMaterial['shade-' + mat] === "undefined") {
                        tdMaterial['shade-' + mat] = {};
                        tdMaterial['shade-' + mat].material = [];
                        var uniforms = { texture: { type: "t", value: null } };
                        tdMaterial['shade-' + mat].material[i] = new THREE.ShaderMaterial( { uniforms: uniforms, vertexShader: vertexShader, fragmentShader: fragmentShader } );
                    }
                    ms.customDepthMaterial = tdMaterial['shade-' + mat].material[i];
                }
            }
            ms.receiveShadow = true;
            ms.name = metatype;
            msg.add(ms);
            return ms;
        }
    }
    return null;
}

function tdLoadObjectOBJ(type, msg, x1, y1, z1, x2, y2, z2, d, type2, mat, i) {
    var loader = new THREE.OBJLoader();
    loader.load('models/' + type + '.obj', function(obj) {
        m = tdCreateMaterial(mat, i);
        if(m !== null) {
            obj.traverse(function(ms) {
                if(ms instanceof THREE.Mesh) {
                    ms.material = m;
                    ms.castShadow = true;
                    ms.position.x = (x1 + (x2 / 2)) * 1.5 - 0.75;
                    ms.position.y = (z1 + (z2 / 2)) * 1.0 - 0.5;
                    ms.position.z = (y1 + (y2 / 2)) * 1.5 - 1.5;
                    ms.scale.set(0.015 * x2, 0.01 * z2, 0.015 * y2);
                }
            });
        }
        msg.add(obj);
    });
}

function tdHideWallFaces(ms, x, y) {
    if(ms !== null) {

    }
}

function tdMoveCamera(d) {
    if(playerCanMove(d) === 1) {
        keysFrozen = true;
        var xo = dir[d].x;
        var yo = dir[d].y;
        var zo1 = 0.5;
        var zo2 = 0.5;
        if(hasSquare(origin.x, origin.y, 'stairs-up') > -1) {
            zo1 = 1.2;
        }
        if(hasSquare(origin.x + xo, origin.y + yo, 'stairs-up') > -1) {
            zo2 = 1.2;
        }
        if(hasSquare(origin.x, origin.y, 'stairs-down') > -1) {
            zo1 = 0.2;
        }
        if(hasSquare(origin.x + xo, origin.y + yo, 'stairs-down') > -1) {
            zo2 = 0.2;
        }
        origin.x = origin.x + xo;
        origin.y = origin.y + yo;
        initField(d);
        drawAll();
        tdDrawAll();
        new TWEEN.Tween( {x: origin.x - origin.xt - xo, y: origin.y - origin.yt - yo, z: zo1} )
            .to( {x: origin.x - origin.xt, y: origin.y - origin.yt, z: zo2}, 400)
            .easing(TWEEN.Easing.Sinusoidal.InOut)
            .onUpdate(function() {
                camera.position.x = this.x * 1.5;
                camera.position.z = this.y * 1.5;
                camera.position.y = this.z * 1.0;
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
            camera.position.x = (origin.x - origin.xt) * 1.5;
            camera.position.z = (origin.y - origin.yt) * 1.5;
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

function tdClearWorld() {
    var obj, i;
    for (i = scene.children.length - 1; i >= 0 ; i--) {
        obj = scene.children[i];
        tdClearObject(obj);
    }
    for (var x = 0; x < mapSize; x++) {
        for (var y = 0; y < mapSize; y++) {
            delete map[x][y].mesh;
        }
    }
}

function tdClearObject(obj, p) {
    if (typeof obj !== "undefined" && obj !== null && obj !== ambientLight && obj !== light && obj !== plane && obj !== plane2 && obj !== camera) {
        if(typeof p === "undefined") {
            p = scene;
        }
        if (obj.children !== undefined) {
            for (var c = obj.children.length - 1; c >= 0; c--) {
                tdClearObject(obj.children[c], obj);
            }
        }
        p.remove(obj);
    }
}

function tdUpdateCamera() {
    var rx = camera.rotation.x;
    var rz = camera.rotation.z;
    camera.position.x = (origin.x - origin.xt) * 1.5;
    camera.position.z = (origin.y - origin.yt) * 1.5;
    camera.rotation.y = -Math.PI / 2 * origin.d;
    if(hasSquare(origin.x, origin.y, 'stairs-up') > -1) {
        camera.position.y = 1.2;
    } else if(hasSquare(origin.x, origin.y, 'stairs-down') > -1) {
        camera.position.y = 0.2;
    } else {
        camera.position.y = 0.5;
    }
    camera.translateZ(1.25);
    light.position.set(0, 0, 0.4);

    var coo = 'F: ' + origin.f + ', X: ' + origin.x + ', Y: ' + origin.y + ', D: ' + origin.d
    $('body input#coordinates').val(coo);
    setCookie('player-coordinates', coo, 365);
}

function tdRotateInWorld(axis, object, radians) {
    switch(axis) {
        case 'x': var a = new THREE.Vector3(1, 0, 0); break;
        case 'y': var a = new THREE.Vector3(0, 1, 0); break;
        case 'z': var a = new THREE.Vector3(0, 0, 1); break;
    }
    var rotWorldMatrix = new THREE.Matrix4();
    rotWorldMatrix.makeRotationAxis(a.normalize(), radians);
    rotWorldMatrix.multiply(object.matrix);
    object.matrix = rotWorldMatrix;
    object.rotation.setFromRotationMatrix(object.matrix);
}