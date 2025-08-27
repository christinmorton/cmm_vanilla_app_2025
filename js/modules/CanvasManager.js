// canvas-manager.js
import * as THREE from 'three';
import { createSizer } from './sizing';

export class CanvasManager {
  constructor({ bgHost, inlineHost, hybridHost }) {
    this.bgHost = bgHost;
    this.inlineHost = inlineHost;
    this.hybridHost = hybridHost;

    // Three basics
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    this.camera.position.set(0, 0, 4);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.domElement.id = 'webgl'; // matches your CSS selector if you want
    this.renderer.setClearColor(0x000000, 0); // transparent background
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Sizer uses the "current host" getter
    this.currentHost = this.bgHost; // default
    this.sizer = createSizer({
      renderer: this.renderer,
      camera: this.camera,
      getHostEl: () => this.currentHost
    });

    // Simple demo content (replace with your scene)
    const geo = new THREE.IcosahedronGeometry(1, 1);
    const mat = new THREE.MeshStandardMaterial({ metalness: 0.2, roughness: 0.4, color: 0x88aaff });
    this.mesh = new THREE.Mesh(geo, mat);
    this.scene.add(this.mesh);

    const light = new THREE.DirectionalLight(0xffffff, 1.2);
    light.position.set(2, 3, 4);
    this.scene.add(light, new THREE.AmbientLight(0xffffff, 0.4));

    this._tick = this._tick.bind(this);
    this.renderer.setAnimationLoop(this._tick);
  }

  mountTo(hostEl) {
    if (!hostEl) return;
    if (this.renderer.domElement.parentElement === hostEl) return;

    // Move canvas into the target host
    hostEl.appendChild(this.renderer.domElement);
    this.currentHost = hostEl;
    this.sizer.observe(hostEl);
    this.sizer.applySize();
  }

  setMode(mode) {
    this.mode = mode;
    // Show/hide relevant hosts if needed; actual visibility is up to template
  }

  _tick() {
    // small idle animation
    this.mesh.rotation.y += 0.005;
    this.renderer.render(this.scene, this.camera);
  }
}
