import * as THREE from 'three';

/**
 * ViewportGrid - Creates a 3D coordinate system mapped to the camera viewport
 */
class ViewportGrid {
    constructor(camera, distance = 2) {
        this.camera = camera;
        this.distance = distance; // Distance from camera to grid plane
        
        // Calculate world dimensions at the grid distance
        this.worldDimensions = this.calculateWorldDimensions();
    }
    
    /**
     * Calculate world dimensions at the grid distance from camera
     */
    calculateWorldDimensions() {
        const vFOV = THREE.MathUtils.degToRad(this.camera.fov);
        const height = 2 * Math.tan(vFOV / 2) * this.distance;
        const width = height * this.camera.aspect;
        
        return { width, height };
    }
    
    /**
     * Convert screen coordinates to grid coordinates
     */
    screenToGridCoordinates(screenX, screenY) {
        // Convert screen pixels to normalized device coordinates (-1 to 1)
        const ndcX = (screenX / window.innerWidth) * 2 - 1;
        const ndcY = -(screenY / window.innerHeight) * 2 + 1;
        
        // Convert NDC to world coordinates on the grid plane
        const worldX = ndcX * (this.worldDimensions.width / 2);
        const worldY = ndcY * (this.worldDimensions.height / 2);
        const worldZ = -this.distance; // Grid is at fixed distance from camera
        
        return new THREE.Vector3(worldX, worldY, worldZ);
    }
    
    /**
     * Convert HTML element to grid position
     */
    htmlElementToGridPosition(element) {
        const rect = element.getBoundingClientRect();
        
        // Get center point of element
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Convert to grid coordinates
        return this.screenToGridCoordinates(centerX, centerY);
    }
    
    /**
     * Create visual grid for debugging
     */
    createVisualGrid(divisions = 20) {
        const gridHelper = new THREE.GridHelper(
            Math.max(this.worldDimensions.width, this.worldDimensions.height),
            divisions,
            0x444444,
            0x222222
        );
        
        // Position grid at the mapping plane
        gridHelper.position.z = -this.distance;
        gridHelper.rotation.x = Math.PI / 2; // Rotate to face camera
        
        return gridHelper;
    }
    
    /**
     * Add debug marker at position
     */
    addDebugMarker(position, color = 0xff0000) {
        const geometry = new THREE.SphereGeometry(0.05);
        const material = new THREE.MeshBasicMaterial({ color });
        const marker = new THREE.Mesh(geometry, material);
        
        marker.position.copy(position);
        
        return marker;
    }
    
    /**
     * Update grid dimensions (call after camera or window changes)
     */
    updateDimensions() {
        this.worldDimensions = this.calculateWorldDimensions();
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        this.updateDimensions();
    }
}

export default ViewportGrid;