// sizing.js
export function createSizer({ renderer, camera, getHostEl, maxDpr = 2 }) {
  let framePending = false;

  const applySize = () => {
    framePending = false;
    const host = getHostEl();                     // <— returns the current canvas host element
    const rect = host ? host.getBoundingClientRect() : { width: innerWidth, height: innerHeight };
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);

    const dpr = Math.min(maxDpr, window.devicePixelRatio || 1);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const onResize = () => {
    if (!framePending) {
      framePending = true;
      requestAnimationFrame(applySize);
    }
  };

  // Global resize (useful for fixed/full-viewport)
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);

  // Visibility pause (optional)
  let currentAnimationLoop = null;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Store current loop and pause
      currentAnimationLoop = renderer.getAnimationLoop ? renderer.getAnimationLoop() : null;
      renderer.setAnimationLoop(null);
    } else {
      // Resume animation loop
      if (currentAnimationLoop) {
        renderer.setAnimationLoop(currentAnimationLoop);
      }
    }
  });

  // Inline container observation (swap host on mode change; see CanvasManager below)
  let ro;
  const observe = (el) => {
    if (ro) ro.disconnect();
    if (!el) return;
    ro = new ResizeObserver(onResize);
    ro.observe(el);
  };

  // First apply
  applySize();

  return { applySize, onResize, observe };
}
