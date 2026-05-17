// Temple Run: AAA Cinematic Overhaul
console.log("Initializing AAA Post-Processing, Particles, and Cinematic Camera...");

// --- ECONOMY & UI SETUP ---
let coins = 0;
let unlockedChars = ['explorer'];
let selectedChar = 'explorer';

const savedData = localStorage.getItem('templeRunData');
if (savedData) {
    const data = JSON.parse(savedData);
    coins = data.coins || 0;
    unlockedChars = data.unlockedChars || ['explorer'];
    selectedChar = data.selectedChar || 'explorer';
}

function saveData() {
    localStorage.setItem('templeRunData', JSON.stringify({ coins, unlockedChars, selectedChar }));
}

const coinCountEl = document.getElementById('coin-count');
coinCountEl.innerText = coins;

const charCards = {
    'explorer': { el: document.getElementById('card-explorer'), price: 0 },
    'ninja': { el: document.getElementById('card-ninja'), price: 50 },
    'knight': { el: document.getElementById('card-knight'), price: 100 }
};

function updateShopUI() {
    coinCountEl.innerText = coins;
    for (const [char, data] of Object.entries(charCards)) {
        if (unlockedChars.includes(char)) {
            data.el.classList.remove('locked');
            data.el.querySelector('p').innerText = 'Unlocked';
        }
        if (char === selectedChar) {
            data.el.classList.add('selected');
        } else {
            data.el.classList.remove('selected');
        }
    }
}
updateShopUI();

Object.entries(charCards).forEach(([char, data]) => {
    data.el.addEventListener('click', () => {
        if (unlockedChars.includes(char)) {
            selectedChar = char;
            saveData();
            updateShopUI();
            applySkin(char);
        } else {
            if (coins >= data.price) {
                coins -= data.price;
                unlockedChars.push(char);
                selectedChar = char;
                saveData();
                updateShopUI();
                playSound('coin');
                applySkin(char);
            } else {
                alert("Not enough coins!");
            }
        }
    });
});

// --- AUDIO SYNTHESIS ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let windOscillator;
let footstepInterval = null;

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'jump') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'crash') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.5);
        gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    } else if (type === 'coin') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'footstep') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(80, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    }
}

function startAmbientSound() {
    if (windOscillator) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    windOscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    windOscillator.type = 'triangle';
    windOscillator.frequency.value = 40; // Deep creepy rumble
    gainNode.gain.value = 0.2;
    windOscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    windOscillator.start();
}

function startFootsteps() {
    if(footstepInterval) return;
    footstepInterval = setInterval(() => {
        if(isPlaying && !isJumping && handDetected) playSound('footstep');
    }, 350); // Rhythmic running
}

function stopFootsteps() {
    if(footstepInterval) {
        clearInterval(footstepInterval);
        footstepInterval = null;
    }
}

// --- PROCEDURAL TEXTURES ---
function createNoiseTexture(color1, color2) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    for (let x = 0; x < 256; x++) {
        for (let y = 0; y < 256; y++) {
            ctx.fillStyle = Math.random() > 0.5 ? color1 : color2;
            ctx.fillRect(x, y, 1, 1);
        }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 100);
    return texture;
}

// --- THREE.JS SETUP ---
const scene = new THREE.Scene();
// Deep, dense volumetric fog illusion
scene.fog = new THREE.FogExp2(0x020804, 0.045); 
scene.background = new THREE.Color(0x010402);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 8, 15);
camera.lookAt(0, 2, -15);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
// Enable proper colors for post-processing
renderer.toneMapping = THREE.ReinhardToneMapping;
document.getElementById('game-container').appendChild(renderer.domElement);

// --- POST-PROCESSING (BLOOM) ---
const renderScene = new THREE.RenderPass(scene, camera);
const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.1;
bloomPass.strength = 1.5; // Intense AAA Bloom
bloomPass.radius = 0.5;

const composer = new THREE.EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// --- LIGHTING ---
const ambientLight = new THREE.AmbientLight(0x223344, 2.0); // Moody blue moonlight
scene.add(ambientLight);

const playerLight = new THREE.PointLight(0xff8800, 3.5, 80); // Bright warm torch/flashlight
playerLight.position.set(0, 6, 12);
playerLight.castShadow = true;
scene.add(playerLight);

