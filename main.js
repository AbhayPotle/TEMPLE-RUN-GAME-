// Temple Run: AAA Cinematic - Chase Monster, Combos, Lightning, Intro
console.log("Loading AAA Features...");

// --- ECONOMY ---
let coins = 0, coinsThisRun = 0, unlockedChars = ['explorer'], selectedChar = 'explorer';
const saved = localStorage.getItem('templeRunData');
if (saved) { const d = JSON.parse(saved); coins = d.coins||0; unlockedChars = d.unlockedChars||['explorer']; selectedChar = d.selectedChar||'explorer'; }
function saveData() { localStorage.setItem('templeRunData', JSON.stringify({coins,unlockedChars,selectedChar})); }

const coinCountEl = document.getElementById('coin-count');
coinCountEl.innerText = coins;
const comboEl = document.getElementById('combo-display');
const comboCountEl = document.getElementById('combo-count');

const charCards = {
    'explorer': { el: document.getElementById('card-explorer'), price: 0 },
    'ninja': { el: document.getElementById('card-ninja'), price: 50 },
    'knight': { el: document.getElementById('card-knight'), price: 100 },
    'adventurer': { el: document.getElementById('card-adventurer'), price: 150 }
};

function updateShopUI() {
    coinCountEl.innerText = coins;
    for (const [c, d] of Object.entries(charCards)) {
        if (unlockedChars.includes(c)) { d.el.classList.remove('locked'); d.el.querySelector('p').innerText = 'Unlocked'; }
        d.el.classList.toggle('selected', c === selectedChar);
    }
}
updateShopUI();

Object.entries(charCards).forEach(([c, d]) => {
    d.el.addEventListener('click', () => {
        if (unlockedChars.includes(c)) { selectedChar = c; saveData(); updateShopUI(); applySkin(c); }
        else if (coins >= d.price) { coins -= d.price; unlockedChars.push(c); selectedChar = c; saveData(); updateShopUI(); playSound('coin'); applySkin(c); }
        else alert("Not enough coins!");
    });
});

