// TEMPLE RUN: CURSED FOREST - GAME ENGINE
const G = { playing: false, speed: 0, base: 1.5, score: 0, coins: 0, combo: 0, bestCombo: 0, dist: 0 };
const LANES = [-6, 0, 6];
let targetLane = 1, isJump = false, isSlide = false, jumpV = 0, handOn = false;

// THREE.JS SCENE
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x030508, 0.025);
scene.background = new THREE.Color(0x020304);
const cam = new THREE.PerspectiveCamera(70, innerWidth/innerHeight, 0.1, 1000);
cam.position.set(0, 8, 18); cam.lookAt(0, 2, -20);
const ren = new THREE.WebGLRenderer({antialias:true});
ren.setSize(innerWidth, innerHeight); ren.shadowMap.enabled = true;
ren.setPixelRatio(Math.min(devicePixelRatio, 2));
document.getElementById('game-container').appendChild(ren.domElement);

// LIGHTS
scene.add(new THREE.AmbientLight(0x1a1a2e, 2));
const torch = new THREE.PointLight(0xff8800, 3, 80); torch.position.set(0,6,12); torch.castShadow=true; scene.add(torch);
const moon = new THREE.DirectionalLight(0x4444ff, 0.5); moon.position.set(-20, 40, -30); scene.add(moon);
const chaseLight = new THREE.PointLight(0xff0000, 2, 40); chaseLight.position.set(0, 5, 40); scene.add(chaseLight);

// GROUND
const loader = new THREE.TextureLoader();
const gMat = new THREE.MeshStandardMaterial({color:0x0a110a, roughness:0.95});
const gnd = new THREE.Mesh(new THREE.PlaneGeometry(300,1200,1,1), gMat);
gnd.rotation.x=-Math.PI/2; gnd.position.z=-500; gnd.receiveShadow=true; scene.add(gnd);

// PATH
const pMat = new THREE.MeshStandardMaterial({color:0x1a1008, roughness:0.85});
const pth = new THREE.Mesh(new THREE.PlaneGeometry(20,1200), pMat);
pth.rotation.x=-Math.PI/2; pth.position.y=0.06; pth.position.z=-500; pth.receiveShadow=true; scene.add(pth);

// PATH EDGES (glowing lines)
const edgeMat = new THREE.MeshBasicMaterial({color:0x332200});
[-10,10].forEach(x=>{
    const e=new THREE.Mesh(new THREE.PlaneGeometry(0.3,1200),edgeMat);
    e.rotation.x=-Math.PI/2; e.position.set(x,0.08,-500); scene.add(e);
});

// TREES
const trees = [];
function mkTree(x,z){
    const g=new THREE.Group();
    const tk=new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.9,6,6),new THREE.MeshStandardMaterial({color:0x1a0e08}));
    tk.position.y=3; tk.castShadow=true; g.add(tk);
    for(let i=0;i<3;i++){
        const s=3-i*0.8, h=8+i*3;
        const lv=new THREE.Mesh(new THREE.ConeGeometry(s,5,7),new THREE.MeshStandardMaterial({color:0x041a04+i*0x010100}));
        lv.position.y=h; lv.castShadow=true; g.add(lv);
    }
    g.position.set(x,0,z); scene.add(g); trees.push(g);
}
for(let i=0;i<100;i++){
    const s=Math.random()>0.5?1:-1;
    mkTree(s*(13+Math.random()*60), -Math.random()*900);
}

