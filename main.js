// TEMPLE RUN: CURSED FOREST - AAA ENGINE v2
const G={playing:false,speed:0,base:1.5,score:0,coins:0,combo:0,bestCombo:0,dist:0};
const LANES=[-6,0,6]; let targetLane=1,isJump=false,isSlide=false,jumpV=0,handOn=false;
let playerModel=null,mixer=null,runAction=null,idleAction=null,clock=new THREE.Clock();

// SCENE
const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0x030508,0.022);
scene.background=new THREE.Color(0x020304);

// CAMERA
const cam=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,0.1,1000);
cam.position.set(0,5,-10); cam.lookAt(0,2,10);

// RENDERER (AAA settings)
const ren=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
ren.setSize(innerWidth,innerHeight);
ren.setPixelRatio(Math.min(devicePixelRatio,2));
ren.shadowMap.enabled=true;
ren.shadowMap.type=THREE.PCFSoftShadowMap;
ren.outputEncoding=THREE.sRGBEncoding;
ren.toneMapping=THREE.ACESFilmicToneMapping;
ren.toneMappingExposure=0.8;
ren.physicallyCorrectLights=true;
document.getElementById('game-container').appendChild(ren.domElement);

// LIGHTS
scene.add(new THREE.AmbientLight(0x1a1a2e,3));
const torch = new THREE.SpotLight(0xffaa44, 28, 120, Math.PI / 6.5, 1.0, 1.2);
torch.position.set(0, 3.5, 1.5);
torch.castShadow = true;
torch.shadow.mapSize.set(1024, 1024);
torch.shadow.bias = -0.001;
const torchTarget = new THREE.Object3D();
torchTarget.position.set(0, 0, 30);
torch.target = torchTarget;
const moon=new THREE.DirectionalLight(0x4466ff,2);
moon.position.set(-20,40,-30);moon.castShadow=true;
moon.shadow.mapSize.set(2048,2048);scene.add(moon);
const chaseLight=new THREE.PointLight(0xff0000,5,50);
chaseLight.position.set(0,5,40);scene.add(chaseLight);
// TORCHES WITH ACTIVE DYNAMIC FLAME PARTICLES & STANDS
const torchGroups = [];
const flameMaterial = new THREE.MeshBasicMaterial({
    color: 0xff4500,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
});
const flameGeo = new THREE.SphereGeometry(0.18, 4, 4);

for (let i = 0; i < 12; i++) {
    const tg = new THREE.Group();
    const x = i % 2 === 0 ? -10.8 : 10.8;
    const z = -i * 70;
    tg.position.set(x, 0.5, z);
    
    // Wood Torch stand cylinder mesh
    const stand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 4, 6),
        new THREE.MeshStandardMaterial({color: 0x1f1107, roughness: 0.9})
    );
    stand.position.y = 2;
    tg.add(stand);
    
    // Point light inside flame center
    const pl = new THREE.PointLight(0xff7700, 5, 30);
    pl.position.y = 4.2;
    tg.add(pl);
    
    // Active flame sparks particle meshes
    const parts = [];
    for (let p = 0; p < 6; p++) {
        const mesh = new THREE.Mesh(flameGeo, flameMaterial);
        mesh.position.set(
            (Math.random() - 0.5) * 0.15,
            4.2 + Math.random() * 0.8,
            (Math.random() - 0.5) * 0.15
        );
        mesh.userData.speedY = 0.05 + Math.random() * 0.05;
        mesh.userData.baseY = 4.2;
        tg.add(mesh);
        parts.push(mesh);
    }
    tg.userData = { pl, parts, baseIntensity: 5 };
    
    scene.add(tg);
    torchGroups.push(tg);
}

// Backlit Spooky Moon Aura Ring
const moonAuraGeo = new THREE.RingGeometry(8, 12, 32);
const moonAuraMat = new THREE.MeshBasicMaterial({
    color: 0x4466ff,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
});
const moonAura = new THREE.Mesh(moonAuraGeo, moonAuraMat);
moonAura.position.set(-20, 40, -120);
moonAura.lookAt(0, 0, 0);
scene.add(moonAura);

