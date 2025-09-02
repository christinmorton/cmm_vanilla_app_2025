/**
 * PageTransitionManager - Smooth page transitions using existing GSAP + Three.js
 * Provides canvas-coordinated transitions between HTML template pages
 */
import { gsap } from 'gsap';

export default class PageTransitionManager {
  constructor(canvas, preloader) {
    this.canvas = canvas;
    this.preloader = preloader;
    this.contentCache = new Map();
    this.isTransitioning = false;
    this.debug = false;
    
    this.initializeNavigation();
  }

  /**
   * Initialize global navigation interception
   */
  initializeNavigation() {
    // Intercept clicks on HTML page links
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href$=".html"]');
      if (link && !link.hasAttribute('data-no-transition')) {
        e.preventDefault();
        this.navigateTo(link.href);
      }
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', (e) => {
      if (e.state?.transitioned) {
        this.navigateTo(location.href, { 
          skipHistory: true,
          direction: 'back' 
        });
      }
    });

    if (this.debug) {
      console.log('PageTransitionManager: Navigation initialized');
    }
  }

  /**
   * Navigate to a new page with smooth transition
   * @param {string} url - Target page URL
   * @param {Object} options - Transition options
   */
  async navigateTo(url, options = {}) {
    if (this.isTransitioning) return;
    
    const currentUrl = window.location.href;
    if (url === currentUrl) return;

    this.isTransitioning = true;
    
    try {
      if (this.debug) {
        console.log(`PageTransitionManager: Transitioning to ${url}`);
      }

      // Ensure canvas stays visible during transition
      const bgHost = document.getElementById('bgHost');
      if (bgHost) {
        bgHost.style.zIndex = '1';
      }

      // Get current and target template types
      const currentTemplate = document.body.dataset.template;
      const pageContent = await this.fetchPageContent(url);
      const targetTemplate = pageContent.template;

      // Create appropriate transition timeline
      const timeline = this.createTransitionTimeline(currentTemplate, targetTemplate, pageContent);
      
      // Update browser state unless navigating back
      if (!options.skipHistory) {
        this.updateBrowserState(url, pageContent.title);
      }
      
      // Execute transition
      await timeline.play();
      
    } catch (error) {
      console.error('PageTransitionManager: Transition failed', error);
      // Fallback to standard navigation
      window.location.href = url;
    } finally {
      this.isTransitioning = false;
    }
  }

  /**
   * Fetch and parse page content
   * @param {string} url - Page URL to fetch
   * @returns {Promise<Object>} Parsed page content
   */
  async fetchPageContent(url) {
    // Check cache first
    if (this.contentCache.has(url)) {
      return this.contentCache.get(url);
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    const html = await response.text();
    const content = this.extractPageContent(html);
    
    // Cache the content
    this.contentCache.set(url, content);
    
    return content;
  }

  /**
   * Extract relevant content from fetched HTML
   * @param {string} html - Raw HTML string
   * @returns {Object} Extracted content object
   */
  extractPageContent(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    return {
      title: doc.title,
      template: doc.body.dataset.template || 'background',
      main: doc.querySelector('main')?.innerHTML || '',
      head: this.extractHeadContent(doc),
      bodyClass: doc.body.className
    };
  }

  /**
   * Extract head content (meta tags, etc.)
   * @param {Document} doc - Parsed document
   * @returns {Object} Head content
   */
  extractHeadContent(doc) {
    const title = doc.querySelector('title')?.textContent || '';
    const meta = Array.from(doc.querySelectorAll('meta')).map(tag => ({
      name: tag.name || tag.property || tag.httpEquiv,
      content: tag.content
    }));
    
    return { title, meta };
  }

  /**
   * Create GSAP transition timeline based on template types
   * @param {string} fromTemplate - Current template type
   * @param {string} toTemplate - Target template type
   * @param {Object} pageContent - New page content
   * @returns {gsap.timeline} Animation timeline
   */
  createTransitionTimeline(fromTemplate, toTemplate, pageContent) {
    const tl = gsap.timeline({
      onComplete: () => {
        this.finalizePage(pageContent);
        if (this.debug) {
          console.log('PageTransitionManager: Transition complete');
        }
      }
    });

    if (fromTemplate === toTemplate && toTemplate === 'background') {
      // Canvas Bridge Transition - same template type
      return this.createCanvasBridgeTransition(tl, pageContent);
    } else if (fromTemplate !== toTemplate) {
      // Canvas Morph Transition - different template types
      return this.createCanvasMorphTransition(tl, fromTemplate, toTemplate, pageContent);
    } else {
      // Default transition for same template type
      return this.createDefaultTransition(tl, pageContent);
    }
  }

  /**
   * Create canvas bridge transition (Background → Background)
   * @param {gsap.timeline} tl - Timeline to build on
   * @param {Object} pageContent - New page content
   * @returns {gsap.timeline} Built timeline
   */
  createCanvasBridgeTransition(tl, pageContent) {
    const mainElement = document.querySelector('main');
    const appElement = document.querySelector('#app');
    const bgHost = document.getElementById('bgHost');
    
    if (this.debug) {
      console.log('🎬 Starting canvas bridge transition');
      console.log('📊 Initial state:', {
        mainElement: mainElement ? 'found' : 'missing',
        appElement: appElement ? 'found' : 'missing',
        bgHost: bgHost ? 'found' : 'missing',
        mainOpacity: mainElement ? getComputedStyle(mainElement).opacity : 'n/a',
        appBackground: appElement ? getComputedStyle(appElement).background : 'n/a'
      });
    }
    
    tl
      // Ensure proper layering during transition
      .call(() => {
        if (this.debug) console.log('🔧 Setting up layering');
        
        // Temporarily ensure content stays visible over canvas
        if (mainElement) {
          mainElement.style.position = 'relative';
          mainElement.style.zIndex = '10';
          mainElement.style.background = 'transparent';
        }
        
        if (appElement) {
          appElement.style.background = 'transparent';
        }
        
        if (bgHost) {
          bgHost.style.zIndex = '1';
          bgHost.style.pointerEvents = 'none';
        }
      })
      // Fade out current content
      .to(mainElement, { 
        opacity: 0, 
        scale: 0.98,
        duration: 0.4, 
        ease: 'power2.out',
        onStart: () => {
          if (this.debug) console.log('🎭 Fading out current content');
        }
      })
      // Swap content while invisible
      .call(() => {
        if (this.debug) console.log('🔄 Swapping content');
        
        this.swapMainContent(pageContent.main);
        this.updateDocumentHead(pageContent.head);
        
        // Ensure new content has proper styling
        const newMain = document.querySelector('main');
        if (newMain) {
          newMain.style.position = 'relative';
          newMain.style.zIndex = '10';
          newMain.style.background = 'transparent';
          newMain.style.opacity = '0';
          
          if (this.debug) {
            console.log('✅ New content prepared:', {
              position: newMain.style.position,
              zIndex: newMain.style.zIndex,
              opacity: newMain.style.opacity
            });
          }
        }
      })
      // Brief pause to ensure DOM updates
      .to({}, { 
        duration: 0.15,
        onComplete: () => {
          if (this.debug) console.log('⏳ DOM update pause complete');
        }
      })
      // Fade in new content
      .set(mainElement, { scale: 1.02 })
      .to(mainElement, { 
        opacity: 1, 
        scale: 1,
        duration: 0.5, 
        ease: 'power2.out',
        onStart: () => {
          if (this.debug) console.log('🎭 Fading in new content');
        },
        onComplete: () => {
          if (this.debug) console.log('✨ Transition animation complete');
        }
      })
      // Clean up inline styles but preserve critical ones
      .call(() => {
        if (this.debug) console.log('🧹 Cleaning up styles');
        
        if (mainElement) {
          // Keep position and z-index for proper layering
          mainElement.style.position = 'relative';
          mainElement.style.zIndex = '10';
          // Remove scale transform
          mainElement.style.transform = '';
        }
        
        if (this.debug) {
          console.log('🏁 Canvas bridge transition complete');
          console.log('📊 Final state:', {
            mainOpacity: mainElement ? getComputedStyle(mainElement).opacity : 'n/a',
            mainZIndex: mainElement ? mainElement.style.zIndex : 'n/a',
            mainComputedZIndex: mainElement ? getComputedStyle(mainElement).zIndex : 'n/a',
            appBackground: appElement ? getComputedStyle(appElement).background : 'n/a',
            bodyBackground: getComputedStyle(document.body).background,
            mainPosition: mainElement ? getComputedStyle(mainElement).position : 'n/a',
            bgHostZIndex: bgHost ? getComputedStyle(bgHost).zIndex : 'n/a',
            canvasElement: bgHost ? bgHost.querySelector('canvas') ? 'found' : 'missing' : 'bgHost missing'
          });
        }
      });

    return tl;
  }

  /**
   * Create canvas morph transition (different template types)
   * @param {gsap.timeline} tl - Timeline to build on
   * @param {string} fromTemplate - Source template
   * @param {string} toTemplate - Target template
   * @param {Object} pageContent - New page content
   * @returns {gsap.timeline} Built timeline
   */
  createCanvasMorphTransition(tl, fromTemplate, toTemplate, pageContent) {
    const mainElement = document.querySelector('main');
    
    tl
      // Begin canvas mode transition
      .call(() => {
        if (this.canvas && typeof this.canvas.setMode === 'function') {
          this.canvas.setMode(toTemplate);
        }
      })
      // Fade and scale out current content
      .to(mainElement, { 
        opacity: 0, 
        scale: 0.95, 
        duration: 0.6, 
        ease: 'power2.in' 
      })
      // Update page template and content
      .call(() => {
        document.body.dataset.template = toTemplate;
        this.swapMainContent(pageContent.main);
        this.updateDocumentHead(pageContent.head);
        this.handleCanvasRemounting(toTemplate);
      })
      // Brief pause for canvas adjustment
      .to({}, { duration: 0.2 })
      // Fade and scale in new content
      .set(mainElement, { scale: 1.05 })
      .to(mainElement, { 
        opacity: 1, 
        scale: 1, 
        duration: 0.6, 
        ease: 'power2.out' 
      });

    return tl;
  }

  /**
   * Create default transition
   * @param {gsap.timeline} tl - Timeline to build on
   * @param {Object} pageContent - New page content
   * @returns {gsap.timeline} Built timeline
   */
  createDefaultTransition(tl, pageContent) {
    const mainElement = document.querySelector('main');
    
    tl
      .to(mainElement, { opacity: 0, duration: 0.3 })
      .call(() => {
        this.swapMainContent(pageContent.main);
        this.updateDocumentHead(pageContent.head);
      })
      .to(mainElement, { opacity: 1, duration: 0.3 });

    return tl;
  }

  /**
   * Handle canvas remounting for template changes
   * @param {string} template - New template type
   */
  handleCanvasRemounting(template) {
    if (!this.canvas || typeof this.canvas.mountTo !== 'function') return;

    const bgHost = document.getElementById('bgHost');
    const inlineHost = document.getElementById('inlineHost');
    const hybridHost = document.getElementById('hybridHost');

    switch (template) {
      case 'background':
        if (bgHost) this.canvas.mountTo(bgHost);
        break;
      case 'inline':
        if (inlineHost) this.canvas.mountTo(inlineHost);
        break;
      case 'hybrid':
        if (bgHost) this.canvas.mountTo(bgHost);
        break;
    }
  }

  /**
   * Swap main content during transition
   * @param {string} newContent - New main content HTML
   */
  swapMainContent(newContent) {
    const mainElement = document.querySelector('main');
    if (!mainElement) {
      if (this.debug) console.error('❌ Main element not found for content swap');
      return;
    }
    
    if (!newContent) {
      if (this.debug) console.error('❌ No new content provided for swap');
      return;
    }
    
    if (this.debug) {
      console.log('🔄 Swapping main content');
      console.log('📏 Old content length:', mainElement.innerHTML.length);
      console.log('📏 New content length:', newContent.length);
    }
    
    // Store current styles before swapping
    const currentStyles = {
      position: mainElement.style.position,
      zIndex: mainElement.style.zIndex,
      opacity: mainElement.style.opacity,
      background: mainElement.style.background,
      transform: mainElement.style.transform
    };
    
    // Replace content
    mainElement.innerHTML = newContent;
    
    // Restore critical inline styles
    mainElement.style.position = currentStyles.position || 'relative';
    mainElement.style.zIndex = currentStyles.zIndex || '10';
    mainElement.style.background = 'transparent';
    
    // Preserve animation states
    if (currentStyles.opacity) mainElement.style.opacity = currentStyles.opacity;
    if (currentStyles.transform) mainElement.style.transform = currentStyles.transform;
    
    if (this.debug) {
      console.log('✅ Content swapped, styles restored:', {
        position: mainElement.style.position,
        zIndex: mainElement.style.zIndex,
        opacity: mainElement.style.opacity,
        background: mainElement.style.background
      });
    }
  }

  /**
   * Update document head elements
   * @param {Object} headContent - New head content
   */
  updateDocumentHead(headContent) {
    if (headContent.title) {
      document.title = headContent.title;
    }
  }

  /**
   * Finalize page after transition
   * @param {Object} pageContent - Page content object
   */
  finalizePage(pageContent) {
    // CRITICAL: Remove preloader-active class that might be hiding content
    document.body.classList.remove('preloader-active');
    
    if (this.debug) {
      console.log('🚫 Removed preloader-active class from body');
    }

    // Update body classes if needed
    if (pageContent.bodyClass) {
      document.body.className = pageContent.bodyClass;
      // Re-remove preloader-active in case bodyClass reset it
      document.body.classList.remove('preloader-active');
    }

    // Ensure proper app container styling for background templates
    const appElement = document.querySelector('#app');
    if (appElement && pageContent.template === 'background') {
      // Force transparent background for canvas visibility
      appElement.style.background = 'transparent';
      // Force full opacity to override any preloader CSS
      appElement.style.opacity = '1';
    }

    // Ensure main content is properly positioned
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.style.position = 'relative';
      mainElement.style.zIndex = '10';
      mainElement.style.opacity = '1';
    }

    // Debug canvas state
    if (this.debug) {
      const bgHost = document.getElementById('bgHost');
      const canvas = bgHost ? bgHost.querySelector('canvas') : null;
      
      console.log('🎨 Canvas state check:', {
        canvasExists: canvas ? 'YES' : 'NO',
        canvasVisible: canvas ? getComputedStyle(canvas).visibility : 'n/a',
        canvasOpacity: canvas ? getComputedStyle(canvas).opacity : 'n/a',
        bgHostDisplay: bgHost ? getComputedStyle(bgHost).display : 'n/a',
        bgHostZIndex: bgHost ? getComputedStyle(bgHost).zIndex : 'n/a'
      });
    }

    // Trigger resize to ensure canvas adapts
    if (this.canvas && this.canvas.sizer) {
      setTimeout(() => {
        this.canvas.sizer.applySize();
      }, 100);
    }

    // Visual debugging helper - add colored background and border temporarily
    if (this.debug) {
      const mainElement = document.querySelector('main');
      const appElement = document.querySelector('#app');
      
      if (mainElement) {
        // Make content highly visible for debugging
        mainElement.style.border = '5px solid red';
        mainElement.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
        mainElement.style.position = 'relative';
        mainElement.style.zIndex = '999';
        
        console.log('🔍 Applied visual debugging styles to main element');
        
        setTimeout(() => {
          mainElement.style.border = '';
          mainElement.style.backgroundColor = '';
          mainElement.style.zIndex = '10';
        }, 5000); // Extended to 5 seconds
      }
      
      if (appElement) {
        appElement.style.border = '3px solid blue';
        setTimeout(() => {
          appElement.style.border = '';
        }, 5000);
      }
      
      // Also highlight the canvas area
      const bgHost = document.getElementById('bgHost');
      if (bgHost) {
        bgHost.style.border = '3px solid green';
        setTimeout(() => {
          bgHost.style.border = '';
        }, 5000);
      }
    }

    // Dispatch custom event for other systems
    window.dispatchEvent(new CustomEvent('pageTransitionComplete', {
      detail: { template: pageContent.template }
    }));
    
    // Monitor for any changes to the main element after transition
    if (this.debug) {
      const mainElement = document.querySelector('main');
      if (mainElement) {
        console.log('🕵️ Setting up post-transition monitoring');
        
        // Check every second for 10 seconds to see if anything changes
        let checkCount = 0;
        const monitor = setInterval(() => {
          checkCount++;
          const currentOpacity = getComputedStyle(mainElement).opacity;
          const currentDisplay = getComputedStyle(mainElement).display;
          const currentZIndex = getComputedStyle(mainElement).zIndex;
          const currentPosition = getComputedStyle(mainElement).position;
          
          console.log(`🕵️ Check ${checkCount}:`, {
            opacity: currentOpacity,
            display: currentDisplay,
            zIndex: currentZIndex,
            position: currentPosition,
            stillExists: document.contains(mainElement)
          });
          
          if (checkCount >= 10) {
            clearInterval(monitor);
            console.log('🕵️ Monitoring complete');
          }
        }, 1000);
      }
    }
  }

  /**
   * Update browser history and URL
   * @param {string} url - New URL
   * @param {string} title - New page title
   */
  updateBrowserState(url, title) {
    document.title = title;
    history.pushState(
      { 
        transitioned: true, 
        timestamp: Date.now() 
      }, 
      title, 
      url
    );
  }

  /**
   * Clear content cache
   */
  clearCache() {
    this.contentCache.clear();
  }

  /**
   * Enable/disable debug logging
   * @param {boolean} enabled - Debug state
   */
  setDebug(enabled) {
    this.debug = enabled;
  }
}