// OBSTACLES
const obs=[]; const obsMats=[
    new THREE.MeshStandardMaterial({color:0x444444,roughness:0.7}),
    new THREE.MeshStandardMaterial({color:0x553300,roughness:0.8}),
    new THREE.MeshStandardMaterial({color:0x880000,roughness:0.6,emissive:0x220000})
];
function mkObs(z){
    const type=Math.floor(Math.random()*3);
    let mesh;
    if(type===0){ // Stone block
        mesh=new THREE.Mesh(new THREE.BoxGeometry(3.5,4,2),obsMats[0]);
    } else if(type===1){ // Fallen log
        mesh=new THREE.Mesh(new THREE.CylinderGeometry(1,1,4,8),obsMats[1]);
        mesh.rotation.z=Math.PI/2;
    } else { // Fire pillar
        mesh=new THREE.Mesh(new THREE.CylinderGeometry(0.8,1.2,5,8),obsMats[2]);
        const flame=new THREE.PointLight(0xff4400,1,15);
        flame.position.y=3; mesh.add(flame);
    }
    mesh.userData={type,lane:Math.floor(Math.random()*3)};
    mesh.position.set(LANES[mesh.userData.lane], type===1?1.5:2.5, z);
    mesh.castShadow=true; scene.add(mesh); obs.push(mesh);
}
for(let i=0;i<20;i++) mkObs(-80-i*50-Math.random()*30);

// COINS
const coins=[];
const coinGeo=new THREE.TorusGeometry(0.6,0.2,8,16);
const coinMat=new THREE.MeshStandardMaterial({color:0xffd700,emissive:0x554400,metalness:0.9,roughness:0.2});
function mkCoin(z){
    const c=new THREE.Mesh(coinGeo,coinMat);
    c.userData.lane=Math.floor(Math.random()*3);
    c.position.set(LANES[c.userData.lane],3,z);
    scene.add(c); coins.push(c);
}
for(let i=0;i<30;i++) mkCoin(-60-i*35-Math.random()*20);

// CHASE MONSTER (demon behind player)
const monG=new THREE.Group();
const monBody=new THREE.Mesh(new THREE.SphereGeometry(3,8,8),new THREE.MeshStandardMaterial({color:0x220000,emissive:0x110000}));
monBody.position.y=4; monG.add(monBody);
// Eyes
[[-1.2,5,-2],[1.2,5,-2]].forEach(p=>{
    const eye=new THREE.Mesh(new THREE.SphereGeometry(0.5,6,6),new THREE.MeshBasicMaterial({color:0xff0000}));
    eye.position.set(...p); monG.add(eye);
    const glow=new THREE.PointLight(0xff0000,0.8,10);
    glow.position.set(...p); monG.add(glow);
});
monG.position.set(0,0,45); scene.add(monG);

// PARTICLES (floating dust/embers)
const partCount=200;
const partGeo=new THREE.BufferGeometry();
const partPos=new Float32Array(partCount*3);
for(let i=0;i<partCount;i++){
    partPos[i*3]=Math.random()*80-40;
    partPos[i*3+1]=Math.random()*20+1;
    partPos[i*3+2]=Math.random()*100-80;
}
partGeo.setAttribute('position',new THREE.BufferAttribute(partPos,3));
const partMat=new THREE.PointsMaterial({color:0xff8800,size:0.15,transparent:true,opacity:0.6});
const parts=new THREE.Points(partGeo,partMat);
scene.add(parts);

// PLAYER
const plG=new THREE.Group();
// Body
const body=new THREE.Mesh(new THREE.BoxGeometry(1.5,2.5,1),new THREE.MeshStandardMaterial({color:0xcc3333}));
body.position.y=3.5; plG.add(body);
// Head
const head=new THREE.Mesh(new THREE.SphereGeometry(0.6,8,8),new THREE.MeshStandardMaterial({color:0xddaa88}));
head.position.y=5.5; plG.add(head);
// Legs
[-0.35,0.35].forEach(x=>{
    const leg=new THREE.Mesh(new THREE.BoxGeometry(0.5,1.5,0.5),new THREE.MeshStandardMaterial({color:0x333366}));
    leg.position.set(x,1.5,0); plG.add(leg);
});
plG.position.set(0,0,5); plG.castShadow=true; scene.add(plG);