// GROUND & TEXTURES
const textureLoader = new THREE.TextureLoader();
const groundTex = textureLoader.load('assets/ground_texture.png');
groundTex.wrapS = THREE.RepeatWrapping;
groundTex.wrapT = THREE.RepeatWrapping;
groundTex.repeat.set(2, 120);
groundTex.anisotropy = ren.capabilities.getMaxAnisotropy();

const forestTex = textureLoader.load('assets/ground_texture.png');
forestTex.wrapS = THREE.RepeatWrapping;
forestTex.wrapT = THREE.RepeatWrapping;
forestTex.repeat.set(30, 120);
forestTex.anisotropy = ren.capabilities.getMaxAnisotropy();

const gnd=new THREE.Mesh(new THREE.PlaneGeometry(300,1200),
    new THREE.MeshStandardMaterial({map:forestTex,color:0x331100,emissive:0xff2200,emissiveIntensity:0.35,roughness:0.95}));
gnd.rotation.x=-Math.PI/2;gnd.position.set(0, 0, 400);gnd.receiveShadow=true;scene.add(gnd);

// PATH
const pth=new THREE.Mesh(new THREE.PlaneGeometry(20,1200),
    new THREE.MeshStandardMaterial({map:groundTex,roughness:0.6,metalness:0.2}));
pth.rotation.x=-Math.PI/2;pth.position.set(0, 0.06, 400);pth.receiveShadow=true;scene.add(pth);

// Path edges (Glowing Red Cursed Runes)
const edgeMat=new THREE.MeshStandardMaterial({color:0xff0000,emissive:0xff0000,emissiveIntensity:1.5});
[-10,10].forEach(x=>{
    const e=new THREE.Mesh(new THREE.PlaneGeometry(0.3,1200),edgeMat);
    e.rotation.x=-Math.PI/2;e.position.set(x,0.08,400);scene.add(e);
});

// TREES
const trees=[];
function mkTree(x,z){
    const g=new THREE.Group();
    const tk=new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.9,8,6),
        new THREE.MeshStandardMaterial({color:0x1a0e08,roughness:0.9}));
    tk.position.y=4;tk.castShadow=true;g.add(tk);
    for(let i=0;i<3;i++){
        const s=3.5-i*0.9;
        const lv=new THREE.Mesh(new THREE.ConeGeometry(s,6,7),
            new THREE.MeshStandardMaterial({color:0x041a04+i*0x010100,roughness:0.8}));
        lv.position.y=10+i*3.5;lv.castShadow=true;g.add(lv);
    }
    g.position.set(x,0,z);scene.add(g);trees.push(g);
}
for(let i=0;i<10;i++){
    const s=Math.random()>0.5?1:-1;
    mkTree(s*(13+Math.random()*60),Math.random()*900);
}

// GOTHIC RUINED TEMPLE ARCHES (BACKGROUND ARCHITECTURE)
const arches = [];
const archMat = new THREE.MeshStandardMaterial({color: 0x2b2b2e, roughness: 0.95, metalness: 0.05});
function createArch(z) {
    const group = new THREE.Group();
    group.position.set(0, 0, z);
    
    // Left Pillar
    const pL = new THREE.Mesh(new THREE.BoxGeometry(1.6, 15, 1.6), archMat);
    pL.position.set(-11, 7.5, 0);
    pL.castShadow = true; pL.receiveShadow = true;
    group.add(pL);
    
    // Right Pillar
    const pR = new THREE.Mesh(new THREE.BoxGeometry(1.6, 15, 1.6), archMat);
    pR.position.set(11, 7.5, 0);
    pR.castShadow = true; pR.receiveShadow = true;
    group.add(pR);
    
    // Top Arch Beam spanning over the runway
    const beam = new THREE.Mesh(new THREE.BoxGeometry(24, 1.8, 1.8), archMat);
    beam.position.set(0, 15, 0);
    beam.castShadow = true; beam.receiveShadow = true;
    group.add(beam);
    
    scene.add(group);
    arches.push(group);
}
for (let i = 0; i < 6; i++) {
    createArch(-i * 150 - 100);
}

