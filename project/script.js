import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, spaceship, stars, controls;
let engineParticles, thrusterLight;
let isTransitioning = false;

// Initialize the scene
function init() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.00003);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('scene-container').appendChild(renderer.domElement);

    // Enhanced lighting
    const ambientLight = new THREE.AmbientLight(0x111111);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffcc, 2);
    sunLight.position.set(10, 10, 10);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // Add rim lighting for dramatic effect
    const rimLight1 = new THREE.DirectionalLight(0x0088ff, 1);
    rimLight1.position.set(-10, 5, -10);
    scene.add(rimLight1);

    const rimLight2 = new THREE.DirectionalLight(0xff4400, 0.5);
    rimLight2.position.set(10, -5, -10);
    scene.add(rimLight2);

    // Create detailed spaceship
    createDetailedSpaceship();

    // Create enhanced starfield
    createEnhancedStars();

    // Set initial camera position
    camera.position.z = 25;
    camera.position.y = 10;

    // Initialize enhanced controls with user interaction only
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 15;
    controls.maxDistance = 100;
    controls.autoRotate = false;
    controls.enablePan = true;
    controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
    };
    controls.touches = {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN
    };

    // Add event listeners
    window.addEventListener('resize', onWindowResize);
    renderer.domElement.addEventListener('click', onSceneClick);

    // Setup login button listeners
    setupLoginButtons();

    // Start animation loop
    animate();
}