// UI REFS
const scoreEl=document.getElementById('score'),coinsEl=document.getElementById('coins');
const comboEl=document.getElementById('combo-container'),comboTxt=document.getElementById('combo-text');
const speedBar=document.getElementById('speed-bar');
const gestInd=document.getElementById('gesture-indicator'),gestTxt=document.getElementById('gesture-text'),gestIcon=document.getElementById('gesture-icon');
const hud=document.getElementById('hud');
const warnFlash=document.getElementById('warning-flash');
const nearMiss=document.getElementById('near-miss');
const startScr=document.getElementById('start-screen'),goScr=document.getElementById('game-over-screen');
const startBtn=document.getElementById('start-btn'),restartBtn=document.getElementById('restart-btn');
const introOvr=document.getElementById('intro-overlay'),introTxt=document.getElementById('intro-text');
const loadScr=document.getElementById('loading-screen');
const webcamSt=document.getElementById('webcam-status');
const fScore=document.getElementById('final-score'),fCoins=document.getElementById('final-coins');
const fDist=document.getElementById('final-distance'),fCombo=document.getElementById('final-best-combo');

// MEDIAPIPE HAND TRACKING
const vidEl=document.getElementById('input_video');
const canvEl=document.getElementById('output_canvas');
const cCtx=canvEl.getContext('2d');

function onResults(r){
    cCtx.save(); cCtx.clearRect(0,0,canvEl.width,canvEl.height);
    cCtx.drawImage(r.image,0,0,canvEl.width,canvEl.height);
    if(r.multiHandLandmarks && r.multiHandLandmarks.length>0){
        handOn=true;
        const lm=r.multiHandLandmarks[0];
        drawConnectors(cCtx,lm,HAND_CONNECTIONS,{color:'#00ff88',lineWidth:2});
        drawLandmarks(cCtx,lm,{color:'#ff2233',lineWidth:1,radius:3});
        const hx=lm[0].x, hy=lm[0].y;
        // Lane control
        if(hx>0.65) targetLane=0;
        else if(hx<0.35) targetLane=2;
        else targetLane=1;
        // Jump
        if(hy<0.25 && !isJump && plG.position.y<0.5){
            isJump=true; jumpV=0.55; AudioEngine.play('jump');
            gestIcon.textContent='⬆️'; gestTxt.textContent='JUMP!';
        }
        // Slide
        else if(hy>0.75 && !isSlide && !isJump){
            isSlide=true; setTimeout(()=>{isSlide=false;},600);
            AudioEngine.play('slide');
            gestIcon.textContent='⬇️'; gestTxt.textContent='SLIDE!';
        }
        else if(!isJump && !isSlide){
            if(hx>0.65){gestIcon.textContent='⬅️'; gestTxt.textContent='LEFT';}
            else if(hx<0.35){gestIcon.textContent='➡️'; gestTxt.textContent='RIGHT';}
            else{gestIcon.textContent='✋'; gestTxt.textContent='CENTER';}
        }
        webcamSt.textContent='Hand Detected ✅';
        webcamSt.style.color='#00ff88';
    } else {
        handOn=false;
        webcamSt.textContent='No Hand ❌';
        webcamSt.style.color='#ff2233';
        gestIcon.textContent='❌'; gestTxt.textContent='Show Hand!';
    }
    cCtx.restore();
}

