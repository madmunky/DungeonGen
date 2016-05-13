var controls, effect, controlsEnabled;
var raycaster;
var timer = 0;
var imagePath = 'images/';
var imagePathQuality = 'high/'
var tdScreenWidth = 800; 
var tdScreenHeight = 600;
var vertexShader = document.getElementById( 'vertexShaderDepth' ).textContent;
var fragmentShader = document.getElementById( 'fragmentShaderDepth' ).textContent;

/*var cubeMapPath = imagePath + 'cubemap/';
var cubeMapUrls = [
    cubeMapPath + '1.jpg', cubeMapPath + '2.jpg',
    cubeMapPath + '3.jpg', cubeMapPath + '4.jpg',
    cubeMapPath + '5.jpg', cubeMapPath + '6.jpg'
];*/

var aryImageLoader = [];

var scene, renderer, camera;
var yawObject, pitchObject, rollObject;
var light, ambientLight;
var plane, plane2;
var tdSprite = {
    'icon-forward': {
        image: 'icon-forward',
        position: 'relative',
        scale: 0.2
    },
    'icon-backward': {
        image: 'icon-backward',
        offsetY: 0.2,
        position: 'relative',
        scale: 0.2
    },
    'icon-use': {
        image: 'icon-use',
        offsetY: -0.2,
        position: 'relative',
        visible: wallAction,
        scale: 0.2
    },
    'crosshair': {
        image: 'crosshair',
        position: 'fixed',
        scale: 0.1
    }
};
var tdObject = [];
var tdTexture = {};
var tdGeometry = [];
var tdMaterial = {
    'wall': {
        image: 'wall',
        normal: true,
        specular: true,
        len: 29
    },
    'wall-x20': {
        image: 'wall',
        normal: true,
        specular: true,
        scale: {x: 2, y: 1},
        len: 29
    },
    'wall-x01': {
        image: 'wall',
        normal: true,
        specular: true,
        scale: {x: 0.1, y: 1},
        translate: {x: 0.45, y: 0},
        len: 29
    },
    'wall-x05': {
        image: 'wall',
        normal: true,
        specular: true,
        scale: {x: 0.5, y: 1},
        len: 29
    },
    'wall-y01': {
        image: 'wall',
        normal: true,
        specular: true,
        scale: {x: 1, y: 0.1},
        len: 29
    },
    'wall-x05-y02': {
        image: 'wall',
        normal: true,
        specular: true,
        scale: {x: 0.5, y: 0.2},
        len: 29
    },
    'wall-x20-y02': {
        image: 'wall',
        normal: true,
        specular: true,
        scale: {x: 2.0, y: 0.2},
        len: 29
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
        len: 17
    },
    'wall-wood-x05': {
        image: 'wall-wood',
        transparent: true,
        normal: true,
        specular: true,
        scale: {x: 0.5, y: 1},
        len: 17
    },
    'wall-wood-x01': {
        image: 'wall-wood',
        transparent: true,
        normal: true,
        specular: true,
        scale: {x: 0.1, y: 1},
        translate: {x: 0.95, y: 0},
        len: 17
    },
    'wall-wood-y01': {
        image: 'wall-wood',
        transparent: true,
        normal: true,
        specular: true,
        scale: {x: 1, y: 0.1},
        len: 17
    },
    'door-wood-left': {
        image: 'wall-wood',
        transparent: true,
        normal: true,
        specular: true,
        scale: {x: 0.25, y: 1},
        len: 17
    },
    'door-wood-right': {
        image: 'wall-wood',
        transparent: true,
        normal: true,
        specular: true,
        scale: {x: 0.25, y: 1},
        translate: {x: 0.75, y: 0},
        len: 17
    },
    'door-wood-top': {
        image: 'wall-wood',
        transparent: true,
        normal: true,
        specular: true,
        scale: {x: 0.5, y: 0.25},
        translate: {x: 0.25, y: 0.75},
        len: 17
    },
    'door': {
        image: 'door',
        transparent: true,
        normal: true,
        specular: true,
        len: 16
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
        len: 9
    },
    'obstacle': {
        image: 'obstacle',
        normal: true,
        len: 2
    },
    'test': {
        color: '#FF00FF',
        len: 1
    }
};
var tdMeshFix = {
    'obstacle': [{ //statue roman
        x1: 0.44,    y1: 0.55,   z1: 0.0,
        x2: 0.25,    y2: 0.25,    z2: 0.9
    }, { //rock
        x1: 0.2,    y1: 0.2,   z1: 0.0,
        x2: 0.6,    y2: 0.6,    z2: 0.6
    }]
}

function tdAnimate() {
    requestAnimationFrame(tdAnimate);
    if(comp.device.toLowerCase() !== '') {
        controls.update();
    }
    tdRender();
}
function tdRender() {
    for (var ob in tdMaterial) {
        if(typeof tdMaterial[ob].animate !== 'undefined' && typeof tdTexture[ob] !== "undefined") {
            var at = tdMaterial[ob].animate.split(',');
            if(timer % Math.floor(60.0 / at[1]) === 0) {
                for(var i = 0; i < tdTexture[ob].length; i++) {
                    if(at[0] === 'random') {
                        tdTexture[ob][i].offset.x = Math.random();
                        tdTexture[ob][i].offset.y = Math.random();
                    } else if(at[0] === 'move-x') {
                        tdTexture[ob][i].offset.x = parseFloat(at[2]) * timer;
                    } else if(at[0] === 'move-y') {
                        tdTexture[ob][i].offset.y = parseFloat(at[2]) * timer;
                    }
                }
            }
        }
    }
    timer++;
    printDebug();
    TWEEN.update();
    if (controlsEnabled && !keysFrozen) {
        tdUpdateCamera(true);
    }
    if(stereo) {
        effect.render(scene, camera);
    } else {
        renderer.render(scene, camera);
    }
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
            side: THREE.FrontSide
        };
        tdMaterial[ob].material[i] = new THREE.MeshPhongMaterial(parameters);

        if(typeof tdTexture[ob] === "undefined") {
            tdTexture[ob] = [];
        }
        if(typeof tdTexture[ob][i] === "undefined") {
            var loader = new THREE.ImageLoader( loadingManager );
            loader.load(imagePath + imagePathQuality + img + '.jpg',
                function(image) {
                    tdUpdateTexture(image, ob, i);
                },
                function(xhr) {},
                function(xhr) {
                    loadingCountError++;
                    loader.load(imagePath + imagePathQuality + img + '.png',
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
        if(comp.device.toLowerCase() === '') {
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
                if(comp.device.toLowerCase() === '') {
                    tdTexture[ob][i].anisotropy = 16;
                }
                tdTexture[ob][i].needsUpdate = true;
                tdMaterial[ob].material[i].map = tdTexture[ob][i];
                tdMaterial[ob].material[i].needsUpdate = true;
                /*if(comp.device.toLowerCase() === '') {
                    if(tdMaterial[ob].material[i].map.image.src.endsWith('.png') && typeof tdMaterial['shade-' + ob] !== "undefined" && typeof tdMaterial['shade-' + ob].material !== "undefined" && typeof tdMaterial['shade-' + ob].material[i] !== "undefined") {
                        var uniforms = { texture: { type: "t", value: tdTexture[ob][i] } };
                        tdMaterial['shade-' + ob].material[i].uniforms = uniforms;
                        tdMaterial['shade-' + ob].material[i].needsUpdate = true;
                    }
                }*/
            }, 1);
        })(image, ob, i);
    }
}