// --- ENVIRONMENT ---
const groundTex = createNoiseTexture('#081208', '#030803');
const groundGeometry = new THREE.PlaneGeometry(400, 1000, 40, 100);
const groundMaterial = new THREE.MeshStandardMaterial({ map: groundTex, roughness: 1.0 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.z = -400;
ground.receiveShadow = true;
scene.add(ground);

const pathTex = createNoiseTexture('#151515', '#2a2a2a');
const pathGeometry = new THREE.PlaneGeometry(24, 1000);
const pathMaterial = new THREE.MeshStandardMaterial({ map: pathTex, roughness: 0.8 });
const path = new THREE.Mesh(pathGeometry, pathMaterial);
path.rotation.x = -Math.PI / 2;
path.position.y = 0.05;
path.position.z = -400;
path.receiveShadow = true;
scene.add(path);

// --- PROCEDURAL SCENERY & OBSTACLES ---
const sceneryObjects = [];
const obstacles = [];
const coinObjects = [];

const treeMaterial = new THREE.MeshStandardMaterial({ color: 0x021102 });
const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x1f130c });
const woodTex = createNoiseTexture('#1f130c', '#150d08');
const logMaterial = new THREE.MeshStandardMaterial({ map: woodTex });
const stoneTex = createNoiseTexture('#444', '#333');
const pillarMaterial = new THREE.MeshStandardMaterial({ map: stoneTex });
const coinMaterial = new THREE.MeshStandardMaterial({ color: 0xffe600, metalness: 1.0, roughness: 0.1, emissive: 0x443300 }); // Glowing coins!

function createTree(x, z) {
    const treeGroup = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 6), trunkMaterial);
    trunk.position.y = 3;
    trunk.castShadow = true;
    const leaves = new THREE.Mesh(new THREE.ConeGeometry(4, 20, 8), treeMaterial);
    leaves.position.y = 12;
    leaves.castShadow = true;
    treeGroup.add(trunk);
    treeGroup.add(leaves);
    treeGroup.position.set(x, 0, z);
    scene.add(treeGroup);
    sceneryObjects.push(treeGroup);
}

function createObstacle(z) {
    const isLog = Math.random() > 0.5;
    let obs;
    if (isLog) {
        obs = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 6), logMaterial);
        obs.rotation.z = Math.PI / 2;
        obs.position.y = 1.5;
    } else {
        obs = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 8), pillarMaterial);
        obs.position.y = 4;
    }
    const lanes = [-8, 0, 8];
    obs.position.x = lanes[Math.floor(Math.random() * lanes.length)];
    obs.position.z = z;
    obs.castShadow = true;
    scene.add(obs);
    obstacles.push(obs);
}

function createCoin(z) {
    const coin = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.4, 16, 32), coinMaterial);
    const lanes = [-8, 0, 8];
    coin.position.x = lanes[Math.floor(Math.random() * lanes.length)];
    coin.position.y = 2.5;
    coin.position.z = z;
    coin.castShadow = true;
    scene.add(coin);
    coinObjects.push({ mesh: coin, active: true });
}

for (let i = 0; i < 100; i++) {
    const side = Math.random() > 0.5 ? 1 : -1;
    createTree(side * (16 + Math.random() * 60), -Math.random() * 800);
}
for (let i = 0; i < 20; i++) {
    createObstacle(-200 - Math.random() * 600);
}
for (let i = 0; i < 30; i++) {
    createCoin(-150 - Math.random() * 600);
}

// --- PARTICLE SYSTEM (Dust/Embers) ---
const particleCount = 1500;
const particlesGeo = new THREE.BufferGeometry();
const posArray = new Float32Array(particleCount * 3);
for(let i = 0; i < particleCount; i++) {
    posArray[i*3] = (Math.random() - 0.5) * 80; // X
    posArray[i*3 + 1] = Math.random() * 30;     // Y
    posArray[i*3 + 2] = -Math.random() * 800;   // Z
}
particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMat = new THREE.PointsMaterial({
    size: 0.25,
    color: 0x88ff88, // Glowing mystical green
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.9
});
const particleMesh = new THREE.Points(particlesGeo, particlesMat);
scene.add(particleMesh);


// --- REAL RIGGED 3D CHARACTER (GLTF) ---
let playerModel = null;
let mixer = null;
let runAction = null;
let idleAction = null;

const gltfLoader = new THREE.GLTFLoader();
gltfLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Soldier.glb', function(gltf) {
    playerModel = gltf.scene;
    playerModel.scale.set(2.5, 2.5, 2.5); 
    playerModel.position.set(0, 0, 5);
    playerModel.rotation.y = Math.PI; 
    
    playerModel.traverse(function(object) {
        if (object.isMesh) {
            object.castShadow = true;
            object.receiveShadow = true;
        }
    });
    scene.add(playerModel);

    mixer = new THREE.AnimationMixer(playerModel);
    const animations = gltf.animations;
    if(animations && animations.length > 0) {
        idleAction = mixer.clipAction(animations.find(a => a.name.toLowerCase().includes('idle')) || animations[0]);
        runAction = mixer.clipAction(animations.find(a => a.name.toLowerCase().includes('run')) || animations[1]);
        
        idleAction.play(); 
    }
    applySkin(selectedChar);
});

