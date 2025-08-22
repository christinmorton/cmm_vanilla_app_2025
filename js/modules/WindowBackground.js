import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import gsap from 'gsap'

const idealBgColor = 0x155DFC // '#155DFC'

class WindowBackground {
    constructor(primaryBgColor = idealBgColor) {
            this.primaryBgColor = primaryBgColor 
            this.canvas = document.getElementById('bg-grid')
            this.sizes = {
                width: window.innerWidth,
                height: window.innerHeight
            }
    
            // thw world
            this.scene = new THREE.Scene();
            
            // Viewport and controls
            this.camera = new THREE.PerspectiveCamera(100, this.sizes.width / this.sizes.height)
            this.controls = new OrbitControls(this.camera, this.canvas)
            
            // Renderer
            this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas })
    
            this._load_global_event_listeners();
            this._config();
    }

    _load_global_event_listeners() {
        
        // Resize window and canvas
        window.addEventListener('resize', () => {
            // update sizes
            this.sizes.width = window.innerWidth
            // sizes.height = window.innerHeight

            this.camera.aspect = this.sizes.width / this.sizes.height
            this.camera.updateProjectionMatrix()

            this.renderer.setSize(this.sizes.width, this.sizes.height)
        })

    }

    _config() {
        this.scene.background = new THREE.Color(idealBgColor);

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const mesh = new THREE.Mesh(geometry, material);

        // this.scene.add(mesh);


        this.camera.position.set(1, 1, 1)
        this.scene.add(this.camera);
        this.camera.lookAt(mesh.position)



        this.controls.enabled = false
        this.controls.enableDamping = true;



        this.renderer.setSize(this.sizes.width, this.sizes.height)
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    }

    tick() {
        window.requestAnimationFrame(tick)
        renderer.render(scene, camera)
    }

    display() {
        this.renderer.render(this.scene, this.camera)
    }
}

export default WindowBackground;