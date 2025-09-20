console.log('🔥 FREE-CONSULTATION.JS LOADED - Free consultation page specific functionality');

// Import page-specific functionality for free-consultation.html
import DesignGridWindow from '../modules/DesignGridTypes/index.js';
import ConsultationPage from '../modules/ConsultationPage.js';
import { gsap } from 'gsap';

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
  const { preloader, analytics } = await waitForCore();

  // Initialize consultation functionality (existing module)
  const consultationPage = new ConsultationPage({
    analyticsTracker: analytics
  });

  // Get DOM elements for canvas integration
  const bgHost = document.getElementById('bgHost');
  const inlineHost = document.getElementById('inlineHost');
  const hybridHost = document.getElementById('hybridHost');
  const btnExpand = document.getElementById('expandCanvas');
  const btnCollapse = document.getElementById('collapseCanvas');

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

  // Configure canvas based on template (free-consultation.html uses "hybrid" template)
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

    // Initialize hybrid mode controls
    initHybridMode(cm, btnExpand, btnCollapse, hybridHost, bgHost);
  }

  // Register page transition handler
  window.pageTransitionHandlers = window.pageTransitionHandlers || [];
  window.pageTransitionHandlers.push(() => {
    console.log('Free consultation page transition handler');
    // ConsultationPage module handles its own state management
  });

  console.log('✅ Free consultation page functionality initialized');
};

// Hybrid mode functionality (for free-consultation.html)
const initHybridMode = (cm, btnExpand, btnCollapse, hybridHost, bgHost) => {
  // Start collapsed controls hidden
  if (btnExpand) btnExpand.hidden = true;
  if (btnCollapse) btnCollapse.hidden = false;

  // Trigger collapse on scroll or CTA
  const threshold = 150; // px
  let collapsed = false;
  let animating = false;
  let currentTween = null;

  const collapse = () => {
    if (collapsed || animating) return;
    animating = true;
    collapsed = true;

    // Kill any existing animation
    if (currentTween) currentTween.kill();

    // Pre-setup hybrid host with proper styling
    hybridHost.hidden = false;
    hybridHost.style.height = '0px';
    hybridHost.style.overflow = 'hidden';
    hybridHost.style.transition = 'none';

    // Create smooth timeline animation
    const tl = gsap.timeline({
      onComplete: () => {
        // Update buttons
        if (btnExpand) btnExpand.hidden = false;
        if (btnCollapse) btnCollapse.hidden = true;

        // Final resize and cleanup
        setTimeout(() => {
          if (cm.sizer) cm.sizer.applySize();
          animating = false;
        }, 50);
      }
    });

    // Step 1: Smooth height reveal
    tl.to(hybridHost, {
      height: '40vh',
      duration: 0.8,
      ease: 'power2.out',
      onUpdate: () => {
        if (cm.sizer) cm.sizer.onResize();
      }
    })
    .to({}, { duration: 0.1 })
    .call(() => {
      cm.mountTo(hybridHost);
    })
    .fromTo(hybridHost,
      { opacity: 0.8 },
      { opacity: 1, duration: 0.3, ease: 'power1.out' }
    );

    currentTween = tl;
  };

  const expand = () => {
    if (!collapsed || animating) return;
    animating = true;
    collapsed = false;

    // Kill any existing animation
    if (currentTween) currentTween.kill();

    // Move canvas back to background first
    cm.mountTo(bgHost);

    // Update buttons immediately
    if (btnExpand) btnExpand.hidden = true;
    if (btnCollapse) btnCollapse.hidden = false;

    // Animate collapse
    currentTween = gsap.to(hybridHost, {
      height: 0,
      duration: 0.6,
      ease: 'power2.in',
      onUpdate: () => {
        if (cm.sizer) cm.sizer.onResize();
      },
      onComplete: () => {
        hybridHost.hidden = true;

        // Smooth scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Final resize and cleanup
        setTimeout(() => {
          if (cm.sizer) cm.sizer.applySize();
          animating = false;
        }, 50);
      }
    });
  };

  // Smooth scroll trigger
  let scrollTimeout = null;
  let hasTriggered = false;

  const onScroll = () => {
    if (collapsed || animating || hasTriggered) return;

    const scrollY = window.scrollY;

    if (scrollY > threshold - 50) {
      clearTimeout(scrollTimeout);

      scrollTimeout = setTimeout(() => {
        if (window.scrollY > threshold && !collapsed && !animating) {
          hasTriggered = true;
          window.removeEventListener('scroll', onScroll);

          setTimeout(() => {
            collapse();
          }, 150);
        }
      }, 200);
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });

  // Button event handlers
  if (btnExpand) {
    btnExpand.addEventListener('click', (e) => {
      e.preventDefault();
      if (!animating) expand();
    });
  }

  if (btnCollapse) {
    btnCollapse.addEventListener('click', (e) => {
      e.preventDefault();
      if (!animating) collapse();
    });
  }
};

// Initialize when script loads
initFreeConsultationPage().catch(console.error);