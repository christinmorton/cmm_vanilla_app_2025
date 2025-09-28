import Swiper from 'swiper';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

/**
 * Base Carousel Manager
 * Handles initialization of different carousel types with their specific configurations
 */
class CarouselManager {
  constructor() {
    this.carousels = new Map();
    this.defaultModules = [Navigation, Pagination, Autoplay];
  }

  /**
   * Base carousel configuration
   */
  getBaseConfig() {
    return {
      modules: this.defaultModules,
      slidesPerView: 1,
      spaceBetween: 0,
      loop: true,
      effect: 'slide',
    };
  }

  /**
   * Hero carousel specific configuration
   */
  getHeroConfig() {
    return {
      ...this.getBaseConfig(),
      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
      },
      navigation: {
        nextEl: '.hero-next',
        prevEl: '.hero-prev',
      },
      pagination: {
        el: '.hero-pagination',
        clickable: true,
      },
      speed: 800,
    };
  }

  /**
   * CTA carousel specific configuration
   */
  getCtaConfig() {
    return {
      ...this.getBaseConfig(),
      autoplay: {
        delay: 8000, // Slower than hero carousel
        disableOnInteraction: false,
      },
      navigation: {
        nextEl: '.cta-next',
        prevEl: '.cta-prev',
      },
      pagination: {
        el: '.cta-pagination',
        clickable: true,
      },
      speed: 1000, // Slower transition
    };
  }

  /**
   * Initialize hero carousel
   */
  initHeroCarousel() {
    const element = document.querySelector('.hero-carousel');
    if (element) {
      console.log('Initializing hero carousel');
      try {
        const swiper = new Swiper('.hero-carousel', this.getHeroConfig());
        this.carousels.set('hero', swiper);
        console.log('Hero carousel initialized successfully');
        return swiper;
      } catch (error) {
        console.error('Error initializing hero carousel:', error);
        return null;
      }
    } else {
      console.log('Hero carousel element not found');
      return null;
    }
  }

  /**
   * Initialize CTA carousel
   */
  initCtaCarousel() {
    const element = document.querySelector('.cta-carousel');
    if (element) {
      console.log('Initializing CTA carousel');
      try {
        const swiper = new Swiper('.cta-carousel', this.getCtaConfig());
        this.carousels.set('cta', swiper);
        console.log('CTA carousel initialized successfully');
        return swiper;
      } catch (error) {
        console.error('Error initializing CTA carousel:', error);
        return null;
      }
    } else {
      console.log('CTA carousel element not found');
      return null;
    }
  }

  /**
   * Initialize all carousels
   */
  initAllCarousels() {
    console.log('CarouselManager: Initializing all carousels');
    this.initHeroCarousel();
    this.initCtaCarousel();
    
    // Mark all carousel containers as initialized
    setTimeout(() => {
      const containers = document.querySelectorAll('.hero-carousel-container, .cta-section-wrapper');
      containers.forEach(container => {
        container.classList.add('carousel-initialized');
      });
    }, 100);
    
    console.log('CarouselManager: Initialization complete');
  }

  /**
   * Reinitialize carousels after page transition
   */
  reinitializeAfterTransition() {
    console.log('CarouselManager: Reinitializing after page transition');
    
    // Add transition class to body
    document.body.classList.add('page-transitioning');
    
    // Destroy existing carousels first
    this.destroyAllCarousels();
    
    // Small delay to ensure DOM is fully updated
    setTimeout(() => {
      this.initAllCarousels();
      
      // Force layout recalculation
      this.updateCarouselLayouts();
      
      // Mark carousels as initialized and remove transition class
      setTimeout(() => {
        const containers = document.querySelectorAll('.hero-carousel-container, .cta-section-wrapper');
        containers.forEach(container => {
          container.classList.add('carousel-initialized');
        });
        document.body.classList.remove('page-transitioning');
        console.log('CarouselManager: Transition complete, carousels ready');
      }, 200);
    }, 100);
  }

  /**
   * Update carousel layouts and force resize
   */
  updateCarouselLayouts() {
    this.carousels.forEach((carousel, type) => {
      if (carousel && carousel.update) {
        carousel.update();
        console.log(`${type} carousel layout updated`);
      }
    });
  }

  /**
   * Handle window resize events
   */
  handleResize() {
    console.log('CarouselManager: Handling resize event');
    this.updateCarouselLayouts();
  }

  /**
   * Get a specific carousel instance
   */
  getCarousel(type) {
    return this.carousels.get(type);
  }

  /**
   * Destroy a specific carousel
   */
  destroyCarousel(type) {
    const carousel = this.carousels.get(type);
    if (carousel) {
      carousel.destroy(true, true);
      this.carousels.delete(type);
      console.log(`${type} carousel destroyed`);
    }
  }

  /**
   * Destroy all carousels
   */
  destroyAllCarousels() {
    this.carousels.forEach((carousel, type) => {
      carousel.destroy(true, true);
      console.log(`${type} carousel destroyed`);
    });
    this.carousels.clear();
  }
}

export default CarouselManager;