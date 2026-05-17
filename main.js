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
const torch = new THREE.SpotLight(0xffaa44, 25, 100, Math.PI / 5, 0.5, 1);
torch.position.set(0, 5, 0);
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
// Torch lights along path
for(let i=0;i<6;i++){
    const tl=new THREE.PointLight(0xff6600,3,25);
    tl.position.set(i%2===0?-11:11,4,-i*80);scene.add(tl);
}

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
    new THREE.MeshStandardMaterial({map:forestTex,roughness:0.95}));
gnd.rotation.x=-Math.PI/2;gnd.position.set(0, 0, 400);gnd.receiveShadow=true;scene.add(gnd);

// PATH
const pth=new THREE.Mesh(new THREE.PlaneGeometry(20,1200),
    new THREE.MeshStandardMaterial({map:groundTex,roughness:0.6,metalness:0.2}));
pth.rotation.x=-Math.PI/2;pth.position.set(0, 0.06, 400);pth.receiveShadow=true;scene.add(pth);

// Path edges
const edgeMat=new THREE.MeshBasicMaterial({color:0x332200});
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
for(let i=0;i<100;i++){
    const s=Math.random()>0.5?1:-1;
    mkTree(s*(13+Math.random()*60),Math.random()*900);
}

// OBSTACLES
const obs=[];
const obsMats=[
    new THREE.MeshStandardMaterial({map:groundTex,roughness:0.8,metalness:0.1}),
    new THREE.MeshStandardMaterial({map:groundTex,color:0x8b5a2b,roughness:0.9}),
    new THREE.MeshStandardMaterial({map:groundTex,color:0xff8888,roughness:0.6,emissive:0x441111,emissiveIntensity:0.6})
];
function mkObs(z){
    const type=Math.floor(Math.random()*3);let mesh;
    if(type===0){mesh=new THREE.Mesh(new THREE.BoxGeometry(3.5,4,2),obsMats[0]);}
    else if(type===1){mesh=new THREE.Mesh(new THREE.CylinderGeometry(1,1,4,8),obsMats[1]);mesh.rotation.z=Math.PI/2;}
    else{mesh=new THREE.Mesh(new THREE.CylinderGeometry(0.8,1.2,5,8),obsMats[2]);
        const fl=new THREE.PointLight(0xff4400,3,15);fl.position.y=3;mesh.add(fl);}
    mesh.userData={type,lane:Math.floor(Math.random()*3),nm:false};
    mesh.position.set(LANES[mesh.userData.lane],type===1?1.5:2.5,z);
    mesh.castShadow=true;scene.add(mesh);obs.push(mesh);
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

// PARTICLES
const pCnt=300;const pGeo=new THREE.BufferGeometry();
const pPos=new Float32Array(pCnt*3);
for(let i=0;i<pCnt;i++){pPos[i*3]=Math.random()*80-40;pPos[i*3+1]=Math.random()*25+1;pPos[i*3+2]=Math.random()*100;}
pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));
const parts=new THREE.Points(pGeo,new THREE.PointsMaterial({color:0xff8800,size:0.15,transparent:true,opacity:0.5}));
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
        const hx=lm[0].x,hy=lm[0].y;
        if(hx>0.65)targetLane=0; else if(hx<0.35)targetLane=2; else targetLane=1;
        if(hy<0.25&&!isJump&&playerGroup.position.y<0.5){isJump=true;jumpV=0.55;AudioEngine.play('jump');gestIcon.textContent='⬆️';gestTxt.textContent='JUMP!';}
        else if(hy>0.75&&!isSlide&&!isJump){isSlide=true;setTimeout(()=>{isSlide=false;},600);AudioEngine.play('slide');gestIcon.textContent='⬇️';gestTxt.textContent='SLIDE!';}
        else if(!isJump&&!isSlide){
            if(hx>0.65){gestIcon.textContent='⬅️';gestTxt.textContent='LEFT';}
            else if(hx<0.35){gestIcon.textContent='➡️';gestTxt.textContent='RIGHT';}
            else{gestIcon.textContent='✋';gestTxt.textContent='CENTER';}
        }
        webcamSt.textContent='Hand Detected ✅';webcamSt.style.color='#00ff88';
    }else{handOn=false;webcamSt.textContent='No Hand ❌';webcamSt.style.color='#ff2233';gestIcon.textContent='❌';gestTxt.textContent='Show Hand!';}
    cCtx.restore();
}
const hands=new Hands({locateFile:f=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`});
hands.setOptions({maxNumHands:1,modelComplexity:1,minDetectionConfidence:0.6,minTrackingConfidence:0.6});
hands.onResults(onResults);
const camObj=new Camera(vidEl,{onFrame:async()=>{await hands.send({image:vidEl});},width:320,height:240});
camObj.start();

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

let growlT=0;
// MAIN LOOP
function tick(){
    requestAnimationFrame(tick);
    const dt=clock.getDelta();
    if(mixer)mixer.update(dt*(G.speed>0.3?G.speed:0.5));

    if(!G.playing){ren.render(scene,cam);return;}

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
        playerGroup.position.y+=jumpV;jumpV-=0.025;
        if(playerGroup.position.y<=0){playerGroup.position.y=0;isJump=false;jumpV=0;}
    }
    if(isSlide){playerGroup.scale.y=0.5;}else{playerGroup.scale.y+=(1-playerGroup.scale.y)*0.15;}

    if(G.speed>0.2){G.score+=G.speed*0.15;G.dist+=G.speed*0.5;G.base+=0.0003;}
    scoreEl.textContent=Math.floor(G.score);

    const spd=G.speed;
    trees.forEach(t=>{t.position.z-=spd;if(t.position.z<-30){t.position.z+=900;const s=Math.random()>0.5?1:-1;t.position.x=s*(13+Math.random()*60);}});
    groundTex.offset.y -= spd * 0.1;
    forestTex.offset.y -= spd * 0.1;

    obs.forEach(o=>{
        if(!o.visible)return;o.position.z-=spd;
        if(o.position.z<-20){o.position.z+=1000;o.userData.lane=Math.floor(Math.random()*3);o.position.x=LANES[o.userData.lane];o.visible=true;}
        const dz=Math.abs(o.position.z-playerGroup.position.z),dx=Math.abs(o.position.x-playerGroup.position.x),py=playerGroup.position.y;
        const canDodge=(o.userData.type===1&&isSlide);
        if(dz<2&&dx<2.2&&!canDodge&&py<3.5&&dz<1.5){gameOver();return;}
        if(dz<4&&dz>2&&dx<3&&!o.userData.nm){
            o.userData.nm=true;G.combo++;if(G.combo>G.bestCombo)G.bestCombo=G.combo;
            AudioEngine.play('nearmiss');
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
