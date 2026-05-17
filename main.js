// Temple Run: Realism & Speed Tuning Update
console.log("Initializing Real Rigged Characters and Tuning Speed...");

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
    }
}

function startAmbientSound() {
    if (windOscillator) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    windOscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    windOscillator.type = 'triangle';
    windOscillator.frequency.value = 50;
    gainNode.gain.value = 0.1;
    windOscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    windOscillator.start();
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
scene.fog = new THREE.FogExp2(0x040404, 0.035);
scene.background = new THREE.Color(0x020202);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 8, 15);
camera.lookAt(0, 2, -15);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.getElementById('game-container').appendChild(renderer.domElement);

// --- LIGHTING ---
const ambientLight = new THREE.AmbientLight(0x222233, 1.5);
scene.add(ambientLight);

const playerLight = new THREE.PointLight(0xffaa00, 2.5, 60);
playerLight.position.set(0, 5, 10);
playerLight.castShadow = true;
scene.add(playerLight);

// --- ENVIRONMENT ---
const groundTex = createNoiseTexture('#0a110a', '#050a05');
const groundGeometry = new THREE.PlaneGeometry(400, 1000, 40, 100);
const groundMaterial = new THREE.MeshStandardMaterial({ map: groundTex, roughness: 1.0 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.z = -400;
ground.receiveShadow = true;
scene.add(ground);

const pathTex = createNoiseTexture('#1a1a1a', '#222222');
const pathGeometry = new THREE.PlaneGeometry(24, 1000);
const pathMaterial = new THREE.MeshStandardMaterial({ map: pathTex, roughness: 0.9 });
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

const treeMaterial = new THREE.MeshStandardMaterial({ color: 0x051505 });
const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x2b1d14 });
const woodTex = createNoiseTexture('#2b1d14', '#1f130c');
const logMaterial = new THREE.MeshStandardMaterial({ map: woodTex });
const stoneTex = createNoiseTexture('#555555', '#444444');
const pillarMaterial = new THREE.MeshStandardMaterial({ map: stoneTex });
const coinMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 });

function createTree(x, z) {
    const treeGroup = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 4), trunkMaterial);
    trunk.position.y = 2;
    trunk.castShadow = true;
    const leaves = new THREE.Mesh(new THREE.ConeGeometry(3, 15, 8), treeMaterial);
    leaves.position.y = 9.5;
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
    const coin = new THREE.Mesh(new THREE.TorusGeometry(1, 0.3, 8, 16), coinMaterial);
    const lanes = [-8, 0, 8];
    coin.position.x = lanes[Math.floor(Math.random() * lanes.length)];
    coin.position.y = 2;
    coin.position.z = z;
    coin.castShadow = true;
    scene.add(coin);
    coinObjects.push({ mesh: coin, active: true });
}

for (let i = 0; i < 80; i++) {
    const side = Math.random() > 0.5 ? 1 : -1;
    createTree(side * (15 + Math.random() * 50), -Math.random() * 800);
}
for (let i = 0; i < 15; i++) {
    createObstacle(-200 - Math.random() * 600);
}
for (let i = 0; i < 20; i++) {
    createCoin(-150 - Math.random() * 600);
}

// --- REAL RIGGED 3D CHARACTER (GLTF) ---
let playerModel = null;
let mixer = null;
let runAction = null;
let idleAction = null;

const gltfLoader = new THREE.GLTFLoader();
gltfLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Soldier.glb', function(gltf) {
    playerModel = gltf.scene;
    playerModel.scale.set(2.5, 2.5, 2.5); // Make it a good size
    playerModel.position.set(0, 0, 5);
    playerModel.rotation.y = Math.PI; // Face away from camera
    
    playerModel.traverse(function(object) {
        if (object.isMesh) {
            object.castShadow = true;
            object.receiveShadow = true;
        }
    });
    scene.add(playerModel);

    // Setup Animations
    mixer = new THREE.AnimationMixer(playerModel);
    const animations = gltf.animations;
    if(animations && animations.length > 0) {
        // Soldier.glb has Idle at 0, Run at 1
        idleAction = mixer.clipAction(animations.find(a => a.name.toLowerCase().includes('idle')) || animations[0]);
        runAction = mixer.clipAction(animations.find(a => a.name.toLowerCase().includes('run')) || animations[1]);
        
        idleAction.play(); // Start idle on the splash screen
    }
    
    applySkin(selectedChar);
});

