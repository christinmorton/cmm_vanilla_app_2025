class AnimatedCounter {
    constructor(selector, options = {}) {
        this.counters = document.querySelectorAll(selector);
        this.options = {
            duration: options.duration || 2000,
            startDelay: options.startDelay || 0,
            useIntersectionObserver: options.useIntersectionObserver !== false,
            observerThreshold: options.observerThreshold || 0.5,
            easing: options.easing || 'easeOutQuart',
            startValue: options.startValue || 0,
            ...options
        };
        
        this.animatedCounters = new Set();
        this.init();
    }
    
    init() {
        console.log('AnimatedCounter: Initializing with', this.counters.length, 'counter elements');
        
        if (this.counters.length === 0) {
            console.warn('AnimatedCounter: No counter elements found');
            return;
        }
        
        // Log found counters
        this.counters.forEach((counter, index) => {
            console.log(`Counter ${index}:`, {
                element: counter,
                dataCount: counter.dataset.count,
                textContent: counter.textContent
            });
        });
        
        if (this.options.useIntersectionObserver) {
            console.log('AnimatedCounter: Setting up intersection observer');
            this.setupIntersectionObserver();
        } else {
            console.log('AnimatedCounter: Starting all counters immediately');
            this.startAllCounters();
        }
    }
    
    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                console.log('AnimatedCounter: Intersection event', {
                    target: entry.target,
                    isIntersecting: entry.isIntersecting,
                    intersectionRatio: entry.intersectionRatio,
                    alreadyAnimated: this.animatedCounters.has(entry.target)
                });
                
                if (entry.isIntersecting && !this.animatedCounters.has(entry.target)) {
                    console.log('AnimatedCounter: Starting animation for', entry.target);
                    this.animateCounter(entry.target);
                }
            });
        }, {
            threshold: this.options.observerThreshold
        });
        
        this.counters.forEach(counter => {
            observer.observe(counter);
        });
    }
    
    startAllCounters() {
        setTimeout(() => {
            this.counters.forEach(counter => {
                if (!this.animatedCounters.has(counter)) {
                    this.animateCounter(counter);
                }
            });
        }, this.options.startDelay);
    }
    
    animateCounter(counterElement) {
        const targetValue = parseInt(counterElement.dataset.count) || 0;
        const startValue = this.options.startValue;
        const duration = this.options.duration;
        
        // Mark as animated to prevent multiple animations
        this.animatedCounters.add(counterElement);
        
        // Store original text content if it contains non-numeric characters
        const originalText = counterElement.textContent;
        const hasPrefix = /^[^\d]*/.exec(originalText)?.[0] || '';
        const hasSuffix = /[^\d]*$/.exec(originalText)?.[0] || '';
        
        let startTime;
        
        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Apply easing function
            const easedProgress = this.applyEasing(progress, this.options.easing);
            
            // Calculate current value
            const currentValue = Math.round(startValue + (targetValue - startValue) * easedProgress);
            
            // Update counter display
            counterElement.textContent = hasPrefix + currentValue + hasSuffix;
            
            // Continue animation if not complete
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Ensure final value is exact
                counterElement.textContent = hasPrefix + targetValue + hasSuffix;
                this.onCounterComplete(counterElement, targetValue);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    applyEasing(progress, easingType) {
        switch (easingType) {
            case 'linear':
                return progress;
            case 'easeInQuad':
                return progress * progress;
            case 'easeOutQuad':
                return progress * (2 - progress);
            case 'easeInOutQuad':
                return progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
            case 'easeInCubic':
                return progress * progress * progress;
            case 'easeOutCubic':
                return 1 + (--progress) * progress * progress;
            case 'easeInOutCubic':
                return progress < 0.5 ? 4 * progress * progress * progress : 1 + (--progress) * (2 * (--progress)) * (2 * progress);
            case 'easeInQuart':
                return progress * progress * progress * progress;
            case 'easeOutQuart':
                return 1 - (--progress) * progress * progress * progress;
            case 'easeInOutQuart':
                return progress < 0.5 ? 8 * progress * progress * progress * progress : 1 - 8 * (--progress) * progress * progress * progress;
            case 'easeInQuint':
                return progress * progress * progress * progress * progress;
            case 'easeOutQuint':
                return 1 + (--progress) * progress * progress * progress * progress;
            case 'easeInOutQuint':
                return progress < 0.5 ? 16 * progress * progress * progress * progress * progress : 1 + 16 * (--progress) * progress * progress * progress * progress;
            default:
                return 1 - (--progress) * progress * progress * progress; // easeOutQuart default
        }
    }
    
    onCounterComplete(counterElement, finalValue) {
        // Add completed class for potential CSS animations
        counterElement.classList.add('counter-completed');
        
        // Dispatch custom event
        const event = new CustomEvent('counterComplete', {
            detail: { element: counterElement, value: finalValue }
        });
        counterElement.dispatchEvent(event);
    }
    
    // Public method to manually trigger animation for specific counter
    animateSpecificCounter(counterElement) {
        if (counterElement && !this.animatedCounters.has(counterElement)) {
            this.animateCounter(counterElement);
        }
    }
    
    // Public method to reset and re-animate all counters
    resetAndAnimate() {
        this.animatedCounters.clear();
        this.startAllCounters();
    }
    
    // Public method to reset specific counter
    resetCounter(counterElement) {
        if (counterElement) {
            this.animatedCounters.delete(counterElement);
            counterElement.classList.remove('counter-completed');
            // Reset to start value or original text
            const startValue = this.options.startValue;
            counterElement.textContent = startValue.toString();
        }
    }
}

export default AnimatedCounter;