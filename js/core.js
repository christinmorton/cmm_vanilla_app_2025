console.log('🚀 CORE.JS LOADED - Essential global functionality');

// Core imports - functionality needed on ALL pages
import PreloadManager from './modules/PreloadManager.js';
import HeaderNavigation from './modules/HeaderNavigation.js';
import analytics from './modules/AnalyticsTracker.js';
import PageTransitionManager from './modules/PageTransitionManager.js';

// Initialize preloader immediately (needed on all pages for consistency)
const preloader = new PreloadManager();
console.log('DEBUG: PreloadManager created:', preloader);
preloader.show();
console.log('DEBUG: Preloader show() called');

// Initialize header navigation (needed on all pages)
const headerNav = new HeaderNavigation();

// Analytics tracking (needed on all pages)
// Analytics is automatically initialized when imported

// Make core components globally available
window.coreComponents = {
  preloader,
  headerNav,
  analytics
};

// Global function to hide preloader (called by page-specific scripts)
window.hidePreloader = () => {
  console.log('Calling global hidePreloader()');
  setTimeout(() => {
    console.log('Preloader state before hide:', {
      visible: preloader.visible,
      overlay: preloader.overlay,
      bodyClasses: document.body.className
    });
    preloader.hide();
    console.log('Preloader state after hide:', {
      visible: preloader.visible,
      overlay: preloader.overlay,
      bodyClasses: document.body.className
    });
  }, 500);
};

// Global page transition initialization (for pages that need it)
window.initPageTransitions = (canvasManager) => {
  const pageTransitions = new PageTransitionManager(canvasManager, preloader);
  pageTransitions.setDebug(false);
  window.pageTransitions = pageTransitions;
  return pageTransitions;
};

// Listen for custom page transition events (global handler)
document.addEventListener('page-transition-complete', () => {
  console.log('Page transition complete - core handler');
  // Notify any active page-specific components
  if (window.pageTransitionHandlers) {
    window.pageTransitionHandlers.forEach(handler => handler());
  }
});

console.log('✅ Core functionality initialized');