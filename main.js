// Temple Run: Creepy Forest - Phase 4 (Audio & Gameplay Loop)
console.log("Initializing Game Loop and Audio...");

// --- AUDIO SYNTHESIS (No external assets needed) ---
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
        osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'crash') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.5);
        gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    }
}

function startAmbientSound() {
    if (windOscillator) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    windOscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    // Simulate creepy wind
    windOscillator.type = 'triangle';
    windOscillator.frequency.value = 50;
    
    gainNode.gain.value = 0.1;
    
    windOscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    windOscillator.start();
}

// --- THREE.JS SETUP ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x040404, 0.035);
scene.background = new THREE.Color(0x020202);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 7, 15);
camera.lookAt(0, 2, -20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
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
const groundGeometry = new THREE.PlaneGeometry(400, 1000, 40, 100);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x0a110a, roughness: 0.9 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.z = -400;
ground.receiveShadow = true;
scene.add(ground);

const pathGeometry = new THREE.PlaneGeometry(24, 1000);
const pathMaterial = new THREE.MeshStandardMaterial({ color: 0x1a0f0f, roughness: 1.0 });
const path = new THREE.Mesh(pathGeometry, pathMaterial);
path.rotation.x = -Math.PI / 2;
path.position.y = 0.05;
path.position.z = -400;
path.receiveShadow = true;
scene.add(path);

// --- PROCEDURAL OBJECTS (Trees & Obstacles) ---
const sceneryObjects = [];
const obstacles = [];

const treeGeometry = new THREE.ConeGeometry(3, 15, 8);
const treeMaterial = new THREE.MeshStandardMaterial({ color: 0x051505 });
const trunkGeometry = new THREE.CylinderGeometry(0.8, 0.8, 4);
const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x2b1d14 });

const obstacleGeometry = new THREE.BoxGeometry(4, 4, 2);
const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 }); // Tombstone color

function createTree(x, z) {
    const treeGroup = new THREE.Group();
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 2;
    trunk.castShadow = true;
    const leaves = new THREE.Mesh(treeGeometry, treeMaterial);
    leaves.position.y = 9.5;
    leaves.castShadow = true;
    treeGroup.add(trunk);
    treeGroup.add(leaves);
    treeGroup.position.set(x, 0, z);
    scene.add(treeGroup);
    sceneryObjects.push(treeGroup);
}

function createObstacle(z) {
    const obs = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    // Random lane: -8, 0, 8
    const lanes = [-8, 0, 8];
    obs.position.x = lanes[Math.floor(Math.random() * lanes.length)];
    obs.position.y = 2;
    obs.position.z = z;
    obs.castShadow = true;
    scene.add(obs);
    obstacles.push(obs);
}

for (let i = 0; i < 80; i++) {
    const z = -Math.random() * 800;
    const side = Math.random() > 0.5 ? 1 : -1;
    const x = side * (15 + Math.random() * 50);
    createTree(x, z);
}

for (let i = 0; i < 15; i++) {
    createObstacle(-200 - Math.random() * 600);
}

// --- PLAYER ---
const playerGeometry = new THREE.BoxGeometry(2, 4, 2);
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xff3333 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.set(0, 2, 5);
player.castShadow = true;
scene.add(player);

let targetX = 0; 
let isJumping = false;
let jumpVelocity = 0;
const GRAVITY = -0.02;

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

        if (handY < 0.3 && !isJumping && player.position.y <= 2.1) {
            isJumping = true;
            jumpVelocity = 0.5;
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
let baseSpeed = 1.2;
let score = 0;
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreElement = document.getElementById('final-score');

function resetGame() {
    score = 0;
    baseSpeed = 1.2;
    player.position.set(0, 2, 5);
    targetX = 0;
    isJumping = false;
    
    obstacles.forEach((obs, index) => {
        obs.position.z = -100 - (index * 60) - Math.random() * 100;
        const lanes = [-8, 0, 8];
        obs.position.x = lanes[Math.floor(Math.random() * lanes.length)];
    });
}

function animate() {
    requestAnimationFrame(animate);
    
    if (isPlaying) {
        if (handDetected) {
            gameSpeed = baseSpeed;
            score += 0.1;
            baseSpeed += 0.0005; // Gradually increase difficulty
            scoreElement.innerText = `Score: ${Math.floor(score)}`;
            instructionsElement.innerText = "Running... Keep hand visible!";
            instructionsElement.style.color = "#00ff00";
        } else {
            gameSpeed *= 0.9;
            instructionsElement.innerText = "Show hand to run!";
            instructionsElement.style.color = "#ff3333";
        }

        player.position.x += (targetX - player.position.x) * 0.1;
        playerLight.position.x = player.position.x;

        if (isJumping || player.position.y > 2) {
            player.position.y += jumpVelocity;
            jumpVelocity += GRAVITY;
            
            if (player.position.y <= 2) {
                player.position.y = 2;
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
            
            // Collision Logic
            const distZ = Math.abs(obs.position.z - player.position.z);
            const distX = Math.abs(obs.position.x - player.position.x);
            const distY = Math.abs(obs.position.y - player.position.y);
            
            if (distZ < 2 && distX < 2.5 && distY < 2) {
                // CRAAASH!
                playSound('crash');
                isPlaying = false;
                finalScoreElement.innerText = `Final Score: ${Math.floor(score)}`;
                gameOverScreen.classList.remove('hidden');
            }

            if (obs.position.z > 20) {
                obs.position.z -= 800;
                const lanes = [-8, 0, 8];
                obs.position.x = lanes[Math.floor(Math.random() * lanes.length)];
            }
        });

        ground.position.z += gameSpeed;
        path.position.z += gameSpeed;
        if (ground.position.z > -300) {
            ground.position.z = -400;
            path.position.z = -400;
        }
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
    animate();
});

restartBtn.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    resetGame();
    isPlaying = true;
});

renderer.render(scene, camera);
