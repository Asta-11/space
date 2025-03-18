import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as TWEEN from '@tweenjs/tween.js';

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

    // Create hull shape with custom curves
    const hullPoints = [];
    for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        // Create curved profile for hull
        const radius = 2 + Math.sin(t * Math.PI) * 0.5;
        hullPoints.push(new THREE.Vector2(Math.cos(t * Math.PI) * radius, t * 10 - 5));
    }
    const hullGeometry = new THREE.LatheGeometry(hullPoints, 16);
    const hullMaterial = new THREE.MeshPhongMaterial({
        color: 0x666666,
        specular: 0x333333,
        shininess: 30,
        side: THREE.DoubleSide
    });
    const hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.rotation.x = Math.PI / 2;
    spaceship.add(hull);

    // Add surface details to hull
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        // Create panel detail
        const panel = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 2, 0.1),
            new THREE.MeshPhongMaterial({
                color: 0x444444,
                specular: 0x222222,
                shininess: 40
            })
        );
        panel.position.set(
            Math.cos(angle) * 2.2,
            Math.sin(angle) * 2.2,
            -2
        );
        panel.lookAt(new THREE.Vector3(0, 0, -2));
        spaceship.add(panel);

        // Add tech details
        const techDetail = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.1, 0.5, 6),
            new THREE.MeshPhongMaterial({
                color: 0x88aacc,
                emissive: 0x223344
            })
        );
        techDetail.position.set(
            Math.cos(angle) * 2.2,
            Math.sin(angle) * 2.2,
            2
        );
        techDetail.lookAt(new THREE.Vector3(0, 0, 2));
        spaceship.add(techDetail);
    }

    // Advanced wings with custom shape
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(5, -1);
    wingShape.quadraticCurveTo(6, 0, 6, 1);
    wingShape.lineTo(4, 3);
    wingShape.quadraticCurveTo(2, 2, 0, 1);
    wingShape.lineTo(0, 0);

    const wingExtrudeSettings = {
        steps: 1,
        depth: 0.2,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.1,
        bevelSegments: 3
    };

    const wingGeometry = new THREE.ExtrudeGeometry(wingShape, wingExtrudeSettings);
    const wingMaterial = new THREE.MeshPhongMaterial({
        color: 0x444444,
        specular: 0x111111,
        shininess: 50
    });

    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-2, 0, -1);
    spaceship.add(leftWing);

    const rightWing = leftWing.clone();
    rightWing.position.set(2, 0, -1);
    rightWing.scale.x = -1;
    spaceship.add(rightWing);

    // Advanced engine section
    for (let i = 0; i < 3; i++) {
        const nozzleGroup = new THREE.Group();

        // Inner nozzle
        const innerNozzle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.4, 1.2, 16),
            new THREE.MeshPhongMaterial({
                color: 0x333333,
                specular: 0x666666,
                shininess: 80
            })
        );
        nozzleGroup.add(innerNozzle);

        // Outer nozzle ring
        const outerRing = new THREE.Mesh(
            new THREE.TorusGeometry(0.45, 0.1, 8, 16),
            new THREE.MeshPhongMaterial({
                color: 0x444444,
                specular: 0x888888
            })
        );
        outerRing.position.y = -0.5;
        outerRing.rotation.x = Math.PI / 2;
        nozzleGroup.add(outerRing);

        // Engine glow
        const glow = new THREE.PointLight(0x00ffff, 2, 3);
        glow.position.y = -0.6;
        nozzleGroup.add(glow);

        nozzleGroup.position.set((i - 1) * 1.2, 0, 5);
        spaceship.add(nozzleGroup);
    }

    // Enhanced engine particles
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 500;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = ((Math.random() - 0.5) * 3);
        positions[i * 3 + 1] = ((Math.random() - 0.5) * 3);
        positions[i * 3 + 2] = Math.random() * 4 + 4;

        colors[i * 3] = 0;
        colors[i * 3 + 1] = 1;
        colors[i * 3 + 2] = 1;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
        size: 0.05,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true
    });

    engineParticles = new THREE.Points(particleGeometry, particleMaterial);
    spaceship.add(engineParticles);

    scene.add(spaceship);
}