function applySkin(skinName) {
    if (!playerModel) return;
    let colorHex = 0xffffff;
    if (skinName === 'explorer') colorHex = 0x8b5a2b; 
    else if (skinName === 'ninja') colorHex = 0x222222; 
    else if (skinName === 'knight') colorHex = 0xcccccc; 

    playerModel.traverse(function(object) {
        if (object.isMesh) {
            object.material.color.setHex(colorHex);
            if (skinName === 'knight') {
                object.material.metalness = 0.9;
                object.material.roughness = 0.1;
                object.material.emissive.setHex(0x111122); // Glowing runes vibe
            } else {
                object.material.metalness = 0.1;
                object.material.roughness = 0.9;
                object.material.emissive.setHex(0x000000);
            }
        }
    });
}

let targetX = 0; 
let isJumping = false;
let jumpVelocity = 0;
const GRAVITY = -0.015; 

// --- AI HAND TRACKING (MediaPipe) ---
const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const scoreElement = document.getElementById('score');
const instructionsElement = document.getElementById('instructions');
let handDetected = false;

function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        handDetected = true;
        const landmarks = results.multiHandLandmarks[0];
        
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 2});
        drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 1});

        const handX = landmarks[0].x; 
        const handY = landmarks[0].y; 

        if (handX > 0.65) {
            targetX = -8; 
        } else if (handX < 0.35) {
            targetX = 8;  
        } else {
            targetX = 0;
        }

        if (handY < 0.3 && !isJumping && playerModel && playerModel.position.y <= 0.1) {
            isJumping = true;
            jumpVelocity = 0.45; 
            playSound('jump');
        }
    } else {
        handDetected = false;
    }
    canvasCtx.restore();
}

const hands = new Hands({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.6
});
hands.onResults(onResults);

const cameraObj = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({image: videoElement});
  },
  width: 320,
  height: 240
});
cameraObj.start();

// --- GAME LOGIC & ANIMATION LOOP ---
let isPlaying = false;
let gameSpeed = 0;
let baseSpeed = 0.5; 
let score = 0;
let timeScale = 1.0; // For slow motion!
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreElement = document.getElementById('final-score');
const clock = new THREE.Clock();

function resetGame() {
    score = 0;
    baseSpeed = 0.5; 
    timeScale = 1.0;
    if(playerModel) playerModel.position.set(0, 0, 5);
    targetX = 0;
    isJumping = false;
    
    obstacles.forEach((obs, index) => {
        obs.position.z = -200 - (index * 60) - Math.random() * 100;
        const lanes = [-8, 0, 8];
        obs.position.x = lanes[Math.floor(Math.random() * lanes.length)];
    });
    coinObjects.forEach((c, index) => {
        c.mesh.position.z = -150 - (index * 40) - Math.random() * 100;
        const lanes = [-8, 0, 8];
        c.mesh.position.x = lanes[Math.floor(Math.random() * lanes.length)];
        c.active = true;
        c.mesh.visible = true;
    });
}

