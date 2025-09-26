console.log('🆓 CHECKOUT-FREE.JS LOADED - Free consultation page specific functionality');

// Import page-specific functionality for checkout-free.html
import DesignGridWindow from '../modules/DesignGridTypes/index.js';
import CheckoutPageFree from '../modules/CheckoutPageFree.js';

// Wait for core components to be ready
const waitForCore = () => {
  return new Promise((resolve) => {
    if (window.coreComponents) {
      resolve(window.coreComponents);
    } else {
      const checkCore = () => {
        if (window.coreComponents) {
          resolve(window.coreComponents);
        } else {
          setTimeout(checkCore, 50);
        }
      };
      checkCore();
    }
  });
};

// Initialize free consultation page functionality
const initFreeConsultationPage = async () => {
  console.log('Initializing free consultation page functionality...');

  // Wait for core components
  const { preloader } = await waitForCore();

  // Initialize free consultation functionality
  // CheckoutPageFree module handles its own initialization
  const freeCheckout = new CheckoutPageFree();

  // Get DOM elements for canvas integration
  const bgHost = document.getElementById('bgHost');
  const inlineHost = document.getElementById('inlineHost');
  const hybridHost = document.getElementById('hybridHost');

  // Initialize 3D canvas with preloader integration
  const cm = new DesignGridWindow({
    bgHost,
    inlineHost,
    hybridHost,
    onReady: () => {
      // Hide preloader when canvas is ready
      console.log('Canvas ready, hiding preloader');
      window.hidePreloader();

      // Initialize page transitions after canvas is ready
      const pageTransitions = window.initPageTransitions(cm);

      // Make available globally for debugging
      window.pageTransitions = pageTransitions;
    }
  });

  // Get template configuration from HTML
  const template = document.body.dataset.template; // "background"
  console.log('Template:', template, 'bgHost found:', !!bgHost);

  // Configure canvas based on template (checkout-free.html uses "background" template)
  if (template === 'background') {
    console.log('Mounting canvas to bgHost');
    cm.setMode('background');
    cm.mountTo(bgHost);
  }

  if (template === 'inline') {
    cm.setMode('inline');
    cm.mountTo(inlineHost);
  }

  if (template === 'hybrid') {
    cm.setMode('hybrid');
    cm.mountTo(bgHost);
  }

  // Register page transition handler (minimal for free consultation page)
  window.pageTransitionHandlers = window.pageTransitionHandlers || [];
  window.pageTransitionHandlers.push(() => {
    console.log('Free consultation page transition handler');
    // Free consultation page has minimal transition requirements
    // CheckoutPageFree module handles its own state management
  });

  console.log('✅ Free consultation page functionality initialized');
};

// Initialize when script loads
initFreeConsultationPage().catch(console.error);