function createDetailedCockpit() {
    const cockpitGroup = new THREE.Group();

    // Create curved interior walls
    const interiorShape = new THREE.Shape();
    interiorShape.moveTo(-4, -2.5);
    interiorShape.quadraticCurveTo(-4, 2.5, 0, 3);
    interiorShape.quadraticCurveTo(4, 2.5, 4, -2.5);
    interiorShape.quadraticCurveTo(2, -3, 0, -3);
    interiorShape.quadraticCurveTo(-2, -3, -4, -2.5);

    const interiorGeometry = new THREE.ExtrudeGeometry(interiorShape, {
        depth: 6,
        bevelEnabled: true,
        bevelThickness: 0.2,
        bevelSize: 0.1
    });

    const interior = new THREE.Mesh(
        interiorGeometry,
        new THREE.MeshPhongMaterial({
            color: 0x333333,
            transparent: true,
            opacity: 0.8,
            side: THREE.BackSide
        })
    );
    interior.position.z = -3;
    cockpitGroup.add(interior);

    // Advanced control console
    const consoleGroup = new THREE.Group();

    // Main console base with curved shape
    const consoleShape = new THREE.Shape();
    consoleShape.moveTo(-3, 0);
    consoleShape.quadraticCurveTo(-3, 1, 0, 1.2);
    consoleShape.quadraticCurveTo(3, 1, 3, 0);
    consoleShape.quadraticCurveTo(1.5, -0.5, 0, -0.6);
    consoleShape.quadraticCurveTo(-1.5, -0.5, -3, 0);

    const consoleGeometry = new THREE.ExtrudeGeometry(consoleShape, {
        depth: 0.5,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.1
    });

    const console = new THREE.Mesh(
        consoleGeometry,
        new THREE.MeshPhongMaterial({
            color: 0x222222,
            emissive: 0x112233
        })
    );
    console.position.set(0, -1.5, -2);
    console.rotation.x = -Math.PI / 4;
    consoleGroup.add(console);

    // Add detailed screens with bezels
    const screenPositions = [
        { x: -2, y: 0.5, z: -2.5, rx: -0.2, size: { w: 1.4, h: 1 } },
        { x: 0, y: 0.5, z: -2.3, rx: -0.2, size: { w: 1.8, h: 1.2 } },
        { x: 2, y: 0.5, z: -2.5, rx: -0.2, size: { w: 1.4, h: 1 } },
        { x: -1.5, y: -1, z: -1.8, rx: -0.6, size: { w: 1.2, h: 0.8 } },
        { x: 1.5, y: -1, z: -1.8, rx: -0.6, size: { w: 1.2, h: 0.8 } }
    ];

    screenPositions.forEach((pos) => {
        const screenGroup = new THREE.Group();

        // Screen bezel
        const bezel = new THREE.Mesh(
            new THREE.BoxGeometry(pos.size.w + 0.2, pos.size.h + 0.2, 0.1),
            new THREE.MeshPhongMaterial({ color: 0x111111 })
        );
        screenGroup.add(bezel);

        // Screen display
        const screen = new THREE.Mesh(
            new THREE.PlaneGeometry(pos.size.w, pos.size.h),
            new THREE.MeshPhongMaterial({
                color: 0x00ff00,
                emissive: 0x003300,
                transparent: true,
                opacity: 0.9
            })
        );
        screen.position.z = 0.051;
        screenGroup.add(screen);

        screenGroup.position.set(pos.x, pos.y, pos.z);
        screenGroup.rotation.x = pos.rx;
        consoleGroup.add(screenGroup);
    });

    // Add detailed control elements
    const controlElements = [
        { type: 'slider', x: -2.2, y: -1.2, z: -1.5, w: 0.8 },
        { type: 'knob', x: -1.2, y: -1.2, z: -1.5, r: 0.15 },
        { type: 'button', x: -0.4, y: -1.2, z: -1.5, s: 0.2 },
        { type: 'switch', x: 0.4, y: -1.2, z: -1.5, s: 0.15 },
        { type: 'knob', x: 1.2, y: -1.2, z: -1.5, r: 0.15 },
        { type: 'slider', x: 2.2, y: -1.2, z: -1.5, w: 0.8 }
    ];

    controlElements.forEach(elem => {
        let control;
        switch (elem.type) {
            case 'knob':
                control = new THREE.Mesh(
                    new THREE.CylinderGeometry(elem.r, elem.r, 0.1, 16),
                    new THREE.MeshPhongMaterial({
                        color: 0x666666,
                        specular: 0x999999
                    })
                );
                break;
            case 'slider':
                const sliderGroup = new THREE.Group();
                const track = new THREE.Mesh(
                    new THREE.BoxGeometry(elem.w, 0.05, 0.05),
                    new THREE.MeshPhongMaterial({ color: 0x444444 })
                );
                const handle = new THREE.Mesh(
                    new THREE.BoxGeometry(0.1, 0.2, 0.1),
                    new THREE.MeshPhongMaterial({
                        color: 0x666666,
                        specular: 0x999999
                    })
                );
                handle.position.x = Math.random() * elem.w - elem.w/2;
                sliderGroup.add(track, handle);
                control = sliderGroup;
                break;
            case 'button':
                control = new THREE.Mesh(
                    new THREE.CylinderGeometry(elem.s, elem.s, 0.05, 16),
                    new THREE.MeshPhongMaterial({
                        color: 0xff0000,
                        emissive: 0x330000
                    })
                );
                break;
            case 'switch':
                const switchGroup = new THREE.Group();
                const base = new THREE.Mesh(
                    new THREE.CylinderGeometry(elem.s, elem.s, 0.05, 16),
                    new THREE.MeshPhongMaterial({ color: 0x444444 })
                );
                const lever = new THREE.Mesh(
                    new THREE.BoxGeometry(0.05, 0.2, 0.05),
                    new THREE.MeshPhongMaterial({ color: 0x666666 })
                );
                lever.position.y = 0.1;
                lever.rotation.x = Math.random() * Math.PI/2 - Math.PI/4;
                switchGroup.add(base, lever);
                control = switchGroup;
                break;
        }
        control.position.set(elem.x, elem.y, elem.z);
        control.rotation.x = -Math.PI / 4;
        consoleGroup.add(control);
    });

    // Add holographic projector
    const holoProjector = createHolographicProjector();
    holoProjector.position.set(0, -0.8, -1);
    consoleGroup.add(holoProjector);

    cockpitGroup.add(consoleGroup);
    scene.add(cockpitGroup);
}

