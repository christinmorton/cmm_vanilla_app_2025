/**
 * PreloadManager - Handles template-aware fullscreen preloader overlay
 * Provides instant CSS-only visual feedback during canvas initialization
 */
export default class PreloadManager {
  constructor() {
    this.template = document.body.dataset.template || 'background';
    this.overlay = null;
    this.isVisible = false;
    this.config = this.getTemplateConfig();
  }

  /**
   * Get configuration for current template
   * @returns {Object} Template-specific settings
   */
  getTemplateConfig() {
    const configs = {
      background: {
        className: 'preload-3d-preview',
        message: 'Initializing 3D environment...',
        elements: ['spinner', '3d-cube']
      },
      inline: {
        className: 'preload-minimal',
        message: 'Loading interactive sections...',
        elements: ['progress', 'message']
      },
      hybrid: {
        className: 'preload-morphing',
        message: 'Preparing immersive experience...',
        elements: ['morph', 'message']
      }
    };

    return configs[this.template] || configs.background;
  }

  /**
   * Create preloader overlay with template-specific content
   * @returns {HTMLElement} The overlay element
   */
  createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'preloadHost';
    overlay.className = `preload-overlay ${this.config.className}`;
    overlay.setAttribute('data-stage', 'loading');

    const content = document.createElement('div');
    content.className = 'preload-content';

    // Template-specific content
    if (this.template === 'background') {
      content.innerHTML = `
        <div class="preload-spinner"></div>
        <div class="preload-3d-cube"></div>
        <div class="preload-message">${this.config.message}</div>
      `;
    } else if (this.template === 'inline') {
      content.innerHTML = `
        <div class="preload-progress"></div>
        <div class="preload-message">${this.config.message}</div>
      `;
    } else if (this.template === 'hybrid') {
      content.innerHTML = `
        <div class="preload-morph"></div>
        <div class="preload-message">${this.config.message}</div>
      `;
    }

    overlay.appendChild(content);
    return overlay;
  }

  /**
   * Show preloader overlay immediately
   */
  show() {
    if (this.isVisible) return;

    this.overlay = this.createOverlay();
    document.body.appendChild(this.overlay);
    this.isVisible = true;
  }

  /**
   * Update loading progress (placeholder for future enhancement)
   * @param {string} stage - Loading stage name
   * @param {number} progress - Progress value (0-1)
   */
  updateProgress(stage, progress) {
    if (!this.overlay) return;
    
    // Update data attribute for potential CSS styling
    this.overlay.setAttribute('data-stage', stage);
    
    // Future: Update progress indicators based on template
    console.log(`Loading ${stage}: ${Math.round(progress * 100)}%`);
  }

  /**
   * Hide preloader overlay with fade animation
   */
  hide() {
    if (!this.isVisible || !this.overlay) return;

    // Mark as ready and let CSS transition handle the fade
    this.overlay.setAttribute('data-stage', 'ready');
    
    // Show main content by removing preloader-active class
    document.body.classList.remove('preloader-active');
    
    // Remove from DOM after transition completes
    setTimeout(() => {
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
      }
      this.overlay = null;
      this.isVisible = false;
    }, 500); // Match CSS transition duration
  }

  /**
   * Check if preloader is currently visible
   * @returns {boolean}
   */
  get visible() {
    return this.isVisible;
  }
}