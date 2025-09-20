console.log('💳 CHECKOUT.JS LOADED - Checkout page specific functionality');

// Import page-specific functionality for checkout.html
import DesignGridWindow from '../modules/DesignGridTypes/index.js';
import CheckoutPage from '../modules/CheckoutPage.js';

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

// Initialize checkout page functionality
const initCheckoutPage = async () => {
  console.log('Initializing checkout page functionality...');

  // Wait for core components
  const { preloader } = await waitForCore();

  // Initialize checkout functionality (existing module)
  // CheckoutPage module handles its own initialization
  // Note: CheckoutPage.js is already imported and will initialize automatically

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
  const template = document.body.dataset.template; // "background" | "inline" | "hybrid"
  console.log('Template:', template, 'bgHost found:', !!bgHost);

  // Configure canvas based on template (checkout.html uses "background" template)
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
    // Note: checkout.html doesn't typically use hybrid mode, but included for completeness
  }

  // Register page transition handler (minimal for checkout page)
  window.pageTransitionHandlers = window.pageTransitionHandlers || [];
  window.pageTransitionHandlers.push(() => {
    console.log('Checkout page transition handler');
    // Checkout page has minimal transition requirements
    // CheckoutPage module handles its own state management
  });

  console.log('✅ Checkout page functionality initialized');
};

// Initialize when script loads
initCheckoutPage().catch(console.error);