// Mossy Foreground Shrubs along path borders
const foregroundShrubs = [];
const shrubGeo = new THREE.DodecahedronGeometry(0.6, 1);
const shrubMat = new THREE.MeshStandardMaterial({color: 0x091e09, roughness: 0.95});
for (let i = 0; i < 15; i++) {
    const s = new THREE.Mesh(shrubGeo, shrubMat);
    const side = Math.random() > 0.5 ? 1 : -1;
    s.position.set(side * (10.5 + Math.random() * 2), 0.2, -i * 50);
    s.scale.set(1 + Math.random(), 0.5 + Math.random(), 1 + Math.random());
    s.castShadow = true; s.receiveShadow = true;
    scene.add(s);
    foregroundShrubs.push(s);
}

// OBSTACLES
const obs=[];
const obsMats=[
    new THREE.MeshStandardMaterial({map:groundTex,roughness:0.8,metalness:0.1}),
    new THREE.MeshStandardMaterial({map:groundTex,color:0x8b5a2b,roughness:0.9}),
    new THREE.MeshStandardMaterial({map:groundTex,color:0xff8888,roughness:0.6,emissive:0x441111,emissiveIntensity:0.6})
];
function mkObs(z){
    const type=Math.floor(Math.random()*3);
    const group=new THREE.Group();
    
    if(type===0){
        // Gnarled Tree Root Obstacle (Jump over!)
        const root1=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.7,5,8),obsMats[1]);
        root1.rotation.z=Math.PI/2;
        root1.position.set(0,0.5,0);
        root1.castShadow=true;root1.receiveShadow=true;
        group.add(root1);
        
        const root2=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.5,3,8),obsMats[1]);
        root2.rotation.set(0.3,0.5,Math.PI/4);
        root2.position.set(1.6,0.8,-0.5);
        root2.castShadow=true;root2.receiveShadow=true;
        group.add(root2);
    }
    else if(type===1){
        // Creepy Tree Branch Obstacle (Slide under!)
        const mainBranch=new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.5,6,8),obsMats[1]);
        mainBranch.rotation.z=Math.PI/2 - 0.2;
        mainBranch.position.set(0,4.2,0);
        mainBranch.castShadow=true;mainBranch.receiveShadow=true;
        group.add(mainBranch);
        
        const twig1=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.3,2,6),obsMats[1]);
        twig1.rotation.set(0.5,0,0.4);
        twig1.position.set(-1.8,3.2,0.5);
        twig1.castShadow=true;twig1.receiveShadow=true;
        group.add(twig1);

        const twig2=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.2,1.8,6),obsMats[1]);
        twig2.rotation.set(-0.3,0,-0.6);
        twig2.position.set(1.8,3.0,-0.4);
        twig2.castShadow=true;twig2.receiveShadow=true;
        group.add(twig2);
    }
    else{
        // Gnarled Tree Stump with Glowing Cursed Spikes (Lane Switch!)
        const stump=new THREE.Mesh(new THREE.CylinderGeometry(0.8,1.2,5,8),obsMats[2]);
        stump.position.set(0,2.5,0);
        stump.castShadow=true;stump.receiveShadow=true;
        group.add(stump);
        
        const branchOut1=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.4,3,6),obsMats[2]);
        branchOut1.rotation.set(0.8,0,1.2);
        branchOut1.position.set(1.2,3.5,0);
        branchOut1.castShadow=true;branchOut1.receiveShadow=true;
        group.add(branchOut1);

        const branchOut2=new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.35,2.5,6),obsMats[2]);
        branchOut2.rotation.set(-0.8,0.5,-1.2);
        branchOut2.position.set(-1.2,2.8,0);
        branchOut2.castShadow=true;branchOut2.receiveShadow=true;
        group.add(branchOut2);

        const fl=new THREE.PointLight(0xff4400,3,15);
        fl.position.set(0,3,0);
        group.add(fl);
    }
    group.userData={type,lane:Math.floor(Math.random()*3),nm:false};
    group.position.set(LANES[group.userData.lane],0,z);
    scene.add(group);obs.push(group);
}
for(let i=0;i<20;i++)mkObs(80+i*50+Math.random()*30);

// COINS
const coins=[];
const coinGeo=new THREE.TorusGeometry(0.6,0.2,8,16);
const coinMat=new THREE.MeshStandardMaterial({color:0xffd700,emissive:0x554400,metalness:0.9,roughness:0.2});
function mkCoin(z){
    const c=new THREE.Mesh(coinGeo,coinMat);
    c.userData.lane=Math.floor(Math.random()*3);
    c.position.set(LANES[c.userData.lane],3,z);scene.add(c);coins.push(c);
}
for(let i=0;i<30;i++)mkCoin(60+i*35+Math.random()*20);

