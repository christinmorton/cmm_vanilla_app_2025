// import './style.css'
import PreloadManager from './modules/PreloadManager.js';
import DesignGridWindow from './modules/DesignGridTypes/index.js';
import PageTransitionManager from './modules/PageTransitionManager.js';
import HeaderNavigation from './modules/HeaderNavigation.js';
import TabSwitcher from './modules/TabSwitcher.js';
import { gsap } from 'gsap';

// Initialize preloader immediately
const preloader = new PreloadManager();
console.log('DEBUG: PreloadManager created:', preloader);
preloader.show();
console.log('DEBUG: Preloader show() called');

// Initialize header navigation
const headerNav = new HeaderNavigation();

// Initialize tab switcher (skills section on about page)
const tabSwitcher = new TabSwitcher('.skills-section');

const bgHost = document.getElementById('bgHost');
const inlineHost = document.getElementById('inlineHost');
const hybridHost = document.getElementById('hybridHost');
const btnExpand = document.getElementById('expandCanvas');
const btnCollapse = document.getElementById('collapseCanvas');

// Initialize canvas with preloader integration
const cm = new DesignGridWindow({ 
  bgHost, 
  inlineHost, 
  hybridHost,
  onReady: () => {
    // Hide preloader when canvas is ready
    console.log('Canvas ready, hiding preloader');
    setTimeout(() => {
      console.log('Calling preloader.hide()');
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
    }, 500); // Small delay for smooth transition
    
    // Initialize page transitions after canvas is ready
    const pageTransitions = new PageTransitionManager(cm, preloader);
    // Disable debug logging for production (set to true for debugging)
    pageTransitions.setDebug(false);
    
    // Make available globally for debugging
    window.pageTransitions = pageTransitions;
  }
});

// Example: choose a template at runtime (or hardcode per page)
const template = document.body.dataset.template; // "background" | "inline" | "hybrid"
console.log('Template:', template, 'bgHost found:', !!bgHost);

if (template === 'background') {
  console.log('Mounting canvas to bgHost');
  cm.setMode('background');
  cm.mountTo(bgHost);
}

if (template === 'inline') {
  cm.setMode('inline');
  cm.mountTo(inlineHost);
  // Optional: pause when offscreen via IntersectionObserver
  // (left out for brevity)
}

if (template === 'hybrid') {
  cm.setMode('hybrid');
  cm.mountTo(bgHost);

  // Start collapsed controls hidden
  btnExpand.hidden = true;
  btnCollapse.hidden = false;

  // Trigger collapse on scroll or CTA
  const threshold = 150; // px
  let collapsed = false;
  let animating = false; // Prevent overlapping animations
  let currentTween = null; // Track current animation

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
    hybridHost.style.transition = 'none'; // Prevent CSS transitions from interfering
    
    // Create smooth timeline animation
    const tl = gsap.timeline({
      onComplete: () => {
        // Update buttons
        btnExpand.hidden = false;
        btnCollapse.hidden = true;
        
        // Final resize and cleanup
        setTimeout(() => {
          if (cm.sizer) cm.sizer.applySize();
          animating = false;
        }, 50);
      }
    });
    
    // Step 1: Smooth height reveal with canvas staying in background
    tl.to(hybridHost, { 
      height: '40vh', 
      duration: 0.8, 
      ease: 'power2.out',
      onUpdate: () => {
        if (cm.sizer) cm.sizer.onResize();
      }
    })
    // Step 2: Brief pause for visual stability
    .to({}, { duration: 0.1 })
    // Step 3: Seamlessly move canvas to hybrid host
    .call(() => {
      cm.mountTo(hybridHost);
    })
    // Step 4: Small fade-in effect for smoothness
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
    btnExpand.hidden = true;
    btnCollapse.hidden = false;
    
    // Animate collapse
    currentTween = gsap.to(hybridHost, { 
      height: 0, 
      duration: 0.6, 
      ease: 'power2.in',
      onUpdate: () => {
        // Throttled resize updates  
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

  // Smooth scroll trigger with progressive detection
  let scrollTimeout = null;
  let hasTriggered = false;
  
  const onScroll = () => {
    if (collapsed || animating || hasTriggered) return;
    
    const scrollY = window.scrollY;
    
    // Smoother trigger with slight anticipation
    if (scrollY > threshold - 50) {
      // Clear any pending timeout
      clearTimeout(scrollTimeout);
      
      // Slight delay to ensure user is actually scrolling (not just briefly)
      scrollTimeout = setTimeout(() => {
        if (window.scrollY > threshold && !collapsed && !animating) {
          hasTriggered = true;
          window.removeEventListener('scroll', onScroll);
          
          // Add small delay to make transition feel more natural
          setTimeout(() => {
            collapse();
          }, 150);
        }
      }, 200); // Longer debounce for smoother feel
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // Button event handlers with additional safety checks
  btnExpand.addEventListener('click', (e) => {
    e.preventDefault();
    if (!animating) expand();
  });
  
  btnCollapse.addEventListener('click', (e) => {
    e.preventDefault();
    if (!animating) collapse();
  });
}
