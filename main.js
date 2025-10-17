// ================================
// Three.js Boids / Arrow-Shaped Flocking
// ================================

// -- SCENE SETUP --
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 120;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
renderer.domElement.style.position = 'fixed';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.zIndex = '-1';
document.body.appendChild(renderer.domElement);

// -- BOID PARAMETERS --
const BOID_COUNT = 40;
const BOID_SPEED = 0.5;
const ALIGN_DIST = 25;
const COHESION_DIST = 40;
const SEPARATION_DIST = 15;
const ALIGN_FORCE = 0.05;
const COHESION_FORCE = 0.02;
const SEPARATION_FORCE = 0.1;
const MOUSE_ATTRACT_FORCE = 0.02;

// -- CREATE BOIDS --
const boids = [];
const geometry = new THREE.ConeGeometry(0.5, 2, 4); // elongated arrow
geometry.rotateX(Math.PI / 2); // point along +X axis initially

for (let i = 0; i < BOID_COUNT; i++) {
  const color = new THREE.Color(0x00ffff);
  color.offsetHSL(0, 0, Math.random() * 0.3); // slight brightness variation
  const material = new THREE.MeshBasicMaterial({ color });
  const boid = new THREE.Mesh(geometry, material);

  boid.position.set(
    (Math.random() - 0.5) * 200,
    (Math.random() - 0.5) * 200,
    (Math.random() - 0.5) * 200
  );
  boid.velocity = new THREE.Vector3(
    (Math.random() - 0.5) * 0.5,
    (Math.random() - 0.5) * 0.5,
    (Math.random() - 0.5) * 0.5
  );
  scene.add(boid);
  boids.push(boid);
}

// -- MOUSE TRACKING --
const mouse = new THREE.Vector3();
document.addEventListener('mousemove', (event) => {
  const x = (event.clientX / window.innerWidth - 0.5) * 200;
  const y = -(event.clientY / window.innerHeight - 0.5) * 200;
  mouse.set(x, y, 0);
});

// -- BOID LOGIC --
function updateBoids() {
  for (let i = 0; i < boids.length; i++) {
    const boid = boids[i];
    let align = new THREE.Vector3();
    let cohesion = new THREE.Vector3();
    let separation = new THREE.Vector3();
    let countAlign = 0, countCohesion = 0, countSeparation = 0;

    // Flocking
    for (let j = 0; j < boids.length; j++) {
      if (i === j) continue;
      const other = boids[j];
      const distance = boid.position.distanceTo(other.position);

      if (distance < ALIGN_DIST) {
        align.add(other.velocity);
        countAlign++;
      }
      if (distance < COHESION_DIST) {
        cohesion.add(other.position);
        countCohesion++;
      }
      if (distance < SEPARATION_DIST) {
        const diff = new THREE.Vector3().subVectors(boid.position, other.position).divideScalar(distance);
        separation.add(diff);
        countSeparation++;
      }
    }

    if (countAlign > 0) align.divideScalar(countAlign).sub(boid.velocity).multiplyScalar(ALIGN_FORCE);
    if (countCohesion > 0) cohesion.divideScalar(countCohesion).sub(boid.position).multiplyScalar(COHESION_FORCE);
    if (countSeparation > 0) separation.multiplyScalar(SEPARATION_FORCE);

    // Mouse attraction
    const toMouse = new THREE.Vector3(
      mouse.x - boid.position.x,
      mouse.y - boid.position.y,
      0
    ).multiplyScalar(MOUSE_ATTRACT_FORCE);

    // Update velocity
    boid.velocity.add(align).add(cohesion).add(separation).add(toMouse);

    // Dampen velocity
    boid.velocity.multiplyScalar(0.98);

    // Limit speed
    if (boid.velocity.length() > BOID_SPEED) boid.velocity.setLength(BOID_SPEED);

    // Update position
    boid.position.add(boid.velocity);

    // Rotate to face direction
    if (boid.velocity.length() > 0.001) {
      boid.lookAt(boid.position.clone().add(boid.velocity));
    }
  }
}

// -- ANIMATE LOOP --
function animate() {
  requestAnimationFrame(animate);
  updateBoids();
  renderer.render(scene, camera);
}

animate();

// -- HANDLE RESIZE --
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