function tdUpdateNormal(image, ob, i) {
    if(comp.device.toLowerCase() === '') {
        if(typeof tdMaterial[ob].material[i] !== "undefined") {
            (function(image, ob, i) {
                setTimeout(function() {
                    tdTexture['norm-' + ob][i] = new THREE.Texture();
                    tdTexture['norm-' + ob][i].image = image;
                    if(typeof tdMaterial[ob].scale !== "undefined") {
                        tdTexture['norm-' + ob][i].repeat.set(tdMaterial[ob].scale.x, tdMaterial[ob].scale.y);
                    }
                    if(typeof tdMaterial[ob].translate !== "undefined") {
                        tdTexture['norm-' + ob][i].offset.x = tdMaterial[ob].translate.x;
                        tdTexture['norm-' + ob][i].offset.y = tdMaterial[ob].translate.y;
                    }
                    tdTexture['norm-' + ob][i].wrapT = tdTexture['norm-' + ob][i].wrapS = THREE.RepeatWrapping;
                    tdTexture['norm-' + ob][i].anisotropy = 16;
                    tdTexture['norm-' + ob][i].needsUpdate = true;
                    tdMaterial[ob].material[i].normalMap = tdTexture['norm-' + ob][i];
                    tdMaterial[ob].material[i].needsUpdate = true;
                }, 1);
            })(image, ob, i);
        }
    }
}

function tdUpdateSpecular(image, ob, i) {
    if(comp.device.toLowerCase() === '') {
        if(typeof tdMaterial[ob].material[i] !== "undefined") {
            (function(image, ob, i) {
                setTimeout(function() {
                    tdTexture['spec-' + ob][i] = new THREE.Texture();
                    tdTexture['spec-' + ob][i].image = image;
                    if(typeof tdMaterial[ob].scale !== "undefined") {
                        tdTexture['spec-' + ob][i].repeat.set(tdMaterial[ob].scale.x, tdMaterial[ob].scale.y);
                    }
                    if(typeof tdMaterial[ob].translate !== "undefined") {
                        tdTexture['spec-' + ob][i].offset.x = tdMaterial[ob].translate.x;
                        tdTexture['spec-' + ob][i].offset.y = tdMaterial[ob].translate.y;
                    }
                    tdTexture['spec-' + ob][i].wrapT = tdTexture['spec-' + ob][i].wrapS = THREE.RepeatWrapping;
                    tdTexture['spec-' + ob][i].anisotropy = 16;
                    tdTexture['spec-' + ob][i].needsUpdate = true;
                    tdMaterial[ob].material[i].specularMap = tdTexture['spec-' + ob][i];
                    tdMaterial[ob].material[i].specular = new THREE.Color(0x302820);
                    tdMaterial[ob].material[i].shininess = 20;
                    tdMaterial[ob].material[i].needsUpdate = true;
                }, 1);
            })(image, ob, i);
        }
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
    if(comp.device.toLowerCase() === '') {
        checkPointerLock();
    }

    var canvas = document.getElementById('view');
    //canvas.width  = window.innerWidth - viewSize * squareSize - 10;
    //canvas.height = window.innerHeight - 70;
    
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true});
    //renderer.shadow.mapSize.debug = true;
    renderer.setPixelRatio( window.devicePixelRatio );
    //renderer.setViewport(0, 0, canvas.width, canvas.height);
    renderer.setClearColor(0x000000, 1.0);
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    if(comp.device.toLowerCase() === '') {
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    //renderer.setSize( canvas.width, canvas.height );

    //reflectionCube = THREE.ImageUtils.loadTextureCube(cubeMapUrls);
    //reflectionCube.format = THREE.RGBFormat;

    camera = new THREE.PerspectiveCamera( 35, canvas.width / canvas.height, 0.75, tdViewSize );
    scene = new THREE.Scene();
    if(comp.device.toLowerCase() === '') {
        controls = new THREE.PointerLockControls(camera);
        //scene.add(controls.getObject());
    } else {
        controls = new THREE.DeviceOrientationControls(camera);
        controlsEnabled = true;
    }
    scene.fog = new THREE.Fog(0x000000, 1, tdViewSize);
    scene.add(camera);
    //if(stereo) {
        effect = new THREE.StereoEffect(renderer);
        //effect.setSize(window.innerWidth, window.innerHeight);
    //}
    raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );

    window.addEventListener('resize', function() {
        tdReloadView();
    });
    if(comp.device.toLowerCase() !== '') {
        imagePathQuality = 'low/'

        window.addEventListener('deviceorientation', function(e) {
            tdUpdateCamera(true);
            //origin.d = Math.round(camera.rotation.y / (-Math.PI / 2) + 4) % 4;
            //camera.rotation.y = -Math.PI / 2 * origin.d;
        });
    }

    //SPRITES
    for(s in tdSprite) {
        spr = new THREE.TextureLoader().load(imagePath + 'sprite/' + tdSprite[s].image + '.png');
        var mat = new THREE.SpriteMaterial( { map: spr, color: 0xffffff, depthWrite: false, depthTest: false, opacity: 0.0 } );
        tdSprite[s].mesh = new THREE.Sprite(mat);
        if(typeof tdSprite[s].scale !== "undefined") {
            tdSprite[s].mesh.scale.set(tdSprite[s].scale, tdSprite[s].scale, tdSprite[s].scale);
        }
        tdSprite[s].mesh.position.z = -1;
        camera.add(tdSprite[s].mesh);
    }
}

function tdReloadView() {
    var canvas = document.getElementById('view');
    canvas.width  = window.innerWidth - viewSize * squareSize - 10;
    canvas.height = window.innerHeight - 70;
    renderer.setViewport(0, 0, canvas.width, canvas.height);
    renderer.setSize( canvas.width, canvas.height );
    camera.fov = 35;
    camera.near = 0.75;
    tdBackStep = tdSquareSize.x * 0.75;
    light.shadow.camera.fov = 35;
    light.shadow.camera.near = 1.5;
    for(s in tdSprite) {
        tdSprite[s].mesh.material.opacity = 0;
    }
    if(stereo) {
        effect.setSize(window.innerWidth, window.innerHeight);
        camera.fov = 90;
        camera.near = 0.01;
        tdBackStep = 0;
        light.shadow.camera.fov = 90;
        light.shadow.camera.near = 0.01;
    }
    camera.aspect = canvas.width / canvas.height;
    camera.updateProjectionMatrix();
}

