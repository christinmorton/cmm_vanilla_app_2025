console.log('👤 ABOUT.JS LOADED - About page specific functionality');

// Import page-specific functionality for about.html
import DesignGridWindow from '../modules/DesignGridTypes/index.js';
import TabSwitcher from '../modules/TabSwitcher.js';
import AnimatedCounter from '../modules/AnimatedCounter.js';

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

// Initialize about page functionality
const initAboutPage = async () => {
  console.log('Initializing about page functionality...');

  // Wait for core components
  const { preloader } = await waitForCore();

  // Initialize tab switcher for skills section
  const tabSwitcher = new TabSwitcher('.skills-section');

  // Make tab switcher globally available for page transitions
  window.tabSwitcher = tabSwitcher;

  // Initialize animated counter for years of experience
  let animatedCounters = null;

  // Function to initialize or reinitialize animated counters
  const initAnimatedCounters = () => {
    console.log('Initializing AnimatedCounters for about page...');

    // Create new instance or reinitialize existing one
    if (animatedCounters) {
      animatedCounters.resetAndAnimate();
    } else {
      animatedCounters = new AnimatedCounter('.counter-value', {
        duration: 2500,
        easing: 'easeOutQuart',
        useIntersectionObserver: true,
        observerThreshold: 0.3,
        startDelay: 500
      });
    }
    console.log('AnimatedCounters initialized/reinitialized for about page');
  };

  // Make components globally available for page transitions
  window.animatedCounters = animatedCounters;
  window.initAnimatedCounters = initAnimatedCounters;

  // Initialize counters after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initAnimatedCounters, 1000);
    });
  } else {
    setTimeout(initAnimatedCounters, 1000);
  }

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

      // Reinitialize animated counters after canvas is ready
      console.log('Canvas ready, reinitializing counters if needed');
      setTimeout(() => {
        if (window.initAnimatedCounters) {
          window.initAnimatedCounters();
        }
      }, 500);

      // Make available globally for debugging
      window.pageTransitions = pageTransitions;
    }
  });

  // Get template configuration from HTML
  const template = document.body.dataset.template; // "background" | "inline" | "hybrid"
  console.log('Template:', template, 'bgHost found:', !!bgHost);

  // Configure canvas based on template (about.html uses "background" template)
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
    // Note: about.html doesn't typically use hybrid mode, but included for completeness
  }

  // Register page transition handlers
  window.pageTransitionHandlers = window.pageTransitionHandlers || [];
  window.pageTransitionHandlers.push(() => {
    console.log('About page transition handler');

    // Reinitialize tab switcher
    if (window.tabSwitcher) {
      window.tabSwitcher.reinitialize();
    }

    // Reinitialize animated counters
    setTimeout(() => {
      if (window.initAnimatedCounters) {
        window.initAnimatedCounters();
      }
    }, 300);
  });

  console.log('✅ About page functionality initialized');
};

// Initialize when script loads
initAboutPage().catch(console.error);