const hands=new Hands({locateFile:f=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`});
hands.setOptions({maxNumHands:1,modelComplexity:1,minDetectionConfidence:0.6,minTrackingConfidence:0.6});
hands.onResults(onResults);
const camObj=new Camera(vidEl,{onFrame:async()=>{await hands.send({image:vidEl});},width:320,height:240});
camObj.start();

// LOADING
setTimeout(()=>{loadScr.classList.add('fade-out');setTimeout(()=>{loadScr.style.display='none';},800);},3000);

// CINEMATIC INTRO
function playIntro(cb){
    introOvr.classList.remove('hidden');
    const texts=["You found the cursed idol...","The temple begins to collapse...","RUN!"];
    let i=0;
    function next(){
        if(i>=texts.length){introOvr.classList.add('hidden');cb();return;}
        introTxt.textContent=texts[i];
        introTxt.style.animation='none'; void introTxt.offsetWidth;
        introTxt.style.animation='introFade 2s ease-in-out forwards';
        i++; setTimeout(next,2200);
    }
    next();
}

// CAMERA SHAKE
let shakeT=0;
function triggerShake(d){shakeT=d;}

// RESET
function reset(){
    G.score=0;G.coins=0;G.combo=0;G.bestCombo=0;G.dist=0;G.base=1.5;G.speed=0;
    targetLane=1;isJump=false;isSlide=false;jumpV=0;
    plG.position.set(0,0,5);
    obs.forEach((o,i)=>{
        o.position.z=-80-i*50-Math.random()*30;
        o.userData.lane=Math.floor(Math.random()*3);
        o.position.x=LANES[o.userData.lane];
        o.visible=true;
    });
    coins.forEach((c,i)=>{
        c.position.z=-60-i*35-Math.random()*20;
        c.userData.lane=Math.floor(Math.random()*3);
        c.position.x=LANES[c.userData.lane];
        c.visible=true;
    });
    scoreEl.textContent='0';coinsEl.textContent='0';
    comboEl.classList.add('hidden');
}

let growlTimer=0;
// MAIN LOOP
function tick(){
    requestAnimationFrame(tick);
    if(!G.playing){ren.render(scene,cam);return;}

    // Speed
    if(handOn){G.speed+=(G.base-G.speed)*0.05;}
    else{G.speed*=0.95;}

    // Player lane lerp
    const tx=LANES[targetLane];
    plG.position.x+=(tx-plG.position.x)*0.12;
    torch.position.x=plG.position.x;

    // Jump
    if(isJump||plG.position.y>0.05){
        plG.position.y+=jumpV; jumpV-=0.025;
        if(plG.position.y<=0){plG.position.y=0;isJump=false;jumpV=0;}
    }
    // Slide (shrink player)
    if(isSlide){body.scale.y=0.4;body.position.y=2;head.position.y=3.5;}
    else{body.scale.y=1;body.position.y=3.5;head.position.y=5.5;}

    // Score
    if(G.speed>0.2){G.score+=G.speed*0.15;G.dist+=G.speed*0.5;G.base+=0.0003;}
    scoreEl.textContent=Math.floor(G.score);

    // Move world
    const spd=G.speed;
    trees.forEach(t=>{t.position.z+=spd;if(t.position.z>30){t.position.z-=900;const s=Math.random()>0.5?1:-1;t.position.x=s*(13+Math.random()*60);}});
    gnd.position.z+=spd;pth.position.z+=spd;
    if(gnd.position.z>-400){gnd.position.z-=100;pth.position.z-=100;}

    // Obstacles
    obs.forEach(o=>{
        if(!o.visible)return;
        o.position.z+=spd;
        if(o.position.z>25){
            o.position.z-=1000;
            o.userData.lane=Math.floor(Math.random()*3);
            o.position.x=LANES[o.userData.lane];
            o.visible=true;
        }
        // Collision
        const dz=Math.abs(o.position.z-plG.position.z);
        const dx=Math.abs(o.position.x-plG.position.x);
        const py=plG.position.y;
        const canDodge=(o.userData.type===1 && isSlide);
        if(dz<2 && dx<2.2){
            if(canDodge || py>3.5){
                // Dodged!
            } else if(dz<1.5){
                gameOver();return;
            }
        }
        // Near miss
        if(dz<4 && dz>2 && dx<3 && !o.userData.nm){
            o.userData.nm=true; G.combo++;
            if(G.combo>G.bestCombo) G.bestCombo=G.combo;
            AudioEngine.play('nearmiss');
            nearMiss.classList.remove('hidden');
            nearMiss.style.animation='none';void nearMiss.offsetWidth;
            nearMiss.style.animation='nearMissAnim 1s ease-out forwards';
            setTimeout(()=>nearMiss.classList.add('hidden'),1000);
            comboEl.classList.remove('hidden');
            comboTxt.textContent=`COMBO x${G.combo}`;
            G.score+=G.combo*5;
        }
        if(dz>6) o.userData.nm=false;
    });

    // Coins
    coins.forEach(c=>{
        if(!c.visible)return;
        c.position.z+=spd;
        c.rotation.y+=0.08;
        if(c.position.z>25){
            c.position.z-=1050;
            c.userData.lane=Math.floor(Math.random()*3);
            c.position.x=LANES[c.userData.lane];
            c.visible=true;
        }
        const dz=Math.abs(c.position.z-plG.position.z);
        const dx=Math.abs(c.position.x-plG.position.x);
        if(dz<2.5 && dx<2.5){
            c.visible=false; G.coins++;
            coinsEl.textContent=G.coins;
            AudioEngine.play('coin');
            G.score+=10;
        }
    });

    // Monster chase
    monG.position.z+=(plG.position.z+35-monG.position.z)*0.02;
    monG.position.x+=(plG.position.x-monG.position.x)*0.01;
    monG.position.y=Math.sin(Date.now()*0.003)*0.5;
    chaseLight.position.copy(monG.position);
    growlTimer+=spd;
    if(growlTimer>200){AudioEngine.play('growl');growlTimer=0;}

    // Particles
    const pp=parts.geometry.attributes.position.array;
    for(let i=0;i<partCount;i++){
        pp[i*3+2]+=spd*0.5;
        pp[i*3+1]+=Math.sin(Date.now()*0.002+i)*0.02;
        if(pp[i*3+2]>20){pp[i*3+2]-=100;pp[i*3]=Math.random()*80-40;pp[i*3+1]=Math.random()*20+1;}
    }
    parts.geometry.attributes.position.needsUpdate=true;

    // Torch flicker
    torch.intensity=2.5+Math.sin(Date.now()*0.01)*0.8;

    // Speed bar
    const sp=Math.min(G.speed/4,1)*100;
    speedBar.style.height=sp+'%';

    // Warning
    if(!handOn && G.speed<0.3){warnFlash.classList.remove('hidden');}
    else{warnFlash.classList.add('hidden');}

    // Camera shake
    if(shakeT>0){
        cam.position.x=Math.random()*0.4-0.2;
        cam.position.y=8+Math.random()*0.3-0.15;
        shakeT--;
    } else {
        cam.position.x+=(0-cam.position.x)*0.1;
        cam.position.y+=(8-cam.position.y)*0.1;
    }
    // Dynamic FOV
    cam.fov=70+G.speed*3;
    cam.updateProjectionMatrix();

    ren.render(scene,cam);
}

function gameOver(){
    G.playing=false;
    AudioEngine.play('crash');
    AudioEngine.stopAmbient();
    triggerShake(15);
    document.getElementById('game-container').classList.add('shake');
    setTimeout(()=>document.getElementById('game-container').classList.remove('shake'),400);
    fScore.textContent=Math.floor(G.score);
    fCoins.textContent=G.coins;
    fDist.textContent=Math.floor(G.dist)+'m';
    fCombo.textContent=G.bestCombo;
    setTimeout(()=>{goScr.classList.remove('hidden');},600);
}

// START
startBtn.addEventListener('click',()=>{
    startScr.classList.add('hidden');
    AudioEngine.init();
    playIntro(()=>{
        reset();
        hud.classList.remove('hidden');
        gestInd.classList.remove('hidden');
        AudioEngine.startAmbient();
        G.playing=true;
    });
});

restartBtn.addEventListener('click',()=>{
    goScr.classList.add('hidden');
    reset();
    AudioEngine.init();
    AudioEngine.startAmbient();
    G.playing=true;
});

// Resize
addEventListener('resize',()=>{ren.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();});

// Start loop
tick();
ren.render(scene,cam);