function tdCreateLight() {
    ambientLight = new THREE.AmbientLight(0x302820, 0.5);
    light = new THREE.SpotLight(0xf0e0d0);
    light.intensity = 3;
    light.distance = tdViewSize;
    //light.angle = 90 * Math.PI / 180;
    light.castShadow = true;
    light.shadow.camera.near = 1.2;//tdSquareSize.x;
    light.shadow.camera.far = tdViewSize;
    light.shadow.camera.fov = 35;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    //light.shadow.camera.visible = true;

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
    var ms1 = null;
    var ms2 = null;
    var ms3 = null;
    var msg = new THREE.Object3D();
    msg.name = 'F' + origin.f + ',X' + x + ',Y' + y;
    msg.position.x = (x - origin.xt) * tdSquareSize.x;
    msg.position.y = 0;
    msg.position.z = (y - origin.yt) * tdSquareSize.x;

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
            case 'obstacle': x1 = 0, y1 = 0, z1 = 0, x2 = 1, y2 = 1, z2 = 1; type = 'obstacle'; mat = 'obstacle'; rnd = 100; seed = 129.22; break;
            case 'door': x1 = 0, y1 = 0.45, z1 = 0, x2 = 1, y2 = 0.1, z2 = 1; type = 'door'; mat = 'door'; rnd = 100; break;
            case 'door-open': x1 = 0, y1 = 0.45, z1 = 0, x2 = 1, y2 = 0.1, z2 = 1; type = 'door-open'; mat = 'door'; rnd = 100; break;
            case 'teleport': x1 = 0, y1 = 0, z1 = 0, x2 = 1, y2 = 1, z2 = 1; type = 'box4'; mat = 'teleport'; rnd = 100; seed = 515.78; break;
            case 'pit': x1 = 0, y1 = 0, z1 = -1, x2 = 1, y2 = 1, z2 = 1; type = 'pit'; mat = 'floor'; rnd = 100; seed = 51.33; break;
            case 'pit-ceil': x1 = 0, y1 = 0, z1 = 1, x2 = 1, y2 = 1, z2 = 1; type = 'pit'; mat = 'floor'; rnd = 100; seed = 51.33; break;
            case 'stairs-up': x1 = 0, y1 = 0, z1 = 0, x2 = 1, y2 = 1, z2 = 1; type = 'stairs-up'; mat = 'wall'; rnd = 100; break;
            case 'stairs-down': x1 = 0, y1 = 0, z1 = -1, x2 = 1, y2 = 1, z2 = 1; type = 'stairs-down'; mat = 'wall'; rnd = 100; break;
            case 'wall-switch': x1 = 0, y1 = 1.001, z1 = 0, x2 = 1, y2 = 1, z2 = 1; type = 'wall-deco'; mat = 'wall-switch'; seed = 123.43; break;
            case 'wall-switch-off': x1 = 0, y1 = 1.001, z1 = 0, x2 = 1, y2 = 1, z2 = 1; type = 'wall-deco'; mat = 'wall-switch-off'; seed = 123.43; break;
            case 'wall-deco': x1 = 0, y1 = 1.001, z1 = 0, x2 = 1, y2 = 1, z2 = 1; type = 'wall-deco'; mat = 'wall-deco'; seed = 860.97; break;
            case 'wall-deco-high': x1 = 0, y1 = 1.001, z1 = 1, x2 = 1, y2 = 1, z2 = 1; type = 'wall-deco'; mat = 'wall-deco'; seed = 443.13; break;
            case 'floor-deco': x1 = 0, y1 = 0, z1 = 0.001, x2 = 1, y2 = 1, z2 = 1; type = 'floor-deco'; mat = 'floor-deco'; break;
            //case 'light': x1 = 0, y1 = 0, z1 = 1.9, x2 = 1, y2 = 1, z2 = 1; type = 'light'; mat = ''; rnd = 100; seed = 821.95; break;
            default: break;
        }
        var d = parseInt(getSquareDirections(x, y).substring(o, o + 1));
        ms = tdDrawObject(type, msg, origin.f, x, y, x1, y1, z1, x2, y2, z2, d, type, mat, rnd, seed);
        if(ms !== null) {
            tdRotateInWorld('y', ms, (-(d + 2) * 90) * Math.PI / 180);
        }
        if(o === 0) {
            if(getSquareFeature(x, y, 'double') === 'ceil') {
                ms1 = tdDrawObject('floor-ceil-double', msg, origin.f, x, y, 0, 0, 1, 1, 1, 1, 0, 'floor-ceil', 'floor', 100);
                if(ms1 !== null) {
                    tdRotateInWorld('y', ms1, (-(d + 2) * 90) * Math.PI / 180);
                }
            } else if(getSquareFeature(x, y, 'double') === 'wall') {
                ms2 = tdDrawObject('wall', msg, origin.f, x, y, 0, 0, 1, 1, 1, 1, 0, 'wall', 'wall', 100, 129.22);
                if(ms2 !== null) {
                    tdRotateInWorld('y', ms2, (-(d + 2) * 90) * Math.PI / 180);
                }
            }
            if(getSquareFeature(x, y, 'triple') === 'wall') {
                ms3 = tdDrawObject('wall', msg, origin.f, x, y, 0, 0, 2, 1, 1, 1, 0, 'wall', 'wall', 100, 129.22);
                if(ms3 !== null) {
                    tdRotateInWorld('y', ms3, (-(d + 2) * 90) * Math.PI / 180);
                }
            }
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
                ms.scale.set(tdSquareSize.x, tdSquareSize.y, tdSquareSize.x);
                ms.rotation.y = (-(d + 2) * 90) * Math.PI / 180;
                ms.position.x = (x1 + (x2 / 2)) * tdSquareSize.x - tdSquareSize.x * 0.5;
                ms.position.y = (z1 + (z2 / 2)) * tdSquareSize.y;
                ms.position.z = (y1 + (y2 / 2)) * tdSquareSize.x - tdSquareSize.x * 0.5;
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
                ms.scale.set(tdSquareSize.x, tdSquareSize.y, tdSquareSize.x);
                ms.rotation.y = (-(d + 2) * 90) * Math.PI / 180;
                ms.position.x = (x1 + (x2 / 2)) * tdSquareSize.x - tdSquareSize.x * 0.5;
                ms.position.y = (z1 + (z2 / 2)) * tdSquareSize.y;
                ms.position.z = (y1 + (y2 / 2)) * tdSquareSize.x - tdSquareSize.x * 0.5;
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
                ms.scale.set(tdSquareSize.x, tdSquareSize.x, tdSquareSize.y);
                ms.position.set((x1 + (x2 / 2)) * tdSquareSize.x - tdSquareSize.x * 0.5, (z1 + (z2 / 2)) * tdSquareSize.y - tdSquareSize.y * 0.5, (y1 + (y2 / 2)) * tdSquareSize.x - tdSquareSize.x * 0.5);
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
                ms.scale.set(tdSquareSize.x, tdSquareSize.x, tdSquareSize.y);
                ms.position.set((x1 + (x2 / 2)) * tdSquareSize.x - tdSquareSize.x * 0.5, (z1 + (z2 / 2)) * tdSquareSize.y + tdSquareSize.y * 0.5, (y1 + (y2 / 2)) * tdSquareSize.x - tdSquareSize.x * 0.5);
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
                ms.scale.set(tdSquareSize.x, tdSquareSize.y, tdSquareSize.y);
                ms.position.set((x1 + (x2 / 2)) * tdSquareSize.x - tdSquareSize.x * 0.5, (z1 + (z2 / 2)) * tdSquareSize.y, 0);//(0, 0.5, 0);
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
                ms.scale.set(tdSquareSize.x, Math.sqr(tdSquareSize.x * tdSquareSize.x + tdSquareSize.y * tdSquareSize.y), tdSquareSize.y);
                ms.position.set((x1 + (x2 / 2)) * tdSquareSize.x - tdSquareSize.x * 0.5, (z1 + (z2 / 2)) * tdSquareSize.y + tdSquareSize.y, (y1 + (y2 / 2)) * tdSquareSize.x - tdSquareSize.x * 0.5);
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
                ms.scale.set(tdSquareSize.x, tdSquareSize.y, tdSquareSize.x);
                ms.position.set((x1 + (x2 / 2)) * tdSquareSize.x - tdSquareSize.x * 0.5, (z1 + (z2 / 2)) * tdSquareSize.y, (y1 + (y2 / 2)) * tdSquareSize.x - tdSquareSize.x * 0.5);
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
                ms.scale.set(tdSquareSize.x, tdSquareSize.y, tdSquareSize.x);
                ms.position.set((x1 + (x2 / 2)) * tdSquareSize.x - tdSquareSize.x * 0.5, (z1 + (z2 / 2)) * tdSquareSize.y, (y1 + (y2 / 2)) * tdSquareSize.x - tdSquareSize.x * 0.5);
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
                ms.scale.set(tdSquareSize.x, tdSquareSize.y, tdSquareSize.x);
                ms.position.set((x1 + (x2 / 2)) * tdSquareSize.x - tdSquareSize.x * 0.5, (z1 + (z2 / 2)) * tdSquareSize.y, (y1 + (y2 / 2)) * tdSquareSize.x - tdSquareSize.x * 0.5);
                ms.rotation.z = 90 * Math.PI / 180;
            }
            break;



            case 'wall':
            ms = new THREE.Object3D();
            ms1 = tdDrawObject(type, ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'box4', mat, rnd, 129.22);
            tdHideWallFaces(ms1, x, y);
            if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 391.87, 10) === 0) {
                ms1 = tdDrawObject(type, ms, f, x, y, x1 - 0.05, y1 - 0.05, z1, 0.101, 0.101, z2, 0, 'cylinder', 'wall-wood-x05', rnd, 444.01);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 - 0.05, y1 + 0.95, z1, 0.100, 0.100, z2, 0, 'cylinder', 'wall-wood-x05', rnd, 444.01);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 + 0.95, y1 - 0.05, z1, 0.099, 0.099, z2, 0, 'cylinder', 'wall-wood-x05', rnd, 444.01);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 + 0.95, y1 + 0.95, z1, 0.098, 0.098, z2, 0, 'cylinder', 'wall-wood-x05', rnd, 444.01);
            } else if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 391.87, 10) === 1) {
                ms1 = tdDrawObject(type, ms, f, x, y, x1 + 0.45, y1 - 0.05, z1 + 0.25, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rz', 'wall-wood-x05', rnd, 444.01);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 + 0.95, y1 + 0.45, z1 + 0.25, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rx', 'wall-wood-x05', rnd, 444.01);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 + 0.45, y1 + 0.95, z1 + 0.25, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rz', 'wall-wood-x05', rnd, 444.01);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 - 0.05, y1 + 0.45, z1 + 0.25, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rx', 'wall-wood-x05', rnd, 444.01);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 + 0.45, y1 - 0.05, z1 - 0.75, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rz', 'wall-wood-x05', rnd, 444.01);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 + 0.95, y1 + 0.45, z1 - 0.75, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rx', 'wall-wood-x05', rnd, 444.01);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 + 0.45, y1 + 0.95, z1 - 0.75, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rz', 'wall-wood-x05', rnd, 444.01);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 - 0.05, y1 + 0.45, z1 - 0.75, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rx', 'wall-wood-x05', rnd, 444.01);
            } else if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 391.87, 10) === 2) {
                if(rand(f, x, y, 197.76, 2) === 0) {
                    ms1 = tdDrawObject('box4', ms, f, x, y, x1 - 0.05, y1 - 0.05, z1, 0.101, 0.101, z2, 0, 'box4', 'wall-wood-x01', rnd, 444.01);
                }
            } else if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 391.87, 10) === 4) {
                ms1 = tdDrawObject(type, ms, f, x, y, x1 - 0.05, y1 - 0.05, z1, 0.101, 0.101, z2, 0, 'cylinder', 'wall-x05', rnd, 129.22);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 - 0.05, y1 + 0.95, z1, 0.100, 0.100, z2, 0, 'cylinder', 'wall-x05', rnd, 129.22);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 + 0.95, y1 - 0.05, z1, 0.099, 0.099, z2, 0, 'cylinder', 'wall-x05', rnd, 129.22);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 + 0.95, y1 + 0.95, z1, 0.098, 0.098, z2, 0, 'cylinder', 'wall-x05', rnd, 129.22);
            } else if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 391.87, 10) === 5) {
                ms1 = tdDrawObject(type, ms, f, x, y, x1 + 0.45, y1 - 0.05, z1 + 0.25, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rz', 'wall-x05', rnd, 129.22);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 + 0.95, y1 + 0.45, z1 + 0.25, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rx', 'wall-x05', rnd, 129.22);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 + 0.45, y1 + 0.95, z1 + 0.25, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rz', 'wall-x05', rnd, 129.22);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 - 0.05, y1 + 0.45, z1 + 0.25, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rx', 'wall-x05', rnd, 129.22);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 + 0.45, y1 - 0.05, z1 - 0.75, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rz', 'wall-x05', rnd, 129.22);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 + 0.95, y1 + 0.45, z1 - 0.75, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rx', 'wall-x05', rnd, 129.22);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 + 0.45, y1 + 0.95, z1 - 0.75, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rz', 'wall-x05', rnd, 129.22);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 - 0.05, y1 + 0.45, z1 - 0.75, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rx', 'wall-x05', rnd, 129.22);
            }
            break;

            case 'wall-wood':
            ms = new THREE.Object3D();
            ms1 = tdDrawObject(type, ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'box4', mat, rnd, seed);
            if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 391.87, 10) === 0) {
                ms1 = tdDrawObject(type, ms, f, x, y, -0.05, 0.95, z1, 0.1, 0.1, z2, 0, 'cylinder', 'wall-wood-x05', rnd, seed);
                ms1 = tdDrawObject(type, ms, f, x, y, 0.95, 0.95, z1, 0.1, 0.1, z2, 0, 'cylinder', 'wall-wood-x05', rnd, seed);
            } else if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 391.87, 10) === 1) {
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
            if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 391.87, 10) === 0) {
                ms1 = tdDrawObject(type, ms, f, x, y, -0.05, 0.95, z1, 0.1, 0.1, z2, 0, 'cylinder', 'wall-wood-x05', rnd, seed);
                ms1 = tdDrawObject(type, ms, f, x, y, 0.95, 0.95, z1, 0.1, 0.1, z2, 0, 'cylinder', 'wall-wood-x05', rnd, seed);
            } else if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 391.87, 10) === 1) {
                ms1 = tdDrawObject(type, ms, f, x, y, 0.45, 0.95, z1 + 0.25, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rz', 'wall-wood-x05', rnd, seed);
                ms1 = tdDrawObject(type, ms, f, x, y, 0.45, 0.95, z1 - 0.75, 0.1, 0.1, z2 * 1.5, 0, 'cylinder-rz', 'wall-wood-x05', rnd, seed);
            }
            break;

            case 'door-wood-open':
            ms = new THREE.Object3D();
            ms1 = tdDrawObject(type, ms, f, x, y, x1, y1, z1, 0.25, y2, z2, 0, 'box4', 'door-wood-left', rnd, seed);
            ms1 = tdDrawObject(type, ms, f, x, y, x1 + 0.75, y1, z1, 0.25, y2, z2, 0, 'box4', 'door-wood-right', rnd, seed);
            ms1 = tdDrawObject(type, ms, f, x, y, x1 + 0.25, y1, 0.75, 0.5, y2, 0.25, 0, 'box', 'door-wood-top', rnd, seed);
            if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 391.87, 10) === 0) {
                ms1 = tdDrawObject(type, ms, f, x, y, -0.05, 0.95, z1, 0.1, 0.1, z2, 0, 'cylinder', 'wall-wood-x05', rnd, seed);
                ms1 = tdDrawObject(type, ms, f, x, y, 0.95, 0.95, z1, 0.1, 0.1, z2, 0, 'cylinder', 'wall-wood-x05', rnd, seed);
            } else if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 391.87, 10) === 1) {
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
            var i = rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor((x + rnd / 2) / rnd), Math.floor((y + rnd / 2) / rnd), seed, tdMaterial[mat].len);
            ms = new THREE.Object3D();
            var z3 = 0;
            if(z1 === 1) {
                if(getSquareFeature(x, y, 'double') === 'ceil') {
                    z3 = 1;
                } else {
                    tdLoadObjectOBJ(type, ms, x1, y1, z1 + 1, x2, y2, z2, 0, mat, i);
                }
            }
            tdLoadObjectOBJ(type, ms, x1, y1, z1 + z3, x2, y2, z2, 0, mat, i);
            break;

            case 'stairs':
            var i = rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), seed, tdMaterial[mat].len);
            ms = new THREE.Object3D();
            tdLoadObjectOBJ(metatype, ms, x1, y1, z1, x2, y2, z2, 0, mat, i);
            //for(var s = 0; s < 10; s++) {
            //    ms1 = tdDrawObject(type, ms, f, x, y, x1, y1 + s * 0.1, z1 - s * 0.1 + 0.9, x2, y2 * 0.1, z2 * 0.1, 0, 'box', 'wall-y01', rnd, 129.22);
            //}
            break;

            case 'pillar2':
            ms = new THREE.Object3D();
            if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 529.52, 5) === 0) {
                ms1 = tdDrawObject(type, ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'cylinder', mat, rnd, 129.22);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 - 0.1, y1 - 0.1, z1, x2 + 0.2, y2 + 0.2, 0.2, 0, 'cylinder', 'wall-x20-y02', rnd, 129.22);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 - 0.1, y1 - 0.1, z1 + 0.8, x2 + 0.2, y2 + 0.2, 0.2, 0, 'cylinder', 'wall-x20-y02', rnd, 129.22);
            } else if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 529.52, 5) === 1) {
                ms1 = tdDrawObject(type, ms, f, x, y, x1 - 0.1, y1 - 0.1, z1, x2 + 0.2, y2 + 0.2, z2, 0, 'cylinder', 'wall-x20', rnd, 129.22);
            } else if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 529.52, 5) === 2) {
                ms1 = tdDrawObject(type, ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'box4', 'wall-x05', rnd, 129.22);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 - 0.1, y1 - 0.1, z1, x2 + 0.2, y2 + 0.2, 0.2, 0, 'box', 'wall-x05-y02', rnd, 129.22);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 - 0.1, y1 - 0.1, z1 + 0.8, x2 + 0.2, y2 + 0.2, 0.2, 0, 'box', 'wall-x05-y02', rnd, 129.22);
            } else if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 529.52, 5) === 3) {
                var i = rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), seed, tdMaterial[mat].len);
                ms = new THREE.Object3D();
                tdLoadObjectOBJ('pillar', ms, x1, y1, z1, x2, y2, z2, 0, mat, i);
            } else {
                ms1 = tdDrawObject(type, ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'cylinder', mat, rnd, 129.22);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 - 0.1, y1 + 0.15, z1 + 0.6, x2 + 0.2, 0, 0.4, 0, 'cylinder', 'wall-x20', rnd, 129.22);
                ms1 = tdDrawObject(type, ms, f, x, y, x1 + 0.15, y1 - 0.1, z1, 0, y2 + 0.2, 0.4, 0, 'cylinder', 'wall-x20', rnd, 129.22);
            }
            break;

            case 'pillar':
            ms = new THREE.Object3D();
            ms1 = tdDrawObject(type, ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'pillar2', mat, rnd, 129.22);
            if(getSquareFeature(x, y, 'double') === 'ceil') {
                ms1 = tdDrawObject(type, ms, f, x, y, x1, y1, z1 + 1, x2, y2, z2, 0, 'pillar2', mat, rnd, 129.22);
                ms1.rotation.y = 90 * Math.PI / 180;
            }
            break;

            case 'obstacle':
            var i = rand(f, x, y, seed, tdMaterial[mat].len);
            ms = new THREE.Object3D();
            tdLoadObjectOBJ(metatype, ms, x1, y1, z1, x2, y2, z2, 0, mat, i, true);
            break;

            case 'door':
            ms = new THREE.Object3D();
            ms1 = tdDrawObject(type, ms, f, x, y, x1 + x2 * 0.1, y1 + (y2 * 0.4), z1, x2 * 0.8, y2 * 0.2, z2, 0, 'box', mat, rnd, 356.11);
            ms1 = tdDrawObject('door-rim', ms, f, x, y, x1 + 0.9, y1, z1, 0.1, y2, z2, 0, 'box4', 'wall-x01', rnd, 129.22);
            ms1 = tdDrawObject('door-rim', ms, f, x, y, x1, y1, z1, 0.1, y2, z2, 0, 'box4', 'wall-x01', rnd, 129.22);
            break;

            case 'door-open':
            ms = new THREE.Object3D();
            ms1 = tdDrawObject(type, ms, f, x, y, x1 + x2 * 0.1, y1 + (y2 * 0.4), z1 + z2 * 0.8, x2 * 0.8, y2 * 0.2, z2, 0, 'box', mat, rnd, 356.11);
            ms1 = tdDrawObject('door-rim', ms, f, x, y, x1 + 0.9, y1, z1, 0.1, y2, z2, 0, 'box4', 'wall-x01', rnd, 129.22);
            ms1 = tdDrawObject('door-rim', ms, f, x, y, x1, y1, z1, 0.1, y2, z2, 0, 'box4', 'wall-x01', rnd, 129.22);
            break;

            case 'floor-ceil':
            ms = new THREE.Object3D();
            if(type === 'floor-ceil-double') {
                if(hasSquare(x, y, 'wall') > -1) {
                    ms1 = tdDrawObject(type, ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'floor', mat, rnd, 51.33);
                }
                if(hasSquare(x, y, 'pit-ceil') === -1) {
                    ms1 = tdDrawObject(type, ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'ceil', mat, rnd, 51.33);
                }
            } else {
                if(hasSquare(x, y, 'pit') === -1) {
                    ms1 = tdDrawObject(type, ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'floor', mat, rnd, 51.33);
                }
                if(getSquareFeature(x, y, 'double') !== 'ceil' && getSquareFeature(x, y, 'double') !== 'none' && hasSquare(x, y, 'pit-ceil') === -1) {
                    ms1 = tdDrawObject(type, ms, f, x, y, x1, y1, z1 - 0.001, x2, y2, z2, 0, 'ceil', mat, rnd, 51.33);
                }
            }
            if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 391.87, 10) === 2) {
                if(rand(f, x, y, 197.76, 2) === 0) {
                    ms1 = tdDrawObject('box4', ms, f, x, y, x1 - 0.05, y1 - 0.05, z1, 0.101, 0.101, z2, 0, 'box4', 'wall-wood-x01', rnd, 444.01);
                }
            } else if(rand(Math.floor(f / Math.ceil(rnd / 10)), Math.floor(x / rnd), Math.floor(y / rnd), 391.87, 10) === 3) {
                ms1 = tdDrawObject('box', ms, f, x, y, x1, y1 - 0.05, z1 + 0.95, x2, 0.101, 0.05, 0, 'box', 'wall-wood-y01', rnd, 444.01);
                ms1 = tdDrawObject('box', ms, f, x, y, x1, y1 + 0.95, z1 + 0.95, x2, 0.101, 0.05, 0, 'box', 'wall-wood-y01', rnd, 444.01);
                ms1 = tdDrawObject('box', ms, f, x, y, x1 - 0.05, y1 + 0.05, z1 + 0.95, 0.101, y2 - 0.1, 0.05, 0, 'box', 'wall-wood-y01', rnd, 444.01);
                ms1 = tdDrawObject('box', ms, f, x, y, x1 + 0.95, y1 + 0.05, z1 + 0.95, 0.101, y2 - 0.1, 0.05, 0, 'box', 'wall-wood-y01', rnd, 444.01);
            }
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
            ms1 = tdDrawObject(type, ms, f, x, y, x1, y1 - 2, z1 + 2, x2, y2, z2, 0, 'stairs', mat, rnd, 129.22);
            //ms1 = tdDrawObject('floor', ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'floor', 'floor', rnd, 51.33);
            //ms1 = tdDrawObject('box4', ms, f, x + dir[d1].x, y + dir[d1].y, x1 - 1, y1, z1 + 1, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            //ms1 = tdDrawObject('box4', ms, f, x + dir[d3].x, y + dir[d3].y, x1 + 1, y1, z1 + 1, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            //ms1 = tdDrawObject('box4', ms, f, x + dir[d1].x, y + dir[d1].y, x1 - 1, y1 - 1, z1 + 1, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            //ms1 = tdDrawObject('box4', ms, f, x + dir[d3].x, y + dir[d3].y, x1 + 1, y1 - 1, z1 + 1, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            //ms1 = tdDrawObject('ramp-reversed', ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'ramp-reversed', 'floor', rnd, 51.33);
            break;

            case 'stairs-down':
            ms = new THREE.Object3D();
            ms1 = tdDrawObject(type, ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'stairs', mat, rnd, 129.22);
            ms1 = tdDrawObject(type, ms, f, x, y, x1, y1 + 1, z1 - 1, x2, y2, z2, 0, 'stairs', mat, rnd, 129.22);
            ms1 = tdDrawObject(type, ms, f, x, y, x1, y1 + 2, z1 - 2, x2, y2, z2, 0, 'stairs', mat, rnd, 129.22);
            ms1 = tdDrawObject(type, ms, f, x, y, x1, y1 + 3, z1 - 3, x2, y2, z2, 0, 'stairs', mat, rnd, 129.22);
            if(getSquareFeature(x, y, 'double') === 'wall') {
                ms1 = tdDrawObject('floor', ms, f, x, y, x1, y1, z1 + 1, x2, y2, z2, 0, 'ceil', 'floor', rnd, 51.33);
            }
            ms1 = tdDrawObject('box4', ms, f, x + dir[d1].x, y + dir[d1].y, x1 - 1, y1, z1, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            ms1 = tdDrawObject('box4', ms, f, x + dir[d3].x, y + dir[d3].y, x1 + 1, y1, z1, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            ms1 = tdDrawObject('box4', ms, f, x + dir[d1].x, y + dir[d1].y, x1 - 1, y1 + 1, z1, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            ms1 = tdDrawObject('box4', ms, f, x + dir[d3].x, y + dir[d3].y, x1 + 1, y1 + 1, z1, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            ms1 = tdDrawObject('box4', ms, f, x + dir[d1].x, y + dir[d1].y, x1 - 1, y1 + 2, z1, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            ms1 = tdDrawObject('box4', ms, f, x + dir[d3].x, y + dir[d3].y, x1 + 1, y1 + 2, z1, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            ms1 = tdDrawObject('box4', ms, f, x + dir[d1].x, y + dir[d1].y, x1 - 1, y1 + 1, z1 - 1, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            ms1 = tdDrawObject('box4', ms, f, x + dir[d3].x, y + dir[d3].y, x1 + 1, y1 + 1, z1 - 1, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            ms1 = tdDrawObject('box4', ms, f, x + dir[d1].x, y + dir[d1].y, x1 - 1, y1 + 2, z1 - 1, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            ms1 = tdDrawObject('box4', ms, f, x + dir[d3].x, y + dir[d3].y, x1 + 1, y1 + 2, z1 - 1, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            ms1 = tdDrawObject('box4', ms, f, x + dir[d1].x, y + dir[d1].y, x1 - 1, y1 + 2, z1 - 2, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            ms1 = tdDrawObject('box4', ms, f, x + dir[d3].x, y + dir[d3].y, x1 + 1, y1 + 2, z1 - 2, x2, y2, z2, 0, 'box4', 'wall', rnd, 129.22);
            //ms1 = tdDrawObject('ramp-reversed', ms, f, x, y, x1, y1, z1, x2, y2, z2, 0, 'ramp-reversed', 'floor', rnd, 51.33);
            //ms1 = tdDrawObject('ramp-reversed', ms, f, x, y, x1, y1 + 1, z1 - 1, x2, y2, z2, 0, 'ramp-reversed', 'floor', rnd, 51.33);
            break;

            case 'light':
            ms = new THREE.Object3D();
            ms.position.set( x1, 0, y1 );
            ms1 = new THREE.SpotLight(0xf0e0d0);
            ms1.position.set( 0, z1, 0 );
            ms1.angle = Math.PI / 3;
            ms1.shadow.camera.near = 0.85;
            ms1.shadow.camera.far = 3;
            ms1.shadow.camera.fov = 170;
            ms1.intensity = 10;
            ms1.distance = 0;
            ms1.decay = 1;
            //ms1.shadowDarkness = 0.5;
            ms1.shadow.mapSize.width = 1024;
            ms1.shadow.mapSize.height = 1024;
            //ms1.onlyShadow = true;
            ms1.shadow.camera.visible = true;
            ms1.castShadow = true;
            ms1.target = ms;
            ms.add(ms1);
            break;
        }
        if(ms !== null) {
            if(mat !== '' && (typeof tdMaterial[mat].shadow === "undefined" || tdMaterial[mat].shadow)) {
                ms.castShadow = true;
                /*if(comp.device.toLowerCase() === '') {
                    if(typeof tdMaterial[mat].transparent !== "undefined" && tdMaterial[mat].transparent && typeof ms.material !== "undefined" && typeof i !== "undefined") {
                        if(typeof tdMaterial['shade-' + mat] === "undefined") {
                            tdMaterial['shade-' + mat] = {};
                            tdMaterial['shade-' + mat].material = [];
                            var uniforms = { texture: { type: "t", value: null } };
                            tdMaterial['shade-' + mat].material[i] = new THREE.ShaderMaterial( { uniforms: uniforms, vertexShader: vertexShader, fragmentShader: fragmentShader } );
                        }
                        ms.customDepthMaterial = tdMaterial['shade-' + mat].material[i];
                    }
                }*/
            }
            ms.receiveShadow = true;
            ms.name = metatype;
            msg.add(ms);
            return ms;
        }
    }
    return null;
}

function tdLoadObjectOBJ(type, msg, x1, y1, z1, x2, y2, z2, d, mat, i, i2) {
    var file = type;
    if(typeof i2 !== "undefined" && i2) {
        file = file + '-' + i;
        var mf = tdMeshFix[type][i];
        if(typeof mf !== "undefined") {
            x1 = mf.x1;
            y1 = mf.y1;
            z1 = mf.z1;
            x2 = mf.x2;
            y2 = mf.y2;
            z2 = mf.z2;
        }
    }
    if(typeof tdObject[file] === "undefined" || tdObject[file] === null) {
        var loader = new THREE.OBJLoader();
        loader.load('models/' + file + '.obj', function(obj) {
            m = tdCreateMaterial(mat, i);
            tdFixObject(obj, x1, y1, z1, x2, y2, z2);
            tdObject[file] = obj.clone();
            if(typeof obj !== "undefined") {
                obj.traverse(function(ms) {
                    if(ms instanceof THREE.Mesh) {
                        if(m !== null) {
                            ms.material = m;
                        }
                        ms.receiveShadow = true;
                        ms.castShadow = true;
                    }
                });
                msg.add(obj);
            }
        });
    } else {
        m = tdCreateMaterial(mat, i);
        var obj = tdObject[file].clone();
        tdFixObject(obj, x1, y1, z1, x2, y2, z2);
        if(typeof obj !== "undefined") {
            obj.traverse(function(ms) {
                if(ms instanceof THREE.Mesh) {
                    if(m !== null) {
                        ms.material = m;
                    }
                    ms.receiveShadow = true;
                    ms.castShadow = true;
                }
            });
            msg.add(obj);
        }
    }
}

function tdFixObject(obj, x1, y1, z1, x2, y2, z2) {
    var xMin = 1000000.0;
    var yMin = 1000000.0;
    var zMin = 1000000.0;
    var xMax = -1000000.0;
    var yMax = -1000000.0;
    var zMax = -1000000.0;
    obj.traverse(function(ms) {
        if(ms instanceof THREE.Mesh) {
            var pos = ms.geometry.attributes.position.array;
            if(typeof ms.geometry !== "undefined" && typeof pos !== "undefined") {
                for(j = 0; j < pos.length; j += 3) {
                    if(xMin > pos[j]) {
                        xMin = pos[j];
                    }
                    if(yMin > pos[j+1]) {
                        yMin = pos[j+1];
                    }
                    if(zMin > pos[j+2]) {
                        zMin = pos[j+2];
                    }
                    if(xMax < pos[j]) {
                        xMax = pos[j];
                    }
                    if(yMax < pos[j+1]) {
                        yMax = pos[j+1];
                    }
                    if(zMax < pos[j+2]) {
                        zMax = pos[j+2];
                    }
                }
            }
        }
    });
    var xScl = xMax - xMin;
    var yScl = yMax - yMin;
    var zScl = zMax - zMin;
    var xOff = (xMin + xScl * 0.5) / xScl;
    var yOff = (yMin + yScl * 0.5) / yScl;
    var zOff = (zMin + zScl * 0.5) / zScl;
    obj.position.x = (x1 + x2 / 2 - xOff) * tdSquareSize.x - tdSquareSize.x * 0.5;
    obj.position.y = (z1 - yOff) * tdSquareSize.y + tdSquareSize.y * 0.5;
    obj.position.z = (y1 + y2 / 2 - zOff) * tdSquareSize.x - tdSquareSize.x * 0.5;
    obj.scale.set((tdSquareSize.x * x2) / xScl, (tdSquareSize.y * z2) / yScl, (tdSquareSize.x * y2) / zScl);
}

function tdHideWallFaces(ms, x, y) {
    if(ms !== null) {

    }
}

function tdMoveCameraXY(x, y, z, abs) {
    if(typeof x === "undefined") {
        tdMoveCameraXY(-origin.d * (Math.PI / 2), undefined, undefined, true);
    } else {
        if(typeof abs !== "undefined" && abs) {
            yawObject.rotation.y = x;
        } else {
            yawObject.rotation.y -= x;
        }
        while(yawObject.rotation.y < 0.0) {
            yawObject.rotation.y += 4.0 * (Math.PI / 2);
        }
        while(yawObject.rotation.y >= 4.0 * (Math.PI / 2)) {
            yawObject.rotation.y -= 4.0 * (Math.PI / 2);
        }
    }
    if(typeof y !== "undefined") {
        if(typeof abs !== "undefined" && abs) {
            pitchObject.rotation.x = y;
        } else {
            pitchObject.rotation.x -= y;
        }
        if(pitchObject.rotation.x < -1.0) {
            pitchObject.rotation.x = -1.0;
        }
        if(pitchObject.rotation.x > 1.0) {
            pitchObject.rotation.x = 1.0;
        }
    }
    if(typeof z !== "undefined") {
        if(typeof abs !== "undefined" && abs) {
            rollObject.rotation.z = z;
        } else {
            rollObject.rotation.z -= z;
        }
    }

    camera.rotation.z = 0;
    camera.rotation.y = 0;
    camera.rotation.x = 0;
    camera.rotateY(yawObject.rotation.y);
    camera.rotateX(pitchObject.rotation.x);
    camera.rotateZ(rollObject.rotation.z);
}

function tdMoveCamera(d) {
    if(playerCanMove(d) === 1) {
        keysFrozen = true;
        var xo = dir[d].x;
        var yo = dir[d].y;
        var zo1 = tdPlayerHeight;
        var zo2 = tdPlayerHeight;
        if(hasSquare(origin.x, origin.y, 'stairs-up') > -1) {
            zo1 += tdSquareSize.y * 0.5;
        }
        if(hasSquare(origin.x + xo, origin.y + yo, 'stairs-up') > -1) {
            zo2 += tdSquareSize.y * 0.5;
        }
        if(hasSquare(origin.x, origin.y, 'stairs-down') > -1) {
            zo1 -= tdSquareSize.y * 0.5;
        }
        if(hasSquare(origin.x + xo, origin.y + yo, 'stairs-down') > -1) {
            zo2 -= tdSquareSize.y * 0.5;
        }
        origin.x = origin.x + xo;
        origin.y = origin.y + yo;
        (function(d) {
            setTimeout(function() {
                initField(d);
                drawAll();
                tdDrawAll();
            }, 1);
        })(d);
        new TWEEN.Tween( {x: origin.x - origin.xt - xo, y: origin.y - origin.yt - yo, z: zo1} )
            .to( {x: origin.x - origin.xt, y: origin.y - origin.yt, z: zo2}, 400)
            .easing(TWEEN.Easing.Sinusoidal.InOut)
            .onUpdate(function() {
                camera.position.x = this.x * tdSquareSize.x;
                camera.position.y = this.z;
                camera.position.z = this.y * tdSquareSize.x;
                camera.translateZ(tdBackStep);
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
    var do1 = origin.d; //-Math.PI / 2 * 
    var d1 = d; //-Math.PI / 2 * 
    //origin.d = (origin.d + d + 4) % 4;
    new TWEEN.Tween( {d: yawObject.rotation.y} ) //do1
        .to( {d: yawObject.rotation.y - d1 * (Math.PI / 2)}, 400) //do1 + d1
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .onUpdate(function() {
            camera.position.x = (origin.x - origin.xt) * tdSquareSize.x;
            var zo1 = tdPlayerHeight;
            if(hasSquare(origin.x, origin.y, 'stairs-up') > -1) {
                zo1 += tdSquareSize.y * 0.5;
            }
            if(hasSquare(origin.x, origin.y, 'stairs-down') > -1) {
                zo1 -= tdSquareSize.y * 0.5;
            }
            camera.position.y = zo1;
            camera.position.z = (origin.y - origin.yt) * tdSquareSize.x;
            tdMoveCameraXY(this.d, undefined, undefined, true); //yawObject.rotation.y + this.d * (Math.PI / 2)
            camera.translateZ(tdBackStep);
        })
        .onComplete(function() {
            keysFrozen = false;
            origin.d = (origin.d + d + 4) % 4;
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

//doc = device orientation control
function tdUpdateCamera(doc) {
    //var rx = camera.rotation.x;
    //var rz = camera.rotation.z;
    camera.position.x = (origin.x - origin.xt) * tdSquareSize.x;
    camera.position.y = tdPlayerHeight;
    camera.position.z = (origin.y - origin.yt) * tdSquareSize.x;
    //if(typeof doc === "undefined" || !doc) {
        //camera.rotation.y = -Math.PI / 2 * origin.d;
    //}
    if(hasSquare(origin.x, origin.y, 'stairs-up') > -1) {
        camera.position.y += tdSquareSize.y * 0.5;
    } else if(hasSquare(origin.x, origin.y, 'stairs-down') > -1) {
        camera.position.y -= tdSquareSize.y * 0.5;
    //} else {
    //    camera.position.y = tdSquareSize.y * 0.5;
    }
    camera.translateZ(tdBackStep);
    light.position.set(0, 0, tdSquareSize.x * 0.3);

    var dirc = controls.getDirection();
    var od = origin.d;
    origin.d = Math.round(dirc.y / (-Math.PI / 2)) % 4;
    while(origin.d < 0) {
        origin.d += 4;
    }
    if(od !== origin.d) { //rotation changed
        floorAction(origin.x, origin.y, origin.d);
        //tdUpdateCamera();
    }

    //SPRITES
    if(stereo) {
        for(s in tdSprite) {
            var vis = 2;
            if(typeof tdSprite[s].visible !== "undefined") {
                vis = tdSprite[s].visible(origin.x, origin.y, origin.d, true);
            }
            if(vis > 0) {
                if(tdSprite[s].position === 'relative') {
                    tdSprite[s].mesh.position.set(0, 0, 0);
                    tdSprite[s].mesh.rotation.set(0, 0, 0);
                    tdSprite[s].mesh.rotateY(-dirc.y + (-Math.PI / 2) * (4 + origin.d));
                    tdSprite[s].mesh.rotateX(-dirc.x);
                    tdSprite[s].mesh.translateZ(-1);
                    if(typeof tdSprite[s].offsetY !== "undefined") {
                        tdSprite[s].mesh.translateY(-tdSprite[s].offsetY);
                    }
                    if(typeof tdSprite[s].offsetX !== "undefined") {
                        tdSprite[s].mesh.translateX(tdSprite[s].offsetX);
                    }
                    var op = tdGetSpriteOpacity(s);
                    if(op > 0.4) {
                        var sc = tdSprite[s].mesh.scale.x;
                        if(tdSprite[s].mesh.material.opacity < 1.2) {
                            tdSprite[s].mesh.material.opacity += 0.05;
                        }
                        if(sc > tdSprite[s].scale * 1.2) {
                            //if(typeof tdSprite[s].scale !== "undefined") {
                            //    tdSprite[s].mesh.scale.set(tdSprite[s].scale, tdSprite[s].scale, tdSprite[s].scale);
                            //} else {
                            //    tdSprite[s].mesh.scale.set(1, 1, 1);
                            //}
                            //tdSprite[s].mesh.material.opacity = 0.0;
                            //buttonEvents();
                        } else {
                            tdSprite[s].mesh.scale.set(sc * 1.01, sc * 1.01, sc * 1.01);
                        }
                    } else {
                        if(typeof tdSprite[s].scale !== "undefined") {
                            tdSprite[s].mesh.scale.set(tdSprite[s].scale, tdSprite[s].scale, tdSprite[s].scale);
                        } else {
                            tdSprite[s].mesh.scale.set(1, 1, 1);
                        }
                        tdSprite[s].mesh.material.opacity = op;
                    }
                } else {
                    tdSprite[s].mesh.material.opacity = 1.0;
                }
            } else {
                tdSprite[s].mesh.material.opacity = 0.0;
            }
        }
    }

    var coo = 'F: ' + origin.f + ', X: ' + origin.x + ', Y: ' + origin.y + ', D: ' + origin.d;
    $('body input#coordinates').val(coo);
    setCookie('player-coordinates', coo, 365);
}

function tdGetSpriteOpacity(id) {
    var canvas = document.getElementById('view');
    var cx = canvas.width;
    var cy = canvas.height;
    var vector = new THREE.Vector3();
    vector.setFromMatrixPosition( tdSprite[id].mesh.matrixWorld );
    xy = tdCreateVector(vector.x, vector.y, vector.z, camera, cx, cy);
    var op = Math.abs(xy.x - 0.5 * cx) / (cx / 24.0);
    op = op + Math.abs(xy.y - 0.5 * cy) / (cy / 12.0);
    if(op > 1.0) op = 1.0;
    if(op < 0.0) op = 0.0;
    op = 1.0 - op;
    return op;
}

function tdCreateVector(x, y, z, camera, width, height) {
    var p = new THREE.Vector3(x, y, z);
    var vector = p.project(camera);

    vector.x = (vector.x + 1) / 2 * width;
    vector.y = -(vector.y - 1) / 2 * height;

    return vector;
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

function checkPointerLock() {
    var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

    if ( havePointerLock ) {

        var element = document.body;

        var pointerlockchange = function ( event ) {

            if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {
                controls.enabled = true;
                controlsEnabled = true;
            } else {

                controls.enabled = false;
                controlsEnabled = false;
            }

        };

        var pointerlockerror = function ( event ) {

        };

        // Hook pointer lock state change events
        document.addEventListener( 'pointerlockchange', pointerlockchange, false );
        document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
        document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

        document.addEventListener( 'pointerlockerror', pointerlockerror, false );
        document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
        document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

        document.getElementById('view').addEventListener( 'click', function ( event ) {

            // Ask the browser to lock the pointer
            element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

            if ( /Firefox/i.test( navigator.userAgent ) ) {

                var fullscreenchange = function ( event ) {

                    if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {

                        document.removeEventListener( 'fullscreenchange', fullscreenchange );
                        document.removeEventListener( 'mozfullscreenchange', fullscreenchange );

                        element.requestPointerLock();
                    }

                };

                document.addEventListener( 'fullscreenchange', fullscreenchange, false );
                document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );

                element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;

                element.requestFullscreen();

            } else {

                element.requestPointerLock();

            }

        }, false );
    }
}