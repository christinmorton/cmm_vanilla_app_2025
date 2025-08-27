// modes.js
import { gsap } from 'gsap';
import { CanvasManager } from './modules/CanvasManager.js';

const bgHost = document.getElementById('bgHost');
const inlineHost = document.getElementById('inlineHost');
const hybridHost = document.getElementById('hybridHost');
const btnExpand = document.getElementById('expandCanvas');
const btnCollapse = document.getElementById('collapseCanvas');

const cm = new CanvasManager({ bgHost, inlineHost, hybridHost });

// Example: choose a template at runtime (or hardcode per page)
const template = document.body.dataset.template; // "background" | "inline" | "hybrid"

if (template === 'background') {
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

  const collapse = () => {
    if (collapsed) return;
    collapsed = true;
    hybridHost.hidden = false;

    // Animate a reveal height if you want (CSS variable or direct style)
    gsap.fromTo(hybridHost, { height: 0 }, { height: '40vh', duration: 0.75, ease: 'power2.out',
      onUpdate: () => cm.sizer.onResize(),
      onComplete: () => {
        cm.mountTo(hybridHost);            // <— Re-parent canvas into banner
        btnExpand.hidden = false;
        btnCollapse.hidden = true;
      }
    });
  };

  const expand = () => {
    if (!collapsed) return;
    collapsed = false;
    // Move canvas back to background
    cm.mountTo(bgHost);
    gsap.to(hybridHost, { height: 0, duration: 0.6, ease: 'power2.in',
      onUpdate: () => cm.sizer.onResize(),
      onComplete: () => {
        hybridHost.hidden = true;
        btnExpand.hidden = true;
        btnCollapse.hidden = false;
      }
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Scroll trigger
  const onScroll = () => {
    if (window.scrollY > threshold) {
      window.removeEventListener('scroll', onScroll);
      collapse();
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // Buttons
  btnExpand.addEventListener('click', expand);
  btnCollapse.addEventListener('click', collapse);
}
