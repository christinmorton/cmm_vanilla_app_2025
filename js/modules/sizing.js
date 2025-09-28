// sizing.js - SIMPLE WORKING VERSION v2.0 - FORCE REFRESH
import * as THREE from 'three';

console.log('🔥 NEW SIZING.JS LOADED - SIMPLE VERSION 2.0');

export function createSizer({ renderer, camera, getHostEl, maxDpr = 2, canvasId = 'unknown', mode = 'inline' }) {
  let resizeTimeout = null;
  let isResizing = false;
  let lastResizeTime = 0;

  const applySize = () => {
    const now = performance.now();

    // Throttle rapid resize calls (minimum 50ms between updates)
    if (isResizing && now - lastResizeTime < 50) {
      return;
    }

    isResizing = true;
    lastResizeTime = now;
    try {
      const host = getHostEl();
      if (!host) {
        console.warn(`Sizer[${canvasId}]: No host element available`);
        return;
      }

      let width, height;

      // For background mode, always use full viewport dimensions
      if (mode === 'background') {
        width = window.innerWidth;
        height = window.innerHeight;

        // Height calculation working correctly
      } else {
        // For inline/hybrid mode, use host element bounds
        const rect = host.getBoundingClientRect();
        width = Math.max(1, rect.width || window.innerWidth);
        height = Math.max(1, rect.height || window.innerHeight);
      }

      const dpr = Math.min(maxDpr, window.devicePixelRatio || 1);

      // Update renderer
      if (renderer.setPixelRatio) {
        renderer.setPixelRatio(dpr);
      }
      if (renderer.setSize) {
        renderer.setSize(width, height, false);
      }

      // CRITICAL FIX: Explicitly set CSS dimensions
      // Three.js setSize() only sets canvas HTML attributes, not CSS styles!
      const canvas = renderer.domElement;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';

      // Update camera
      if (camera && camera.updateProjectionMatrix) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }

      // Simplified logging for better performance
      console.log(`Sizer[${canvasId}]: Updated size to ${width}x${height} (DPR: ${dpr})`);

    } catch (error) {
      console.error(`Sizer[${canvasId}]: Error applying size:`, error);
    } finally {
      // Reset throttling flag after a short delay
      setTimeout(() => {
        isResizing = false;
      }, 100);
    }
  };

  let resizeCount = 0;
  const onResize = () => {
    resizeCount++;

    // Clear existing timeout
    clearTimeout(resizeTimeout);

    // Longer debounce for smoother experience
    resizeTimeout = setTimeout(() => {
      applySize();
    }, 100); // 100ms debounce for smoothness
  };

  // Simple window resize listener
  window.addEventListener('resize', onResize);

  // Simple observe function
  const observe = (el) => {
    console.log(`Sizer[${canvasId}]: Simple observe called`);
  };

  // Cleanup function
  const cleanup = () => {
    window.removeEventListener('resize', onResize);
    clearTimeout(resizeTimeout);
    console.log(`Sizer[${canvasId}]: Cleanup completed`);
  };

  // Mode setter for dynamic mode changes
  const setMode = (newMode) => {
    mode = newMode;
    console.log(`🔧 MODE CHANGED for ${canvasId}: ${newMode}`);
    // Immediately apply size with new mode
    applySize();
  };

  // Initial apply
  applySize();

  return { applySize, onResize, observe, cleanup, setMode };
}