function applySkin(skinName) {
    if (!playerModel) return;
    let colorHex = 0xffffff;
    
    if (skinName === 'explorer') colorHex = 0x8b5a2b; // Khaki/Brown
    else if (skinName === 'ninja') colorHex = 0x222222; // Dark
    else if (skinName === 'knight') colorHex = 0xcccccc; // Silver

    playerModel.traverse(function(object) {
        if (object.isMesh) {
            object.material.color.setHex(colorHex);
            if (skinName === 'knight') {
                object.material.metalness = 0.8;
                object.material.roughness = 0.2;
            } else {
                object.material.metalness = 0.1;
                object.material.roughness = 0.8;
            }
        }
    });
}

let targetX = 0; 
let isJumping = false;
let jumpVelocity = 0;
// TUNED GRAVITY FOR SLOWER SPEED
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
            jumpVelocity = 0.45; // Tuned jump velocity
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
// TUNED SPEED: Much slower base speed for realistic pacing
let baseSpeed = 0.5; 
let score = 0;
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreElement = document.getElementById('final-score');
const clock = new THREE.Clock();

function resetGame() {
    score = 0;
    baseSpeed = 0.5; 
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
    const delta = clock.getDelta();
    
    if (mixer) mixer.update(delta); // Update 3D Character Animation

    if (isPlaying && playerModel) {
        if (handDetected) {
            gameSpeed = baseSpeed;
            score += 0.05;
            baseSpeed += 0.0001; // Slower difficulty acceleration
            scoreElement.innerText = `Score: ${Math.floor(score)}`;
            instructionsElement.innerText = "Running... Keep hand visible!";
            instructionsElement.style.color = "#00ff00";
            
            // Play run animation if not already running
            if (idleAction && idleAction.isRunning()) {
                idleAction.stop();
                if(runAction) runAction.play();
            } else if (runAction && !runAction.isRunning()) {
                runAction.play();
            }

        } else {
            gameSpeed *= 0.9;
            instructionsElement.innerText = "Show hand to run!";
            instructionsElement.style.color = "#ff3333";
            
            // Play idle animation if stopped
            if (gameSpeed < 0.1 && runAction && runAction.isRunning()) {
                runAction.stop();
                if(idleAction) idleAction.play();
            }
        }

        playerModel.position.x += (targetX - playerModel.position.x) * 0.1;
        playerLight.position.x = playerModel.position.x;

        if (isJumping || playerModel.position.y > 0) {
            playerModel.position.y += jumpVelocity;
            jumpVelocity += GRAVITY;
            
            if (playerModel.position.y <= 0) {
                playerModel.position.y = 0;
                isJumping = false;
                jumpVelocity = 0;
            }
        }

        // Move Scenery
        sceneryObjects.forEach(obj => {
            obj.position.z += gameSpeed;
            if (obj.position.z > 20) {
                obj.position.z -= 800;
                const side = Math.random() > 0.5 ? 1 : -1;
                obj.position.x = side * (15 + Math.random() * 50);
            }
        });
        
        // Move Obstacles and Detect Collision
        obstacles.forEach(obs => {
            obs.position.z += gameSpeed;
            
            // Collision Logic with new Rigged Character
            const distZ = Math.abs(obs.position.z - playerModel.position.z);
            const distX = Math.abs(obs.position.x - playerModel.position.x);
            // Player Y is at feet (0), so center of body is roughly +2.5
            const distY = Math.abs(obs.position.y - (playerModel.position.y + 2.5)); 
            
            if (distZ < 2.5 && distX < 2.5 && distY < 3) {
                // CRAAASH!
                playSound('crash');
                isPlaying = false;
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

        // Move Coins and Detect Collection
        coinObjects.forEach(c => {
            if (c.active) {
                c.mesh.position.z += gameSpeed;
                c.mesh.rotation.y += 0.1;
                
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
    
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
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
    resetGame();
    isPlaying = true;
    
    // Switch to run animation immediately when starting
    if (idleAction) idleAction.stop();
    if (runAction) runAction.play();
});

restartBtn.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    resetGame();
    isPlaying = true;
    
    if (idleAction) idleAction.stop();
    if (runAction) runAction.play();
});

animate();