function createDetailedSpaceship() {
    spaceship = new THREE.Group();

    // Create main hull with more complex shape
    const hullPoints = [];
    for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        // Create more dynamic curved profile for hull
        const radius = 2 + Math.sin(t * Math.PI) * 0.5 + Math.sin(t * Math.PI * 4) * 0.2;
        hullPoints.push(new THREE.Vector2(Math.cos(t * Math.PI) * radius, t * 10 - 5));
    }
    const hullGeometry = new THREE.LatheGeometry(hullPoints, 32);
    const hullMaterial = new THREE.MeshStandardMaterial({
        color: 0x666666,
        metalness: 0.8,
        roughness: 0.3,
        envMapIntensity: 1.0
    });
    const hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.rotation.x = Math.PI / 2;
    hull.castShadow = true;
    hull.receiveShadow = true;
    spaceship.add(hull);

    // Add armor plating
    const armorSegments = 8;
    for (let i = 0; i < armorSegments; i++) {
        const angle = (i / armorSegments) * Math.PI * 2;
        const armorPlate = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 6),
            new THREE.MeshStandardMaterial({
                color: 0x444444,
                metalness: 0.9,
                roughness: 0.4,
                side: THREE.DoubleSide
            })
        );
        armorPlate.position.set(
            Math.cos(angle) * 2,
            Math.sin(angle) * 2,
            0
        );
        armorPlate.lookAt(new THREE.Vector3(0, 0, 0));
        armorPlate.castShadow = true;
        hull.add(armorPlate);

        // Add decorative rivets
        for (let j = 0; j < 5; j++) {
            const rivet = new THREE.Mesh(
                new THREE.CylinderGeometry(0.05, 0.05, 0.1, 8),
                new THREE.MeshStandardMaterial({
                    color: 0x888888,
                    metalness: 1,
                    roughness: 0.2
                })
            );
            rivet.position.set(0.8, j * 1.5 - 2, 0.1);
            rivet.rotation.x = Math.PI / 2;
            armorPlate.add(rivet);
        }
    }

    // Add surface details to hull with more variety
    for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        // Create panel detail with beveled edges
        const panelGeometry = new THREE.BoxGeometry(0.4, 2, 0.1);
        const panel = new THREE.Mesh(
            panelGeometry,
            new THREE.MeshStandardMaterial({
                color: 0x444444,
                metalness: 0.7,
                roughness: 0.3
            })
        );
        panel.position.set(
            Math.cos(angle) * 2.2,
            Math.sin(angle) * 2.2,
            -2
        );
        panel.lookAt(new THREE.Vector3(0, 0, -2));
        panel.castShadow = true;
        spaceship.add(panel);

        // Add tech details with glowing elements
        const techDetailGroup = new THREE.Group();
        
        // Base tech detail
        const techBase = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.15, 0.5, 8),
            new THREE.MeshStandardMaterial({
                color: 0x88aacc,
                metalness: 0.5,
                roughness: 0.5
            })
        );
        techDetailGroup.add(techBase);

        // Glowing ring
        const glowRing = new THREE.Mesh(
            new THREE.TorusGeometry(0.2, 0.03, 8, 16),
            new THREE.MeshStandardMaterial({
                color: 0x00ffff,
                emissive: 0x00ffff,
                emissiveIntensity: 0.5
            })
        );
        glowRing.rotation.x = Math.PI / 2;
        techDetailGroup.add(glowRing);

        // Position the tech detail group
        techDetailGroup.position.set(
            Math.cos(angle) * 2.2,
            Math.sin(angle) * 2.2,
            2
        );
        techDetailGroup.lookAt(new THREE.Vector3(0, 0, 2));
        spaceship.add(techDetailGroup);
    }

    // Enhanced wings with more detailed geometry
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(6, -1.5);
    wingShape.quadraticCurveTo(7, 0, 7, 1);
    wingShape.lineTo(5, 3.5);
    wingShape.quadraticCurveTo(2.5, 2.5, 0, 1);
    wingShape.lineTo(0, 0);

    const wingHoles = [];
    // Add three decorative holes in the wing
    for (let i = 0; i < 3; i++) {
        const holeShape = new THREE.Shape();
        const centerX = 3 + i * 1.2;
        const centerY = 0.5;
        const radius = 0.3;
        holeShape.moveTo(centerX + radius, centerY);
        for (let j = 0; j <= 16; j++) {
            const angle = (j / 16) * Math.PI * 2;
            holeShape.lineTo(
                centerX + Math.cos(angle) * radius,
                centerY + Math.sin(angle) * radius
            );
        }
        wingHoles.push(holeShape);
    }

    const wingExtrudeSettings = {
        steps: 1,
        depth: 0.3,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.1,
        bevelSegments: 5,
        holes: wingHoles
    };

    const wingGeometry = new THREE.ExtrudeGeometry(wingShape, wingExtrudeSettings);
    const wingMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        metalness: 0.7,
        roughness: 0.3
    });

    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-2, 0, -1);
    leftWing.castShadow = true;
    leftWing.receiveShadow = true;
    spaceship.add(leftWing);

    const rightWing = leftWing.clone();
    rightWing.position.set(2, 0, -1);
    rightWing.scale.x = -1;
    spaceship.add(rightWing);

    // Add wing lights
    const wingLightPositions = [
        { x: -4.5, y: 0, z: -1 },
        { x: -3, y: 0, z: -1 },
        { x: 3, y: 0, z: -1 },
        { x: 4.5, y: 0, z: -1 }
    ];

    wingLightPositions.forEach(pos => {
        const light = new THREE.PointLight(0xff0000, 1, 2);
        light.position.set(pos.x, pos.y, pos.z);
        spaceship.add(light);

        const lightSphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 8, 8),
            new THREE.MeshStandardMaterial({
                color: 0xff0000,
                emissive: 0xff0000,
                emissiveIntensity: 1
            })
        );
        lightSphere.position.copy(light.position);
        spaceship.add(lightSphere);
    });

    // Enhanced engine section
    const engineGroup = new THREE.Group();
    engineGroup.position.z = 5;

    for (let i = 0; i < 3; i++) {
        const nozzleGroup = new THREE.Group();
        nozzleGroup.position.x = (i - 1) * 1.2;

        // Main nozzle with more detailed geometry
        const nozzleShape = new THREE.Shape();
        nozzleShape.moveTo(0, 0);
        nozzleShape.lineTo(0.4, 0);
        nozzleShape.quadraticCurveTo(0.5, 0.5, 0.3, 1);
        nozzleShape.lineTo(0.1, 1);
        nozzleShape.quadraticCurveTo(-0.1, 0.5, 0, 0);

        const nozzleGeometry = new THREE.LatheGeometry(
            nozzleShape.getPoints(20),
            16
        );
        const nozzleMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.9,
            roughness: 0.4
        });
        const nozzle = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
        nozzle.scale.setScalar(1.2);
        nozzleGroup.add(nozzle);

        // Add heat dissipation fins
        for (let j = 0; j < 8; j++) {
            const angle = (j / 8) * Math.PI * 2;
            const fin = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 0.5, 0.02),
                new THREE.MeshStandardMaterial({
                    color: 0x666666,
                    metalness: 0.8,
                    roughness: 0.2
                })
            );
            fin.position.set(
                Math.cos(angle) * 0.4,
                Math.sin(angle) * 0.4,
                0.3
            );
            fin.lookAt(new THREE.Vector3(0, 0, 0.3));
            nozzleGroup.add(fin);
        }

        // Enhanced engine glow
        const glowColor = new THREE.Color(0x00ffff);
        const engineGlow = new THREE.PointLight(glowColor, 2, 3);
        engineGlow.position.z = -0.6;
        nozzleGroup.add(engineGlow);

        // Add plasma effect
        const plasmaGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const plasmaMaterial = new THREE.MeshStandardMaterial({
            color: glowColor,
            emissive: glowColor,
            emissiveIntensity: 1,
            transparent: true,
            opacity: 0.7
        });
        const plasma = new THREE.Mesh(plasmaGeometry, plasmaMaterial);
        plasma.position.z = -0.3;
        nozzleGroup.add(plasma);

        engineGroup.add(nozzleGroup);
    }

    spaceship.add(engineGroup);

    // Enhanced engine particles with more variety
    const particleCount = 1000;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * 3;
        positions[i3 + 1] = (Math.random() - 0.5) * 3;
        positions[i3 + 2] = Math.random() * 4 + 4;

        // Varied colors from blue to cyan
        colors[i3] = 0;
        colors[i3 + 1] = 0.5 + Math.random() * 0.5;
        colors[i3 + 2] = 0.8 + Math.random() * 0.2;

        // Varied sizes
        sizes[i] = Math.random() * 0.1;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });

    engineParticles = new THREE.Points(particleGeometry, particleMaterial);
    engineGroup.add(engineParticles);

    scene.add(spaceship);
}

[... rest of the file remains unchanged ...]