/**
 * Portfolio Filter Module
 * Handles filtering of portfolio items based on category selection
 */

class PortfolioFilter {
  constructor(filterSelector = '.filter-controls', gridSelector = '.portfolio-masonry-grid') {
    this.filterContainer = document.querySelector(filterSelector);
    this.gridContainer = document.querySelector(gridSelector);
    
    if (!this.filterContainer || !this.gridContainer) {
      console.log('Portfolio filter elements not found on this page');
      return;
    }
    
    this.filterButtons = this.filterContainer.querySelectorAll('.filter-button');
    this.portfolioItems = this.gridContainer.querySelectorAll('.masonry-item');
    
    this.init();
  }
  
  init() {
    // Add click event listeners to filter buttons
    this.filterButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleFilterClick(button);
      });
    });
    
    console.log(`Portfolio Filter initialized with ${this.portfolioItems.length} items`);
  }
  
  handleFilterClick(clickedButton) {
    const filterValue = clickedButton.getAttribute('data-filter');
    
    // Update active button state
    this.updateActiveButton(clickedButton);
    
    // Filter portfolio items
    this.filterItems(filterValue);
  }
  
  updateActiveButton(activeButton) {
    // Remove active class from all buttons
    this.filterButtons.forEach(button => {
      button.classList.remove('active');
    });
    
    // Add active class to clicked button
    activeButton.classList.add('active');
  }
  
  filterItems(filterValue) {
    // Clear any ongoing animations first
    this.portfolioItems.forEach(item => {
      item.classList.remove('filtering-in', 'filtering-out');
    });
    
    // Small delay to ensure clean state
    requestAnimationFrame(() => {
      // First pass: hide items that should be filtered out
      this.portfolioItems.forEach(item => {
        const shouldShow = this.shouldShowItem(item, filterValue);
        
        if (!shouldShow) {
          // Start hide animation
          item.classList.add('filtering-out');
          
          // After animation, completely hide from layout
          setTimeout(() => {
            item.classList.add('filtered-out');
            item.classList.remove('filtering-out');
          }, 250);
        }
      });
      
      // Second pass: show items that should be visible with staggered animation
      setTimeout(() => {
        let visibleIndex = 0;
        this.portfolioItems.forEach(item => {
          const shouldShow = this.shouldShowItem(item, filterValue);
          
          if (shouldShow) {
            // Remove hidden state first
            item.classList.remove('filtered-out', 'filtering-out');
            
            // Add entrance animation with stagger
            setTimeout(() => {
              item.classList.add('filtering-in');
              
              // Clean up animation class after completion
              setTimeout(() => {
                item.classList.remove('filtering-in');
              }, 600);
            }, visibleIndex * 60);
            
            visibleIndex++;
          }
        });
      }, 150);
    });
  }
  
  shouldShowItem(item, filterValue) {
    // Show all items if filter is "*" (All button)
    if (filterValue === '*') {
      return true;
    }
    
    // Check if item has the matching data-category or class
    const itemCategory = item.getAttribute('data-category');
    const hasFilterClass = item.classList.contains(filterValue.replace('.', ''));
    
    return itemCategory === filterValue.replace('.', '') || hasFilterClass;
  }
  
  // Public method to programmatically set filter
  setFilter(filterValue) {
    const targetButton = Array.from(this.filterButtons).find(button => 
      button.getAttribute('data-filter') === filterValue
    );
    
    if (targetButton) {
      this.handleFilterClick(targetButton);
    }
  }
  
  // Public method to get current active filter
  getCurrentFilter() {
    const activeButton = this.filterContainer.querySelector('.filter-button.active');
    return activeButton ? activeButton.getAttribute('data-filter') : '*';
  }
}

export default PortfolioFilter;