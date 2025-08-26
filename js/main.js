// import './style.css'

let canvas = document.createElement('canvas');
canvas.id = "webgl";
canvas.classList.add('z-n1')
// document.body.insertBefore(canvas, document.body.firstChild);


// import WindowBackgroundGrid from './modules/WindowBackgroundGrid';

// const backgroundWindow = new WindowBackgroundGrid()

// backgroundWindow.display();


import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import gsap from 'gsap';

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}


const scene = new THREE.Scene();

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x029a2d });
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// const textureLoader = new THREE.TextureLoader();

const particlesGeometry = new THREE.SphereGeometry(1, 32, 32);
const particlesMaterials = new THREE.PointsMaterial();
particlesMaterials.size = 0.002
particlesMaterials.sizeAttenuation = true;

const particles = new THREE.Points(particlesGeometry, particlesMaterials)
scene.add(particles);



const fieldGeometry = new THREE.BufferGeometry();
const fieldMaterials = new THREE.PointsMaterial();
fieldMaterials.size = 0.002
fieldMaterials.sizeAttenuation = true;

const count = 500;
const fieldPositions = new Float32Array(count * 3);

for (let i = 0; i < count * 3; i++) {
  fieldPositions[i] = (Math.random() - 0.5) * 10 ;
}

fieldGeometry.setAttribute(
  'position',
  new THREE.BufferAttribute(fieldPositions, 3)
)

const field = new THREE.Points(fieldGeometry, fieldMaterials)
scene.add(field);



const camera = new THREE.PerspectiveCamera(100, sizes.width / sizes.height)
// camera.position.z = 3;
camera.position.set(1, 1, 1)
scene.add(camera);
// console.log("distance from camera: ", mesh.position.length(camera.position))
camera.lookAt(mesh.position)

const controls = new OrbitControls(camera, canvas)
controls.enabled = false
controls.enableDamping = true;

const renderer = new THREE.WebGLRenderer({
  canvas
})

renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.render(scene, camera)



window.addEventListener('resize', () => {
  // update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  renderer.setSize(sizes.width, sizes.height)
})

// window.addEventListener('dblclick', () => {

//   const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement

//   if(!fullscreenElement) {
//     if(canvas.requestFullscreen) {
//       canvas.requestFullscreen()
//     } else if(canvas.webkitFullscreenElement) {
//       canvas.webkitFullscreenElement()
//     }
//     // canvas.requestFullscreen()
//     // console.log('go fullscreen')
//   } else {
//     if(document.exitFullscreen){
//       document.exitFullscreen()
//     } else if(document.webkitExitFullscreen) {
//       document.webkitExitFullscreen()
//     }
//   }
// })

const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

  mesh.rotation.z += 0.01;
  particles.rotation.z -= 0.01;

  field.rotation.x = Math.cos(elapsedTime)
  field.rotation.z = Math.sin(elapsedTime)
    // // mesh.position.x = Math.sin(elapsedTime)
  // // mesh.position.y = Math.cos(elapsedTime)

  window.requestAnimationFrame(tick)
  renderer.render(scene, camera)
}

tick()