function createHolographicProjector() {
    const projectorGroup = new THREE.Group();

    // Base
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.4, 0.2, 16),
        new THREE.MeshPhongMaterial({
            color: 0x444444,
            specular: 0x666666
        })
    );
    projectorGroup.add(base);

    // Emitter
    const emitter = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16),
        new THREE.MeshPhongMaterial({
            color: 0x0088ff,
            emissive: 0x003366,
            transparent: true,
            opacity: 0.8
        })
    );
    emitter.position.y = 0.15;
    projectorGroup.add(emitter);

    // Hologram effect
    const holoGeometry = new THREE.ConeGeometry(0.5, 1, 16, 1, true);
    const holoMaterial = new THREE.MeshPhongMaterial({
        color: 0x0088ff,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
    });
    const hologram = new THREE.Mesh(holoGeometry, holoMaterial);
    hologram.position.y = 0.7;
    projectorGroup.add(hologram);

    return projectorGroup;
}

function createEnhancedStars() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const colors = [];
    const sizes = [];

    for (let i = 0; i < 10000; i++) {
        vertices.push(
            (Math.random() - 0.5) * 2000,
            (Math.random() - 0.5) * 2000,
            (Math.random() - 0.5) * 2000
        );

        // Varied star colors
        const color = new THREE.Color();
        color.setHSL(Math.random(), 0.5, 0.8);
        colors.push(color.r, color.g, color.b);

        // Varied star sizes
        sizes.push(Math.random() * 2);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
        size: 2,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true
    });

    stars = new THREE.Points(geometry, material);
    scene.add(stars);
}

function updateEngineParticles() {
    const positions = engineParticles.geometry.attributes.position.array;
    const count = positions.length / 3;

    for (let i = 0; i < count; i++) {
        positions[i * 3 + 2] -= 0.1;

        if (positions[i * 3 + 2] < 4) {
            positions[i * 3 + 2] = 8;
            positions[i * 3] = (Math.random() - 0.5) * 3;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 3;
        }
    }

    engineParticles.geometry.attributes.position.needsUpdate = true;
}

function transitionToCockpit() {
    if (isTransitioning) return;
    isTransitioning = true;

    // Disable controls during transition
    controls.enabled = false;

    // Create and show detailed cockpit
    createDetailedCockpit();

    // Animate camera to cockpit view
    const targetPosition = { x: 0, y: 1, z: 3 };
    const targetRotation = { x: -0.2, y: 0, z: 0 };

    new TWEEN.Tween(camera.position)
        .to(targetPosition, 2000)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start();

    new TWEEN.Tween(camera.rotation)
        .to(targetRotation, 2000)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onComplete(() => {
            document.getElementById('login-overlay').classList.add('visible');
            isTransitioning = false;
        })
        .start();
}

function onSceneClick(event) {
    if (isTransitioning) return;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(spaceship, true);

    if (intersects.length > 0) {
        transitionToCockpit();
    }
}

function setupLoginButtons() {
    const buttons = document.querySelectorAll('.login-btn');
    buttons.forEach(button => {
        button.addEventListener('click', (e) => {
            const loginType = e.currentTarget.dataset.type;
            console.log(`Login attempted with: ${loginType}`);
        });
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    if (!isTransitioning) {
        // Gentle floating motion
        spaceship.position.y = Math.sin(Date.now() * 0.0005) * 0.3;
        spaceship.position.x = Math.sin(Date.now() * 0.0003) * 0.2;

        // Update engine particles
        updateEngineParticles();
    }

    stars.rotation.y += 0.0001;
    stars.rotation.x += 0.00005;

    TWEEN.update();
    controls.update();
    renderer.render(scene, camera);
}

// Start the application
window.addEventListener('load', init);
