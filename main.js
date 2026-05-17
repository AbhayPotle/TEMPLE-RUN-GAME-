// Temple Run: Creepy Forest - Phase 3 (AI Hand Tracking & Game Logic)
console.log("Initializing 3D Game Environment with AI Tracking...");

// --- THREE.JS SETUP ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x040404, 0.03); // Dark creepy fog
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

const pathGeometry = new THREE.PlaneGeometry(18, 1000);
const pathMaterial = new THREE.MeshStandardMaterial({ color: 0x1a0f0f, roughness: 1.0 });
const path = new THREE.Mesh(pathGeometry, pathMaterial);
path.rotation.x = -Math.PI / 2;
path.position.y = 0.05;
path.position.z = -400;
path.receiveShadow = true;
scene.add(path);

// --- PROCEDURAL OBJECTS (Trees) ---
const objects = [];
const treeGeometry = new THREE.ConeGeometry(3, 15, 8);
const treeMaterial = new THREE.MeshStandardMaterial({ color: 0x051505 });
const trunkGeometry = new THREE.CylinderGeometry(0.8, 0.8, 4);
const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x2b1d14 });

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
    objects.push(treeGroup);
}

for (let i = 0; i < 80; i++) {
    const z = -Math.random() * 800;
    const side = Math.random() > 0.5 ? 1 : -1;
    const x = side * (12 + Math.random() * 50);
    createTree(x, z);
}

// --- PLAYER ---
const playerGeometry = new THREE.BoxGeometry(2, 4, 2);
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xff3333 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.set(0, 2, 5);
player.castShadow = true;
scene.add(player);

let targetX = 0; // -6 (Left), 0 (Center), 6 (Right)
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
        
        // Draw landmarks so user sees detection
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 2});
        drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 1});

        // Use index finger tip (landmark 8) or palm base (landmark 0) for position
        const handX = landmarks[0].x; // 0.0 to 1.0
        const handY = landmarks[0].y; // 0.0 to 1.0

        // Determine Lane (Left, Center, Right)
        if (handX > 0.65) {
            targetX = -6; // Hand on right side of screen means left lane (due to mirroring)
        } else if (handX < 0.35) {
            targetX = 6;  // Hand on left side of screen means right lane
        } else {
            targetX = 0;
        }

        // Detect Jump (rapid upward movement or holding hand high)
        if (handY < 0.3 && !isJumping && player.position.y <= 2.1) {
            isJumping = true;
            jumpVelocity = 0.4;
        }
        
        if (!isPlaying && startScreen.classList.contains('hidden')) {
            // Can add logic to start game on gesture
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

function animate() {
    requestAnimationFrame(animate);
    
    if (isPlaying) {
        // Only run if hand is detected to make it interactive
        if (handDetected) {
            gameSpeed = baseSpeed;
            score += 0.1;
            scoreElement.innerText = `Score: ${Math.floor(score)}`;
            instructionsElement.innerText = "Running... Keep hand visible!";
            instructionsElement.style.color = "#00ff00";
        } else {
            gameSpeed *= 0.9; // Slow down to stop
            instructionsElement.innerText = "Show hand to run!";
            instructionsElement.style.color = "#ff3333";
        }

        // Player Movement Interpolation (Smooth lane changing)
        player.position.x += (targetX - player.position.x) * 0.1;
        playerLight.position.x = player.position.x; // Light follows player

        // Jump physics
        if (isJumping || player.position.y > 2) {
            player.position.y += jumpVelocity;
            jumpVelocity += GRAVITY;
            
            if (player.position.y <= 2) {
                player.position.y = 2;
                isJumping = false;
                jumpVelocity = 0;
            }
        }

        // Move objects towards camera to simulate running
        objects.forEach(obj => {
            obj.position.z += gameSpeed;
            if (obj.position.z > 20) {
                obj.position.z -= 800;
                const side = Math.random() > 0.5 ? 1 : -1;
                obj.position.x = side * (12 + Math.random() * 50);
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
const gameOverScreen = document.getElementById('game-over-screen');

startBtn.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    isPlaying = true;
    score = 0;
    animate();
});

restartBtn.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    isPlaying = true;
    score = 0;
    player.position.set(0, 2, 5);
});

renderer.render(scene, camera);