// CHASE MONSTER
const monG=new THREE.Group();
const monBody=new THREE.Mesh(new THREE.SphereGeometry(3,12,12),
    new THREE.MeshStandardMaterial({color:0x220000,emissive:0x220000,emissiveIntensity:1,roughness:0.3}));
monBody.position.y=4;monG.add(monBody);
[[-1.2,5,2.5],[1.2,5,2.5]].forEach(p=>{
    const eye=new THREE.Mesh(new THREE.SphereGeometry(0.5,8,8),
        new THREE.MeshBasicMaterial({color:0xff0000}));
    eye.position.set(...p);monG.add(eye);
    const gl=new THREE.PointLight(0xff0000,2,12);gl.position.set(...p);monG.add(gl);
});
monG.position.set(0,0,-15);scene.add(monG);

// PARTICLES (Hot Blazing Lava Embers)
const pCnt=400;const pGeo=new THREE.BufferGeometry();
const pPos=new Float32Array(pCnt*3);
for(let i=0;i<pCnt;i++){pPos[i*3]=Math.random()*80-40;pPos[i*3+1]=Math.random()*25+1;pPos[i*3+2]=Math.random()*100;}
pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));
const parts=new THREE.Points(pGeo,new THREE.PointsMaterial({color:0xff3a00,size:0.25,transparent:true,opacity:0.65}));
scene.add(parts);

// LOAD REALISTIC CHARACTER
const gltfLoader=new THREE.GLTFLoader();
const playerGroup=new THREE.Group();
playerGroup.position.set(0,0,5);scene.add(playerGroup);
playerGroup.add(torch);
playerGroup.add(torchTarget);

// Placeholder while model loads
const phBody=new THREE.Mesh(THREE.CapsuleGeometry?new THREE.CapsuleGeometry(0.5,1.5,4,8):new THREE.CylinderGeometry(0.5,0.5,2.5,8),
    new THREE.MeshStandardMaterial({color:0xcc3333,roughness:0.6}));
phBody.position.y=2;phBody.castShadow=true;playerGroup.add(phBody);
const phHead=new THREE.Mesh(new THREE.SphereGeometry(0.45,8,8),
    new THREE.MeshStandardMaterial({color:0xddaa88,roughness:0.5}));
phHead.position.y=3.8;phHead.castShadow=true;playerGroup.add(phHead);

// Try loading Soldier.glb from Three.js examples
gltfLoader.load('https://threejs.org/examples/models/gltf/Soldier.glb',
    (gltf)=>{
        playerModel=gltf.scene;
        playerModel.scale.set(2.5,2.5,2.5);
        playerModel.rotation.y = Math.PI; // Face forward along the path
        playerModel.traverse(c=>{
            if(c.isMesh){
                c.castShadow=true;
                c.receiveShadow=true;
                if(c.material){
                    c.material.color.setHex(0xd2b48c); // Khaki adventurer explorer tint
                    c.material.roughness = 0.8;
                }
            }
        });
        playerGroup.remove(phBody);playerGroup.remove(phHead);
        playerGroup.add(playerModel);
        mixer=new THREE.AnimationMixer(playerModel);
        gltf.animations.forEach(clip=>{
            if(clip.name.toLowerCase().includes('run')||clip.name.toLowerCase().includes('walk')){
                runAction=mixer.clipAction(clip);runAction.play();
            } else if(clip.name.toLowerCase().includes('idle')){
                idleAction=mixer.clipAction(clip);
            }
        });
        if(!runAction&&gltf.animations.length>0){runAction=mixer.clipAction(gltf.animations[0]);runAction.play();}
        console.log('Character loaded:',gltf.animations.map(a=>a.name));
    },
    undefined,
    (err)=>{console.warn('Model load failed, using fallback character',err);}
);