function animate() {
    requestAnimationFrame(animate);
    const rawDelta = clock.getDelta();
    const delta = rawDelta * timeScale;
    
    if (mixer) mixer.update(delta); // Skeletal animations

    if (isPlaying && playerModel) {
        if (handDetected) {
            gameSpeed = baseSpeed * timeScale;
            score += 0.05 * timeScale;
            baseSpeed += 0.0001; // Acceleration
            scoreElement.innerText = `Score: ${Math.floor(score)}`;
            instructionsElement.innerText = "Running... Keep hand visible!";
            instructionsElement.style.color = "#00ff00";
            
            if (idleAction && idleAction.isRunning()) {
                idleAction.stop();
                if(runAction) runAction.play();
            } else if (runAction && !runAction.isRunning()) {
                runAction.play();
            }

            // DYNAMIC CINEMATIC CAMERA (FOV widens with speed)
            const targetFov = 75 + (baseSpeed * 20);
            camera.fov += (targetFov - camera.fov) * 0.05;
            camera.updateProjectionMatrix();

        } else {
            gameSpeed *= 0.9;
            instructionsElement.innerText = "Show hand to run!";
            instructionsElement.style.color = "#ff3333";
            
            if (gameSpeed < 0.1 && runAction && runAction.isRunning()) {
                runAction.stop();
                if(idleAction) idleAction.play();
            }
        }

        // CAMERA TILT on lane change
        const targetTilt = (targetX / -8) * 0.1; // Roll slightly left/right
        camera.rotation.z += (targetTilt - camera.rotation.z) * 0.1;

        // Player Movement
        playerModel.position.x += (targetX - playerModel.position.x) * 0.1;
        playerLight.position.x = playerModel.position.x;

        // JUMP PHYSICS & SLOW MOTION (MATRIX EFFECT)
        let shakeX = 0, shakeY = 0;
        if (isJumping || playerModel.position.y > 0) {
            timeScale = 0.4; // Enter slow motion while in air!
            
            // Adjust physics multipliers for timescale
            playerModel.position.y += jumpVelocity * (timeScale * 2.5);
            jumpVelocity += GRAVITY * (timeScale * 2.5);
            
            // Camera Shake during jump
            shakeX = (Math.random() - 0.5) * 0.1;
            shakeY = (Math.random() - 0.5) * 0.1;
            
            if (playerModel.position.y <= 0) {
                playerModel.position.y = 0;
                isJumping = false;
                jumpVelocity = 0;
                timeScale = 1.0; // Return to real time
                
                // Landing shake
                shakeY = -0.5; 
            }
        }
        camera.position.x = shakeX;
        camera.position.y = 8 + shakeY;

        // Particles
        const positions = particleMesh.geometry.attributes.position.array;
        for(let i=0; i<particleCount; i++) {
            positions[i*3 + 2] += gameSpeed * 1.5; // Move towards camera
            if (positions[i*3 + 2] > 20) {
                positions[i*3 + 2] = -800;
            }
        }
        particleMesh.geometry.attributes.position.needsUpdate = true;

        // Move Scenery
        sceneryObjects.forEach(obj => {
            obj.position.z += gameSpeed;
            if (obj.position.z > 20) {
                obj.position.z -= 800;
                const side = Math.random() > 0.5 ? 1 : -1;
                obj.position.x = side * (16 + Math.random() * 60);
            }
        });
        
        // Move Obstacles and Detect Collision
        obstacles.forEach(obs => {
            obs.position.z += gameSpeed;
            
            const distZ = Math.abs(obs.position.z - playerModel.position.z);
            const distX = Math.abs(obs.position.x - playerModel.position.x);
            const distY = Math.abs(obs.position.y - (playerModel.position.y + 2.5)); 
            
            if (distZ < 2.5 && distX < 2.5 && distY < 3) {
                // CRAAASH!
                playSound('crash');
                isPlaying = false;
                stopFootsteps();
                finalScoreElement.innerText = `Final Score: ${Math.floor(score)}`;
                gameOverScreen.classList.remove('hidden');
                updateShopUI(); 
            }

            if (obs.position.z > 20) {
                obs.position.z -= 800;
                const lanes = [-8, 0, 8];
                obs.position.x = lanes[Math.floor(Math.random() * lanes.length)];
            }
        });

        // Coins
        coinObjects.forEach(c => {
            if (c.active) {
                c.mesh.position.z += gameSpeed;
                c.mesh.rotation.y += 0.1 * timeScale;
                
                const distZ = Math.abs(c.mesh.position.z - playerModel.position.z);
                const distX = Math.abs(c.mesh.position.x - playerModel.position.x);
                const distY = Math.abs(c.mesh.position.y - (playerModel.position.y + 2.5));
                
                if (distZ < 2 && distX < 2 && distY < 3) {
                    c.active = false;
                    c.mesh.visible = false;
                    coins += 1;
                    coinCountEl.innerText = coins;
                    saveData();
                    playSound('coin');
                }
            } else {
                c.mesh.position.z += gameSpeed;
            }

            if (c.mesh.position.z > 20) {
                c.mesh.position.z -= 800;
                const lanes = [-8, 0, 8];
                c.mesh.position.x = lanes[Math.floor(Math.random() * lanes.length)];
                c.active = true;
                c.mesh.visible = true;
            }
        });

        ground.position.z += gameSpeed;
        path.position.z += gameSpeed;
        if (ground.position.z > -300) {
            ground.position.z = -400;
            path.position.z = -400;
        }
    } else {
        coinObjects.forEach(c => { if(c.active) c.mesh.rotation.y += 0.05; });
    }
    
    // RENDER USING EFFECT COMPOSER INSTEAD OF SCENE DIRECTLY!
    composer.render(rawDelta);
}

// Handle window resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// UI elements
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const startScreen = document.getElementById('start-screen');

startBtn.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    startAmbientSound();
    startFootsteps();
    resetGame();
    isPlaying = true;
    
    if (idleAction) idleAction.stop();
    if (runAction) runAction.play();
});

restartBtn.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    startFootsteps();
    resetGame();
    isPlaying = true;
    
    if (idleAction) idleAction.stop();
    if (runAction) runAction.play();
});

animate();
