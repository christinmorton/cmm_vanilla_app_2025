import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import gsap from 'gsap'
import { createSizer } from './sizing';

const idealBgColor = 0x155DFC // '#155DFC'

class BackgroundGrid {
    constructor({ bgHost, inlineHost, hybridHost, onReady }) {
            this.bgHost = bgHost;
            this.inlineHost = inlineHost;
            this.hybridHost = hybridHost;
            this.onReady = onReady;
            this.isReady = false;
            
            // Start with bgHost as default
            this.currentHost = this.bgHost;
    
            // Three.js setup
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(100, 1, 0.1, 100);
            
            // Create renderer without canvas (we'll append it to host)
            this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            this.renderer.domElement.id = 'webgl';
            this.renderer.setClearColor(0x000000, 0); // transparent background
            this.renderer.outputColorSpace = THREE.SRGBColorSpace;
            
            // Initialize controls (will be updated when mounted)
            this.controls = null;
    
            // Initialize sizer system
            this.sizer = createSizer({
                renderer: this.renderer,
                camera: this.camera,
                getHostEl: () => this.currentHost
            });
            
            this._config();
            
            // Start animation loop
            this._tick = this._tick.bind(this);
            this.renderer.setAnimationLoop(this._tick);
            
            // Mark as ready after initial setup
            this._markReady();
    }

    _config() {
        this.scene.background = new THREE.Color(idealBgColor);

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(geometry, material);

        this.scene.add(this.mesh);

        this.camera.position.set(1, 1, 1);
        this.scene.add(this.camera);
        this.camera.lookAt(this.mesh.position);
    }

    mountTo(hostEl) {
        if (!hostEl) return;
        if (this.renderer.domElement.parentElement === hostEl) return;

        // Move canvas into the target host
        hostEl.appendChild(this.renderer.domElement);
        this.currentHost = hostEl;
        this.sizer.observe(hostEl);
        this.sizer.applySize();
        
        // Update controls to use new canvas parent
        if (this.controls) {
            this.controls.dispose();
        }
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enabled = false;
        this.controls.enableDamping = true;
    }

    setMode(mode) {
        this.mode = mode;
    }

    _tick() {
        // Add any animation here
        if (this.mesh) {
            this.mesh.rotation.y += 0.005;
        }
        
        if (this.controls) {
            this.controls.update();
        }
        
        this.renderer.render(this.scene, this.camera);
    }

    display() {
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Mark canvas as ready and notify preloader
     */
    _markReady() {
        if (this.isReady) return;
        
        this.isReady = true;
        
        // Small delay to ensure first render completes
        requestAnimationFrame(() => {
            if (this.onReady) {
                this.onReady();
            }
        });
    }
}

export default BackgroundGrid;