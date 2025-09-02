/**
 * Header Navigation Module
 * Handles mobile menu toggle, scroll effects, and active states
 */

class HeaderNavigation {
  constructor() {
    this.header = document.querySelector('.header-nav');
    this.mobileToggle = document.querySelector('.mobile-menu-toggle');
    this.mobileMenu = document.querySelector('.mobile-menu');
    this.mobileClose = document.querySelector('.mobile-menu-close');
    this.navLinks = document.querySelectorAll('.nav-link');
    
    this.isMenuOpen = false;
    this.scrollThreshold = 50;
    
    this.init();
  }
  
  init() {
    if (!this.header) return;
    
    this.bindEvents();
    this.updateActiveLink();
    this.handleScroll();
  }
  
  bindEvents() {
    // Mobile menu toggle
    if (this.mobileToggle) {
      this.mobileToggle.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleMobileMenu();
      });
    }
    
    // Mobile menu close
    if (this.mobileClose) {
      this.mobileClose.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeMobileMenu();
      });
    }
    
    // Close menu when clicking nav links
    this.navLinks.forEach(link => {
      link.addEventListener('click', () => {
        this.closeMobileMenu();
      });
    });
    
    // Close menu when clicking overlay
    document.addEventListener('click', (e) => {
      if (this.isMenuOpen && 
          !this.mobileMenu.contains(e.target) && 
          !this.mobileToggle.contains(e.target)) {
        this.closeMobileMenu();
      }
    });
    
    // Handle escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isMenuOpen) {
        this.closeMobileMenu();
      }
    });
    
    // Scroll effects
    window.addEventListener('scroll', () => {
      this.handleScroll();
    }, { passive: true });
    
    // Resize handler
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }
  
  toggleMobileMenu() {
    if (this.isMenuOpen) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  }
  
  openMobileMenu() {
    if (!this.mobileMenu) return;
    
    this.isMenuOpen = true;
    this.mobileMenu.classList.add('active');
    this.mobileToggle?.classList.add('active');
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Update ARIA attributes
    this.mobileToggle?.setAttribute('aria-expanded', 'true');
    
    // Focus management
    const firstLink = this.mobileMenu.querySelector('.nav-link');
    if (firstLink) {
      setTimeout(() => firstLink.focus(), 100);
    }
  }
  
  closeMobileMenu() {
    if (!this.mobileMenu || !this.isMenuOpen) return;
    
    this.isMenuOpen = false;
    this.mobileMenu.classList.remove('active');
    this.mobileToggle?.classList.remove('active');
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Update ARIA attributes
    this.mobileToggle?.setAttribute('aria-expanded', 'false');
    
    // Return focus to toggle button
    if (this.mobileToggle) {
      this.mobileToggle.focus();
    }
  }
  
  handleScroll() {
    if (!this.header) return;
    
    const scrollY = window.scrollY;
    
    // Add scrolled class for styling
    if (scrollY > this.scrollThreshold) {
      this.header.classList.add('scrolled');
    } else {
      this.header.classList.remove('scrolled');
    }
  }
  
  handleResize() {
    // Close mobile menu on desktop
    if (window.innerWidth > 768 && this.isMenuOpen) {
      this.closeMobileMenu();
    }
  }
  
  updateActiveLink() {
    if (!this.navLinks.length) return;
    
    const currentPage = window.location.pathname;
    const currentPageName = currentPage.split('/').pop() || 'index.html';
    
    // Remove all active classes
    this.navLinks.forEach(link => {
      link.classList.remove('active');
    });
    
    // Add active class to current page link
    this.navLinks.forEach(link => {
      const linkHref = link.getAttribute('href');
      const linkPageName = linkHref.split('/').pop();
      
      if (linkPageName === currentPageName || 
          (currentPageName === '' && linkPageName === 'index.html') ||
          (currentPageName === 'index.html' && linkPageName === 'index.html')) {
        link.classList.add('active');
      }
    });
  }
  
  // Public method to manually set active link
  setActiveLink(href) {
    this.navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === href) {
        link.classList.add('active');
      }
    });
  }
  
  // Public method to add scroll listener for custom effects
  onScroll(callback) {
    if (typeof callback === 'function') {
      window.addEventListener('scroll', callback, { passive: true });
    }
  }
  
  // Cleanup method
  destroy() {
    // Remove event listeners if needed
    document.body.style.overflow = '';
    this.closeMobileMenu();
  }
}

export default HeaderNavigation;