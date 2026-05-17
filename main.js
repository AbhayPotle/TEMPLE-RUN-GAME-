// Temple Run: Creepy Forest - Phase 2 (3D Environment)
console.log("Initializing 3D Game Environment...");

// --- THREE.JS SETUP ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x040404, 0.03); // Dark creepy fog
scene.background = new THREE.Color(0x020202);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 12);
camera.lookAt(0, 0, -20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.getElementById('game-container').appendChild(renderer.domElement);

// --- LIGHTING ---
const ambientLight = new THREE.AmbientLight(0x222233, 1.5); // Dim blueish moon light
scene.add(ambientLight);

const playerLight = new THREE.PointLight(0xffaa00, 2, 50); // Flashlight/torch effect
playerLight.position.set(0, 5, 10);
playerLight.castShadow = true;
scene.add(playerLight);

// --- ENVIRONMENT ---
// Ground
const groundGeometry = new THREE.PlaneGeometry(400, 1000, 40, 100);
const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x0a110a, 
    roughness: 0.9,
    wireframe: false
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.z = -400;
ground.receiveShadow = true;
scene.add(ground);

// Path (The lanes)
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

// Spawn initial trees along the sides
for (let i = 0; i < 80; i++) {
    const z = -Math.random() * 800;
    // Keep them off the path (x > 12 or x < -12)
    const side = Math.random() > 0.5 ? 1 : -1;
    const x = side * (12 + Math.random() * 50);
    createTree(x, z);
}

// --- PLAYER (Placeholder Box) ---
const playerGeometry = new THREE.BoxGeometry(2, 4, 2);
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xff3333 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.set(0, 2, 5);
player.castShadow = true;
scene.add(player);

// --- GAME LOGIC & ANIMATION LOOP ---
let isPlaying = false;
let gameSpeed = 1.0;

function animate() {
    requestAnimationFrame(animate);
    
    if (isPlaying) {
        // Move objects towards camera to simulate running
        objects.forEach(obj => {
            obj.position.z += gameSpeed;
            // Respawn trees when they go behind camera
            if (obj.position.z > 20) {
                obj.position.z -= 800;
                const side = Math.random() > 0.5 ? 1 : -1;
                obj.position.x = side * (12 + Math.random() * 50);
            }
        });
        
        // Endless ground effect
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
    animate();
});

restartBtn.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    isPlaying = true;
});

// Initial render to show background before start
renderer.render(scene, camera);