// --- AUDIO ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let windOsc, footstepInt;
function playSound(t) {
    if (audioCtx.state==='suspended') audioCtx.resume();
    const o=audioCtx.createOscillator(), g=audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    if(t==='jump'){o.type='sine';o.frequency.setValueAtTime(150,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(300,audioCtx.currentTime+0.3);g.gain.setValueAtTime(0.5,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(0.01,audioCtx.currentTime+0.3);o.start();o.stop(audioCtx.currentTime+0.3);}
    else if(t==='crash'){o.type='sawtooth';o.frequency.setValueAtTime(100,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(10,audioCtx.currentTime+0.5);g.gain.setValueAtTime(1,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(0.01,audioCtx.currentTime+0.5);o.start();o.stop(audioCtx.currentTime+0.5);}
    else if(t==='coin'){o.type='square';o.frequency.setValueAtTime(800,audioCtx.currentTime);o.frequency.setValueAtTime(1200,audioCtx.currentTime+0.1);g.gain.setValueAtTime(0.3,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(0.01,audioCtx.currentTime+0.2);o.start();o.stop(audioCtx.currentTime+0.2);}
    else if(t==='footstep'){o.type='triangle';o.frequency.setValueAtTime(80,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(20,audioCtx.currentTime+0.1);g.gain.setValueAtTime(0.15,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(0.01,audioCtx.currentTime+0.1);o.start();o.stop(audioCtx.currentTime+0.1);}
    else if(t==='thunder'){o.type='sawtooth';o.frequency.setValueAtTime(40,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(15,audioCtx.currentTime+0.8);g.gain.setValueAtTime(0.8,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(0.01,audioCtx.currentTime+0.8);o.start();o.stop(audioCtx.currentTime+0.8);}
    else if(t==='growl'){o.type='sawtooth';o.frequency.setValueAtTime(60,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(30,audioCtx.currentTime+0.6);g.gain.setValueAtTime(0.6,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(0.01,audioCtx.currentTime+0.6);o.start();o.stop(audioCtx.currentTime+0.6);}
}
function startAmbient() { if(windOsc) return; if(audioCtx.state==='suspended') audioCtx.resume(); windOsc=audioCtx.createOscillator(); const g=audioCtx.createGain(); windOsc.type='triangle'; windOsc.frequency.value=40; g.gain.value=0.15; windOsc.connect(g); g.connect(audioCtx.destination); windOsc.start(); }
function startFoot() { if(footstepInt) return; footstepInt=setInterval(()=>{if(isPlaying&&!isJumping&&handDetected) playSound('footstep');},350); }
function stopFoot() { if(footstepInt){clearInterval(footstepInt);footstepInt=null;} }

// --- TEXTURES ---
function noiseTex(c1,c2) { const cv=document.createElement('canvas'); cv.width=256; cv.height=256; const x=cv.getContext('2d'); for(let i=0;i<256;i++) for(let j=0;j<256;j++){x.fillStyle=Math.random()>0.5?c1:c2;x.fillRect(i,j,1,1);} const t=new THREE.CanvasTexture(cv); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(10,100); return t; }

// --- THREE.JS ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x020804, 0.045);
scene.background = new THREE.Color(0x010402);
const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);
camera.position.set(0, 8, 15); camera.lookAt(0, 2, -15);
const renderer = new THREE.WebGLRenderer({antialias:true,alpha:true});
renderer.setSize(innerWidth,innerHeight); renderer.shadowMap.enabled=true; renderer.toneMapping=THREE.ReinhardToneMapping;
document.getElementById('game-container').appendChild(renderer.domElement);

// POST-PROCESSING
const renderScene = new THREE.RenderPass(scene, camera);
const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),1.5,0.4,0.85);
bloomPass.threshold=0.1; bloomPass.strength=1.5; bloomPass.radius=0.5;
const composer = new THREE.EffectComposer(renderer);
composer.addPass(renderScene); composer.addPass(bloomPass);

// LIGHTING
scene.add(new THREE.AmbientLight(0x223344, 2.0));
const pLight = new THREE.PointLight(0xff8800, 3.5, 80);
pLight.position.set(0,6,12); pLight.castShadow=true; scene.add(pLight);

// ENVIRONMENT
const gMat = new THREE.MeshStandardMaterial({map:noiseTex('#081208','#030803'),roughness:1});
const ground = new THREE.Mesh(new THREE.PlaneGeometry(400,1000,40,100), gMat);
ground.rotation.x=-Math.PI/2; ground.position.z=-400; ground.receiveShadow=true; scene.add(ground);
const pMat = new THREE.MeshStandardMaterial({map:noiseTex('#151515','#2a2a2a'),roughness:0.8});
const path = new THREE.Mesh(new THREE.PlaneGeometry(24,1000), pMat);
path.rotation.x=-Math.PI/2; path.position.y=0.05; path.position.z=-400; path.receiveShadow=true; scene.add(path);

// SCENERY, OBSTACLES, COINS
const scenery=[], obstacles=[], coinObjs=[];
const treeMat=new THREE.MeshStandardMaterial({color:0x021102});
const trunkMat=new THREE.MeshStandardMaterial({color:0x1f130c});
const logMat=new THREE.MeshStandardMaterial({map:noiseTex('#1f130c','#150d08')});
const pillarMat=new THREE.MeshStandardMaterial({map:noiseTex('#444','#333')});
const coinMat=new THREE.MeshStandardMaterial({color:0xffe600,metalness:1,roughness:0.1,emissive:0x443300});

function mkTree(x,z){const g=new THREE.Group();const tk=new THREE.Mesh(new THREE.CylinderGeometry(0.8,0.8,6),trunkMat);tk.position.y=3;tk.castShadow=true;const lv=new THREE.Mesh(new THREE.ConeGeometry(4,20,8),treeMat);lv.position.y=12;lv.castShadow=true;g.add(tk);g.add(lv);g.position.set(x,0,z);scene.add(g);scenery.push(g);}
function mkObs(z){const isL=Math.random()>0.5;let o;if(isL){o=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.5,6),logMat);o.rotation.z=Math.PI/2;o.position.y=1.5;}else{o=new THREE.Mesh(new THREE.CylinderGeometry(2,2,8),pillarMat);o.position.y=4;}const ls=[-8,0,8];o.position.x=ls[Math.floor(Math.random()*3)];o.position.z=z;o.castShadow=true;scene.add(o);obstacles.push(o);}
function mkCoin(z){const c=new THREE.Mesh(new THREE.TorusGeometry(1.2,0.4,16,32),coinMat);const ls=[-8,0,8];c.position.set(ls[Math.floor(Math.random()*3)],2.5,z);c.castShadow=true;scene.add(c);coinObjs.push({mesh:c,active:true});}

for(let i=0;i<100;i++){const s=Math.random()>0.5?1:-1;mkTree(s*(16+Math.random()*60),-Math.random()*800);}
for(let i=0;i<20;i++) mkObs(-200-Math.random()*600);
for(let i=0;i<30;i++) mkCoin(-150-Math.random()*600);

// PARTICLES
const pCnt=1500,pArr=new Float32Array(pCnt*3);
for(let i=0;i<pCnt;i++){pArr[i*3]=(Math.random()-0.5)*80;pArr[i*3+1]=Math.random()*30;pArr[i*3+2]=-Math.random()*800;}
const pGeo=new THREE.BufferGeometry();pGeo.setAttribute('position',new THREE.BufferAttribute(pArr,3));
const pMesh=new THREE.Points(pGeo,new THREE.PointsMaterial({size:0.25,color:0x88ff88,blending:THREE.AdditiveBlending,transparent:true,opacity:0.9}));
scene.add(pMesh);

// --- CHASE MONSTER ---
const monsterGroup = new THREE.Group();
// Body
const mBody = new THREE.Mesh(new THREE.SphereGeometry(4,16,16), new THREE.MeshStandardMaterial({color:0x220000,roughness:0.6}));
mBody.position.y = 5; monsterGroup.add(mBody);
// Eyes (glowing red)
const eyeMat = new THREE.MeshStandardMaterial({color:0xff0000,emissive:0xff0000,emissiveIntensity:3});
const lEye = new THREE.Mesh(new THREE.SphereGeometry(0.8,8,8),eyeMat);
lEye.position.set(-1.5,6.5,3); monsterGroup.add(lEye);
const rEye = new THREE.Mesh(new THREE.SphereGeometry(0.8,8,8),eyeMat);
rEye.position.set(1.5,6.5,3); monsterGroup.add(rEye);
// Horns
const hornMat = new THREE.MeshStandardMaterial({color:0x111111});
const lHorn = new THREE.Mesh(new THREE.ConeGeometry(0.6,4,6),hornMat);
lHorn.position.set(-2,9,0); lHorn.rotation.z=0.3; monsterGroup.add(lHorn);
const rHorn = new THREE.Mesh(new THREE.ConeGeometry(0.6,4,6),hornMat);
rHorn.position.set(2,9,0); rHorn.rotation.z=-0.3; monsterGroup.add(rHorn);
// Arms
const armMat = new THREE.MeshStandardMaterial({color:0x330000});
const lArm = new THREE.Mesh(new THREE.BoxGeometry(1.5,6,1.5),armMat);
lArm.position.set(-5,4,1); monsterGroup.add(lArm);
const rArm = new THREE.Mesh(new THREE.BoxGeometry(1.5,6,1.5),armMat);
rArm.position.set(5,4,1); monsterGroup.add(rArm);

monsterGroup.position.set(0, 0, -30); // Start behind
scene.add(monsterGroup);
let monsterDist = -30; // Distance behind player

// --- PLAYER (GLTF) ---
let playerModel=null, mixer=null, runAction=null, idleAction=null;
const loader = new THREE.GLTFLoader();
loader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Soldier.glb', function(gltf) {
    playerModel=gltf.scene; playerModel.scale.set(2.5,2.5,2.5);
    playerModel.position.set(0,0,5); playerModel.rotation.y=Math.PI;
    playerModel.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
    scene.add(playerModel);
    mixer=new THREE.AnimationMixer(playerModel);
    const anims=gltf.animations;
    if(anims&&anims.length>0){
        idleAction=mixer.clipAction(anims.find(a=>a.name.toLowerCase().includes('idle'))||anims[0]);
        runAction=mixer.clipAction(anims.find(a=>a.name.toLowerCase().includes('run'))||anims[1]);
        idleAction.play();
    }
    applySkin(selectedChar);
});

function applySkin(s) {
    if(!playerModel) return;
    let c=0xffffff;
    if(s==='explorer') c=0x8b5a2b;
    else if(s==='ninja') c=0x222222;
    else if(s==='knight') c=0xcccccc;
    else if(s==='adventurer') c=0xcc5533;
    playerModel.traverse(o=>{if(o.isMesh){
        o.material.color.setHex(c);
        o.material.metalness=s==='knight'?0.9:0.1;
        o.material.roughness=s==='knight'?0.1:0.9;
        o.material.emissive.setHex(s==='knight'?0x111122:0x000000);
    }});
}

let targetX=0, isJumping=false, jumpVel=0;
const GRAV=-0.015;

// --- HAND TRACKING ---
const vidEl=document.getElementById('input_video'), canEl=document.getElementById('output_canvas'), canCtx=canEl.getContext('2d');
const scoreEl=document.getElementById('score'), instrEl=document.getElementById('instructions');
let handDetected=false;

function onResults(r) {
    canCtx.save(); canCtx.clearRect(0,0,canEl.width,canEl.height);
    canCtx.drawImage(r.image,0,0,canEl.width,canEl.height);
    if(r.multiHandLandmarks&&r.multiHandLandmarks.length>0) {
        handDetected=true;
        const lm=r.multiHandLandmarks[0];
        drawConnectors(canCtx,lm,HAND_CONNECTIONS,{color:'#00FF00',lineWidth:2});
        drawLandmarks(canCtx,lm,{color:'#FF0000',lineWidth:1});
        const hx=lm[0].x, hy=lm[0].y;
        if(hx>0.65) targetX=-8; else if(hx<0.35) targetX=8; else targetX=0;
        if(hy<0.3&&!isJumping&&playerModel&&playerModel.position.y<=0.1){isJumping=true;jumpVel=0.45;playSound('jump');}
    } else handDetected=false;
    canCtx.restore();
}

const hands=new Hands({locateFile:f=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`});
hands.setOptions({maxNumHands:1,modelComplexity:1,minDetectionConfidence:0.6,minTrackingConfidence:0.6});
hands.onResults(onResults);
const cam=new Camera(vidEl,{onFrame:async()=>{await hands.send({image:vidEl});},width:320,height:240});
cam.start();

// --- GAME STATE ---
let isPlaying=false, gameSpeed=0, baseSpeed=0.5, score=0, timeScale=1;
let combo=0, comboTimer=0;
const goScreen=document.getElementById('game-over-screen'), finalScore=document.getElementById('final-score'), finalCoins=document.getElementById('final-coins');
const lightFlash=document.getElementById('lightning-flash');
const clock=new THREE.Clock();
let lightningTimer=0, monsterGrowlTimer=0;

// --- CINEMATIC INTRO ---
function playCinematicIntro(callback) {
    const introDiv=document.getElementById('cinematic-intro');
    const introText=document.getElementById('intro-text');
    const lines=["You found the cursed idol...","The temple is collapsing!","The demon awakens...","RUN!"];
    introDiv.classList.remove('hidden');
    let i=0;
    function showLine() {
        if(i>=lines.length){introDiv.classList.add('hidden');callback();return;}
        introText.style.animation='none';introText.offsetHeight;introText.style.animation='introFade 2s ease forwards';
        introText.innerText=lines[i]; i++;
        setTimeout(showLine, 2200);
    }
    showLine();
}

// --- LIGHTNING ---
function triggerLightning() {
    lightFlash.classList.add('flash');
    playSound('thunder');
    setTimeout(()=>lightFlash.classList.remove('flash'),100);
    setTimeout(()=>{lightFlash.classList.add('flash');setTimeout(()=>lightFlash.classList.remove('flash'),80);},200);
}

function resetGame() {
    score=0;coinsThisRun=0;baseSpeed=0.5;timeScale=1;combo=0;comboTimer=0;monsterDist=-30;
    comboEl.classList.add('hidden');
    if(playerModel) playerModel.position.set(0,0,5);
    targetX=0;isJumping=false;
    monsterGroup.position.set(0,0,-30);
    obstacles.forEach((o,i)=>{o.position.z=-200-(i*60)-Math.random()*100;const ls=[-8,0,8];o.position.x=ls[Math.floor(Math.random()*3)];});
    coinObjs.forEach((c,i)=>{c.mesh.position.z=-150-(i*40)-Math.random()*100;const ls=[-8,0,8];c.mesh.position.x=ls[Math.floor(Math.random()*3)];c.active=true;c.mesh.visible=true;});
}

// --- MAIN LOOP ---
function animate() {
    requestAnimationFrame(animate);
    const rawD=clock.getDelta(), delta=rawD*timeScale;
    if(mixer) mixer.update(delta);

    if(isPlaying&&playerModel) {
        // Lightning events
        lightningTimer+=rawD;
        if(lightningTimer>12+Math.random()*15){lightningTimer=0;triggerLightning();}

        // Monster growl
        monsterGrowlTimer+=rawD;
        if(monsterGrowlTimer>8+Math.random()*10){monsterGrowlTimer=0;playSound('growl');}

        if(handDetected) {
            gameSpeed=baseSpeed*timeScale;
            score+=0.05*timeScale; baseSpeed+=0.0001;
            scoreEl.innerText=`Score: ${Math.floor(score)}`;
            instrEl.innerText="Running..."; instrEl.style.color="#00ff00";
            if(idleAction&&idleAction.isRunning()){idleAction.stop();if(runAction)runAction.play();}
            else if(runAction&&!runAction.isRunning())runAction.play();

            // Monster slows down when you run
            monsterDist-=0.02;
            if(monsterDist<-40) monsterDist=-40;

            camera.fov+=(75+baseSpeed*20-camera.fov)*0.05;
            camera.updateProjectionMatrix();
        } else {
            gameSpeed*=0.9;
            instrEl.innerText="Show hand to run!"; instrEl.style.color="#ff3333";
            if(gameSpeed<0.1&&runAction&&runAction.isRunning()){runAction.stop();if(idleAction)idleAction.play();}

            // Monster catches up when you stop!
            monsterDist+=0.08;
        }

        // COMBO TIMER
        comboTimer-=rawD;
        if(comboTimer<=0&&combo>0){combo=0;comboEl.classList.add('hidden');}

        // CHASE MONSTER position
        monsterGroup.position.z=playerModel.position.z+monsterDist;
        monsterGroup.position.x+=(playerModel.position.x-monsterGroup.position.x)*0.02;
        // Monster animation: bob and sway
        monsterGroup.position.y=Math.sin(Date.now()*0.003)*1;
        lArm.rotation.x=Math.sin(Date.now()*0.005)*0.8;
        rArm.rotation.x=-Math.sin(Date.now()*0.005)*0.8;

        // Monster caught you!
        if(monsterDist>-3){playSound('crash');isPlaying=false;stopFoot();finalScore.innerText=`Final Score: ${Math.floor(score)}`;finalCoins.innerText=`Coins earned: ${coinsThisRun}`;goScreen.classList.remove('hidden');updateShopUI();}

        // Camera tilt
        camera.rotation.z+=((targetX/-8)*0.1-camera.rotation.z)*0.1;

        // Player move
        playerModel.position.x+=(targetX-playerModel.position.x)*0.1;
        pLight.position.x=playerModel.position.x;

        // Jump + Slow Mo
        let shX=0,shY=0;
        if(isJumping||playerModel.position.y>0){
            timeScale=0.4;
            playerModel.position.y+=jumpVel*(timeScale*2.5);
            jumpVel+=GRAV*(timeScale*2.5);
            shX=(Math.random()-0.5)*0.1;shY=(Math.random()-0.5)*0.1;
            if(playerModel.position.y<=0){playerModel.position.y=0;isJumping=false;jumpVel=0;timeScale=1;shY=-0.5;}
        }
        camera.position.x=shX; camera.position.y=8+shY;

        // Particles
        const pos=pMesh.geometry.attributes.position.array;
        for(let i=0;i<pCnt;i++){pos[i*3+2]+=gameSpeed*1.5;if(pos[i*3+2]>20)pos[i*3+2]=-800;}
        pMesh.geometry.attributes.position.needsUpdate=true;

        // Scenery
        scenery.forEach(o=>{o.position.z+=gameSpeed;if(o.position.z>20){o.position.z-=800;const s=Math.random()>0.5?1:-1;o.position.x=s*(16+Math.random()*60);}});

        // Obstacles
        obstacles.forEach(o=>{
            o.position.z+=gameSpeed;
            const dz=Math.abs(o.position.z-playerModel.position.z),dx=Math.abs(o.position.x-playerModel.position.x),dy=Math.abs(o.position.y-(playerModel.position.y+2.5));
            if(dz<2.5&&dx<2.5&&dy<3){playSound('crash');isPlaying=false;stopFoot();finalScore.innerText=`Final Score: ${Math.floor(score)}`;finalCoins.innerText=`Coins earned: ${coinsThisRun}`;goScreen.classList.remove('hidden');updateShopUI();}
            if(o.position.z>20){o.position.z-=800;const ls=[-8,0,8];o.position.x=ls[Math.floor(Math.random()*3)];}
        });

        // Coins + Combo
        coinObjs.forEach(c=>{
            if(c.active){c.mesh.position.z+=gameSpeed;c.mesh.rotation.y+=0.1*timeScale;
                const dz=Math.abs(c.mesh.position.z-playerModel.position.z),dx=Math.abs(c.mesh.position.x-playerModel.position.x),dy=Math.abs(c.mesh.position.y-(playerModel.position.y+2.5));
                if(dz<2&&dx<2&&dy<3){
                    c.active=false;c.mesh.visible=false;
                    combo++;comboTimer=3;
                    const earned=combo>=5?3:combo>=3?2:1;
                    coins+=earned;coinsThisRun+=earned;
                    coinCountEl.innerText=coins;saveData();playSound('coin');
                    comboCountEl.innerText=combo;
                    if(combo>=2) comboEl.classList.remove('hidden');
                }
            } else c.mesh.position.z+=gameSpeed;
            if(c.mesh.position.z>20){c.mesh.position.z-=800;const ls=[-8,0,8];c.mesh.position.x=ls[Math.floor(Math.random()*3)];c.active=true;c.mesh.visible=true;}
        });

        ground.position.z+=gameSpeed;path.position.z+=gameSpeed;
        if(ground.position.z>-300){ground.position.z=-400;path.position.z=-400;}
    } else {
        coinObjs.forEach(c=>{if(c.active) c.mesh.rotation.y+=0.05;});
        // Monster idle animation on menus
        monsterGroup.position.y=Math.sin(Date.now()*0.002)*0.5;
    }
    composer.render(rawD);
}

// RESIZE
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();});

// UI
const startBtn=document.getElementById('start-btn'), restartBtn=document.getElementById('restart-btn'), startScreen=document.getElementById('start-screen');

startBtn.addEventListener('click',()=>{
    startScreen.classList.add('hidden');
    startAmbient(); startFoot();
    playCinematicIntro(()=>{resetGame();isPlaying=true;if(idleAction)idleAction.stop();if(runAction)runAction.play();});
});

restartBtn.addEventListener('click',()=>{
    goScreen.classList.add('hidden'); startFoot(); resetGame(); isPlaying=true;
    if(idleAction)idleAction.stop();if(runAction)runAction.play();
});

animate();