// UI REFS
const scoreEl=document.getElementById('score'),coinsEl=document.getElementById('coins');
const comboEl=document.getElementById('combo-container'),comboTxt=document.getElementById('combo-text');
const speedBar=document.getElementById('speed-bar');
const gestInd=document.getElementById('gesture-indicator'),gestTxt=document.getElementById('gesture-text'),gestIcon=document.getElementById('gesture-icon');
const hud=document.getElementById('hud'),warnFlash=document.getElementById('warning-flash');
const nearMissEl=document.getElementById('near-miss');
const startScr=document.getElementById('start-screen'),goScr=document.getElementById('game-over-screen');
const startBtn=document.getElementById('start-btn'),restartBtn=document.getElementById('restart-btn');
const introOvr=document.getElementById('intro-overlay'),introTxt=document.getElementById('intro-text');
const loadScr=document.getElementById('loading-screen'),webcamSt=document.getElementById('webcam-status');
const fScore=document.getElementById('final-score'),fCoins=document.getElementById('final-coins');
const fDist=document.getElementById('final-distance'),fCombo=document.getElementById('final-best-combo');

// HAND TRACKING
const vidEl=document.getElementById('input_video');
const canvEl=document.getElementById('output_canvas');
const cCtx=canvEl.getContext('2d');
function onResults(r){
    cCtx.save();cCtx.clearRect(0,0,canvEl.width,canvEl.height);
    cCtx.drawImage(r.image,0,0,canvEl.width,canvEl.height);
    if(r.multiHandLandmarks&&r.multiHandLandmarks.length>0){
        handOn=true;const lm=r.multiHandLandmarks[0];
        drawConnectors(cCtx,lm,HAND_CONNECTIONS,{color:'#00ff88',lineWidth:2});
        drawLandmarks(cCtx,lm,{color:'#ff2233',lineWidth:1,radius:3});
        
        const hx=lm[0].x;
        if(hx>0.65)targetLane=2; else if(hx<0.35)targetLane=0; else targetLane=1;

        // Detect extension states for each finger: extended if tip is higher than knuckle base joint
        const indexExtended = lm[8].y < lm[6].y;
        const middleExtended = lm[12].y < lm[10].y;
        const ringExtended = lm[16].y < lm[14].y;
        const pinkyExtended = lm[20].y < lm[18].y;

        // Peace Sign (✌️): Index and Middle extended, Ring and Pinky folded
        const isPeace = indexExtended && middleExtended && !ringExtended && !pinkyExtended;

        // Closed Fist (✊): Index, Middle, Ring, Pinky all folded
        const isFist = !indexExtended && !middleExtended && !ringExtended && !pinkyExtended;

        if(isPeace && !isJump && playerGroup.position.y < 0.5){
            isJump=true;jumpV=0.70;AudioEngine.play('jump');
            gestIcon.textContent='✌️';gestTxt.textContent='JUMP!';
        } else if(isFist && !isSlide && !isJump){
            isSlide=true;setTimeout(()=>{isSlide=false;},600);AudioEngine.play('slide');
            gestIcon.textContent='✊';gestTxt.textContent='SLIDE!';
        } else if(!isJump&&!isSlide){
            if(hx>0.65){gestIcon.textContent='➡️';gestTxt.textContent='RIGHT';}
            else if(hx<0.35){gestIcon.textContent='⬅️';gestTxt.textContent='LEFT';}
            else{gestIcon.textContent='✋';gestTxt.textContent='CENTER';}
        }
        webcamSt.textContent='Hand Detected ✅';webcamSt.style.color='#00ff88';
    }else{handOn=false;webcamSt.textContent='No Hand ❌';webcamSt.style.color='#ff2233';gestIcon.textContent='❌';gestTxt.textContent='Show Hand!';}
    cCtx.restore();
}
const hands=new Hands({locateFile:f=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`});
hands.setOptions({maxNumHands:1,modelComplexity:1,minDetectionConfidence:0.6,minTrackingConfidence:0.6});
hands.onResults(onResults);

const camSelect = document.getElementById('camera-select');
let activeStream = null;

async function startCameraStream(deviceId) {
    if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
    }
    const constraints = {
        video: deviceId ? { deviceId: { exact: deviceId }, width: { ideal: 320 }, height: { ideal: 240 } } : { width: { ideal: 320 }, height: { ideal: 240 } }
    };
    try {
        activeStream = await navigator.mediaDevices.getUserMedia(constraints);
        vidEl.srcObject = activeStream;
        
        // Feed video frames into MediaPipe hands on frame update
        const processFrame = async () => {
            if (activeStream && activeStream.active && !vidEl.paused) {
                try {
                    await hands.send({ image: vidEl });
                } catch(e){}
                requestAnimationFrame(processFrame);
            }
        };
        vidEl.onplay = () => { requestAnimationFrame(processFrame); };
        await vidEl.play();
    } catch (err) {
        console.error('Failed to start camera stream:', err);
    }
}

async function initCameraDevices() {
    try {
        // Request initial permission to unlock device labels
        const initialStream = await navigator.mediaDevices.getUserMedia({ video: true });
        initialStream.getTracks().forEach(track => track.stop());
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        
        // Helper to identify and filter out mobile webcam helpers and virtual streams
        const isMobileOrVirtual = (lbl) => {
            const l = lbl.toLowerCase();
            return l.includes('poco') || l.includes('phone') || l.includes('mobile') || 
                   l.includes('link to windows') || l.includes('droidcam') || 
                   l.includes('virtual') || l.includes('obs') || l.includes('epoccam') || l.includes('ivcam');
        };

        // Enforce scan strictly for the laptop's built-in webcam hardware
        let laptopCam = videoDevices.find(d => {
            const label = d.label.toLowerCase();
            if (isMobileOrVirtual(label)) return false;
            return label.includes('integrated') || label.includes('built-in') || 
                   label.includes('front') || label.includes('facetime') || 
                   label.includes('webcam') || label.includes('camera');
        });
        
        // Fallback to any non-mobile camera if direct match failed
        if (!laptopCam) {
            laptopCam = videoDevices.find(d => !isMobileOrVirtual(d.label));
        }
        
        // Final fallback to first device
        const activeDeviceId = laptopCam ? laptopCam.deviceId : (videoDevices.length > 0 ? videoDevices[0].deviceId : null);
        
        camSelect.classList.add('hidden'); // Enforce laptop camera only, keeping select element hidden from view
        await startCameraStream(activeDeviceId);
    } catch (err) {
        console.warn('Camera enumeration failed, using standard stream:', err);
        await startCameraStream(null);
    }
}

initCameraDevices();

// LOADING
setTimeout(()=>{loadScr.classList.add('fade-out');setTimeout(()=>{loadScr.style.display='none';},800);},3500);

// INTRO
function playIntro(cb){
    introOvr.classList.remove('hidden');
    const txts=["You found the cursed idol...","The temple begins to collapse...","RUN!"];
    let i=0;
    function nxt(){
        if(i>=txts.length){introOvr.classList.add('hidden');cb();return;}
        introTxt.textContent=txts[i];introTxt.style.animation='none';void introTxt.offsetWidth;
        introTxt.style.animation='introFade 2s ease-in-out forwards';i++;setTimeout(nxt,2200);
    }nxt();
}

// RESET
function reset(){
    G.score=0;G.coins=0;G.combo=0;G.bestCombo=0;G.dist=0;G.base=1.5;G.speed=0;
    targetLane=1;isJump=false;isSlide=false;jumpV=0;
    playerGroup.position.set(0,0,5);playerGroup.scale.set(1,1,1);
    obs.forEach((o,i)=>{o.position.z=80+i*50+Math.random()*30;o.userData.lane=Math.floor(Math.random()*3);o.position.x=LANES[o.userData.lane];o.visible=true;});
    coins.forEach((c,i)=>{c.position.z=60+i*35+Math.random()*20;c.userData.lane=Math.floor(Math.random()*3);c.position.x=LANES[c.userData.lane];c.visible=true;});
    scoreEl.textContent='0';coinsEl.textContent='0';comboEl.classList.add('hidden');
}

function triggerScreenShake(){
    document.body.classList.add('shake');
    setTimeout(()=>document.body.classList.remove('shake'), 400);
}

let growlT=0, lightningT=0;
// MAIN LOOP
function tick(){
    requestAnimationFrame(tick);
    const dt=clock.getDelta();
    if(mixer)mixer.update(dt*(G.speed>0.3?G.speed:0.5));

    if(!G.playing){ren.render(scene,cam);return;}

    // Pulsing blood-red runes along path borders for aggressive aesthetics
    edgeMat.emissiveIntensity = 1.2 + Math.sin(Date.now() * 0.006) * 0.6;

    // Animate active 3D wood torch sparks & organic flickering light intensity
    torchGroups.forEach(tg => {
        // Flicker light intensity organically
        tg.userData.pl.intensity = tg.userData.baseIntensity + Math.sin(Date.now() * 0.008 + tg.position.z) * 1.5;
        
        // Rise and sway flame particles
        tg.userData.parts.forEach(p => {
            p.position.y += p.userData.speedY;
            p.position.x += Math.sin(Date.now() * 0.01 + p.position.y) * 0.005;
            
            // Fade out as it rises
            const progress = (p.position.y - p.userData.baseY) / 1.0;
            p.scale.setScalar(Math.max(1.0 - progress, 0.01));
            
            if (p.position.y > p.userData.baseY + 1.0) {
                p.position.y = p.userData.baseY;
                p.position.x = (Math.random() - 0.5) * 0.15;
                p.position.z = (Math.random() - 0.5) * 0.15;
            }
        });
    });

    // Pulsing molten volcanic lava ground emissive creep for 8K realism
    gnd.material.emissiveIntensity = 0.35 + Math.sin(Date.now() * 0.003) * 0.15;

    // Atmospheric dynamic lightning strikes & rumbling thunder
    lightningT += dt;
    if(lightningT > 10 + Math.random() * 8){
        moon.intensity = 15;
        scene.fog.color.setHex(0xdce6ff);
        scene.background.setHex(0xdce6ff);
        AudioEngine.play('thunder');
        lightningT = 0;
    } else {
        moon.intensity += (2 - moon.intensity) * 0.12;
        scene.fog.color.lerp(new THREE.Color(0x030508), 0.12);
        scene.background.lerp(new THREE.Color(0x020304), 0.12);
    }

    if(handOn){G.speed+=(G.base-G.speed)*0.05;}else{G.speed*=0.95;}

    // Animation speed
    if(runAction)runAction.timeScale=Math.max(G.speed*0.8,0.3);

    const tx=LANES[targetLane];
    playerGroup.position.x+=(tx-playerGroup.position.x)*0.12;

    // Camera follows player smoothly from behind
    cam.position.x+=(playerGroup.position.x*0.3-cam.position.x)*0.05;
    cam.position.y+=(5+playerGroup.position.y*0.5-cam.position.y)*0.05;
    cam.lookAt(playerGroup.position.x*0.5,3,playerGroup.position.z+20);

    if(isJump||playerGroup.position.y>0.05){
        playerGroup.position.y+=jumpV;jumpV-=0.05; // Extremely snappy accelerated gravity deceleration for immediate landing feedback
        if(playerGroup.position.y<=0){
            playerGroup.position.y=0;isJump=false;jumpV=0;
            triggerScreenShake();
        }
    }
    playerGroup.scale.set(1,1,1);

    if(G.speed>0.2){G.score+=G.speed*0.15;G.dist+=G.speed*0.5;G.base+=0.0003;}
    scoreEl.textContent=Math.floor(G.score);

    const spd=G.speed;
    trees.forEach(t=>{t.position.z-=spd;if(t.position.z<-30){t.position.z+=900;const s=Math.random()>0.5?1:-1;t.position.x=s*(13+Math.random()*60);}});
    
    // Scroll background gothic temple arches
    arches.forEach(a => {
        a.position.z -= spd;
        if(a.position.z < -30) {
            a.position.z += 900;
        }
    });

    // Scroll mossy foreground shrubs
    foregroundShrubs.forEach(s => {
        s.position.z -= spd;
        if(s.position.z < -20){
            s.position.z += 750;
            s.position.x = (Math.random() > 0.5 ? 1 : -1) * (10.5 + Math.random() * 2);
        }
    });

    groundTex.offset.y -= spd * 0.1;
    forestTex.offset.y -= spd * 0.1;

    obs.forEach(o=>{
        if(!o.visible)return;o.position.z-=spd;
        if(o.position.z<-20){o.position.z+=1000;o.userData.lane=Math.floor(Math.random()*3);o.position.x=LANES[o.userData.lane];o.visible=true;}
        const dz=Math.abs(o.position.z-playerGroup.position.z),dx=Math.abs(o.position.x-playerGroup.position.x),py=playerGroup.position.y;
        let hit=false;
        if(dz<2.2&&dx<2.2){
            if(o.userData.type===0){
                if(!isJump)hit=true; // Root obstacle: jump over!
            }else if(o.userData.type===1){
                if(!isSlide)hit=true; // Branch obstacle: slide under!
            }else{
                hit=true; // Stump obstacle: lane-switch!
            }
        }
        if(hit&&dz<1.5){gameOver();return;}
        if(dz<4&&dz>2&&dx<3&&!o.userData.nm){
            o.userData.nm=true;G.combo++;if(G.combo>G.bestCombo)G.bestCombo=G.combo;
            AudioEngine.play('nearmiss');
            triggerScreenShake();
            nearMissEl.classList.remove('hidden');nearMissEl.style.animation='none';void nearMissEl.offsetWidth;
            nearMissEl.style.animation='nearMissAnim 1s ease-out forwards';
            setTimeout(()=>nearMissEl.classList.add('hidden'),1000);
            comboEl.classList.remove('hidden');comboTxt.textContent=`COMBO x${G.combo}`;G.score+=G.combo*5;
        }
        if(dz>6)o.userData.nm=false;
    });

    coins.forEach(c=>{
        if(!c.visible)return;c.position.z-=spd;c.rotation.y+=0.08;
        if(c.position.z<-20){c.position.z+=1050;c.userData.lane=Math.floor(Math.random()*3);c.position.x=LANES[c.userData.lane];c.visible=true;}
        if(Math.abs(c.position.z-playerGroup.position.z)<2.5&&Math.abs(c.position.x-playerGroup.position.x)<2.5){
            c.visible=false;G.coins++;coinsEl.textContent=G.coins;AudioEngine.play('coin');G.score+=10;
        }
    });

    monG.position.z+=(playerGroup.position.z-20-monG.position.z)*0.015;
    monG.position.x+=(playerGroup.position.x-monG.position.x)*0.01;
    monG.position.y=Math.sin(Date.now()*0.003)*0.5;
    chaseLight.position.copy(monG.position);
    growlT+=spd;if(growlT>200){AudioEngine.play('growl');growlT=0;}

    const pp=parts.geometry.attributes.position.array;
    for(let i=0;i<pCnt;i++){
        pp[i*3+2]-=spd*0.5;
        pp[i*3+1]+=Math.sin(Date.now()*0.002+i)*0.02;
        pp[i*3]+=Math.cos(Date.now()*0.001+i)*0.01;
        if(pp[i*3+2]<-20){
            pp[i*3+2]+=100;
            pp[i*3]=Math.random()*80-40;
            pp[i*3+1]=Math.random()*25+1;
        }
    }
    parts.geometry.attributes.position.needsUpdate=true;

    torch.intensity=25+Math.sin(Date.now()*0.01)*5;
    speedBar.style.height=Math.min(G.speed/4,1)*100+'%';
    if(!handOn&&G.speed<0.3)warnFlash.classList.remove('hidden');else warnFlash.classList.add('hidden');

    cam.fov=65+G.speed*2;cam.updateProjectionMatrix();
    ren.render(scene,cam);
}

function gameOver(){
    G.playing=false;AudioEngine.play('crash');AudioEngine.stopAmbient();
    document.getElementById('game-container').classList.add('shake');
    setTimeout(()=>document.getElementById('game-container').classList.remove('shake'),400);
    fScore.textContent=Math.floor(G.score);fCoins.textContent=G.coins;
    fDist.textContent=Math.floor(G.dist)+'m';fCombo.textContent=G.bestCombo;
    setTimeout(()=>{goScr.classList.remove('hidden');},600);
}

startBtn.addEventListener('click',()=>{
    startScr.classList.add('hidden');AudioEngine.init();
    playIntro(()=>{reset();hud.classList.remove('hidden');gestInd.classList.remove('hidden');AudioEngine.startAmbient();G.playing=true;});
});
restartBtn.addEventListener('click',()=>{goScr.classList.add('hidden');reset();AudioEngine.init();AudioEngine.startAmbient();G.playing=true;});
addEventListener('resize',()=>{ren.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();});
tick();
