import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import { createSizer } from './sizing';
import ViewportGrid from './ViewportGrid';

const idealBgColor = 0x000000 // '#155DFC'

class DesignGridWindow {
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
            
            // Initialize viewport grid system
            this.viewportGrid = null;
            this.debugMarkers = [];
            
            this._config();
            
            // Start animation loop
            this._tick = this._tick.bind(this);
            this.renderer.setAnimationLoop(this._tick);
            
            // Mark as ready after initial setup
            this._markReady();
    }

    _config() {
        this.scene.background = new THREE.Color(idealBgColor);

        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Position the red cube out of the way so it doesn't interfere with text
        this.mesh.position.set(0, 0, -5);

        this.scene.add(this.mesh);

        // Position camera to look directly at the text position (Z = -3)
        this.camera.position.set(0, 0, 0);
        this.scene.add(this.camera);
        this.camera.lookAt(0, 0, -3); // Look directly at where text will spawn
        
        // Initialize viewport grid after camera setup
        this.initializeViewportGrid();
    }

    mountTo(hostEl) {
        if (!hostEl) return;
        if (this.renderer.domElement.parentElement === hostEl) return;

        // Move canvas into the target host
        hostEl.appendChild(this.renderer.domElement);
        this.currentHost = hostEl;
        
        // Set initial canvas size to match host
        const width = hostEl.clientWidth;
        const height = hostEl.clientHeight;
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.sizer.observe(hostEl);
        this.sizer.applySize();
        
        // Update controls to use new canvas parent
        if (this.controls) {
            this.controls.dispose();
        }
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enabled = false;
        this.controls.enableDamping = true;
        
        // Add responsive resize handler
        this.setupResponsiveHandling();
        
        // Trigger initial resize to ensure proper canvas sizing
        setTimeout(() => {
            this.handleCanvasResize();
        }, 100);
    }

    /**
     * Setup responsive handling for screen size changes
     */
    setupResponsiveHandling() {
        let resizeTimeout;
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                console.log('DEBUG: Screen size changed, updating responsive layout');
                this.handleCanvasResize();
                this.updateResponsiveLayout();
            }, 250); // Debounce resize events
        };
        
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
        
        // Store reference for cleanup
        this.resizeHandler = handleResize;
    }

    /**
     * Handle canvas and camera resize
     */
    handleCanvasResize() {
        if (!this.currentHost) return;
        
        const hostEl = this.currentHost;
        const width = hostEl.clientWidth;
        const height = hostEl.clientHeight;
        
        console.log('DEBUG: Resizing canvas to:', { width, height });
        
        // Update renderer size
        this.renderer.setSize(width, height);
        
        // Update camera aspect ratio
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        // Update viewport grid for new dimensions
        if (this.viewportGrid) {
            this.viewportGrid.handleResize();
        }
        
        // Force sizer to update
        if (this.sizer) {
            this.sizer.applySize();
        }
        
        console.log('DEBUG: Canvas resized successfully');
    }

    /**
     * Update layout when screen size changes
     */
    updateResponsiveLayout() {
        console.log('DEBUG: Screen size changed, layout updated');
        // Basic responsive handling - can be extended later
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
     * Initialize the viewport grid system
     */
    initializeViewportGrid() {
        this.viewportGrid = new ViewportGrid(this.camera, 1);
        
        // Add visual grid for debugging (optional)
        if (this.showDebugGrid) {
            const visualGrid = this.viewportGrid.createVisualGrid(20);
            this.scene.add(visualGrid);
        }
    }

    /**
     * Enable/disable debug grid visualization
     */
    toggleDebugGrid(show = true) {
        this.showDebugGrid = show;
        if (this.viewportGrid && show) {
            const visualGrid = this.viewportGrid.createVisualGrid(20);
            this.scene.add(visualGrid);
        }
    }

    /**
     * Add debug marker at HTML element position
     */
    addDebugMarkerForElement(element, color = 0x00ff00) {
        if (!this.viewportGrid) return null;
        
        const gridPosition = this.viewportGrid.htmlElementToGridPosition(element);
        const marker = this.viewportGrid.addDebugMarker(gridPosition, color);
        this.scene.add(marker);
        this.debugMarkers.push(marker);
        
        return marker;
    }

    /**
     * Clear all debug markers
     */
    clearDebugMarkers() {
        this.debugMarkers.forEach(marker => {
            this.scene.remove(marker);
        });
        this.debugMarkers = [];
    }

    /**
     * Get viewport grid instance
     */
    getViewportGrid() {
        return this.viewportGrid;
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

export default DesignGridWindow;