/**
 * Centralized Resize Management System
 *
 * Eliminates multiple conflicting resize handlers and provides:
 * - Debounced resize events (prevents flickering)
 * - WebGL context loss detection/recovery
 * - Coordinated updates across all components
 * - Transition-safe handling
 * - Performance optimization
 */
class ResizeManager {
    constructor(options = {}) {
        this.debounceDelay = options.debounceDelay || 300;
        this.rafDebounceDelay = options.rafDebounceDelay || 100;

        // Subscriber registry
        this.subscribers = new Map();
        this.prioritySubscribers = new Map(); // High priority subscribers (canvas, etc.)

        // State management
        this.isTransitioning = false;
        this.queuedResizes = [];
        this.lastViewportSize = { width: window.innerWidth, height: window.innerHeight };

        // WebGL context tracking
        this.webglContexts = new Set();
        this.contextLossHandlers = new Map();

        // Debounce timers
        this.debounceTimer = null;
        this.rafTimer = null;
        this.isProcessing = false;

        this.init();
    }

    init() {
        // Single resize listener with smart debouncing
        window.addEventListener('resize', this.handleResize.bind(this), { passive: true });
        window.addEventListener('orientationchange', this.handleOrientationChange.bind(this), { passive: true });

        // WebGL context loss detection
        this.setupWebGLContextMonitoring();

        console.log('ResizeManager: Initialized with centralized resize handling');
    }

    /**
     * Handle resize events with smart debouncing
     */
    handleResize() {
        // Fast RAF debounce for immediate visual feedback
        if (this.rafTimer) {
            cancelAnimationFrame(this.rafTimer);
        }

        this.rafTimer = requestAnimationFrame(() => {
            this.processImmediateResize();
        });

        // Slower debounced resize for heavy operations
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
            this.processMainResize();
        }, this.debounceDelay);
    }

    /**
     * Process immediate resize updates (lightweight operations)
     */
    processImmediateResize() {
        if (this.isTransitioning) {
            this.queueResize('immediate');
            return;
        }

        // Only process if viewport actually changed
        const newSize = { width: window.innerWidth, height: window.innerHeight };
        if (this.hasViewportChanged(newSize)) {
            this.notifySubscribers('immediate', newSize);
            this.lastViewportSize = newSize;
        }
    }

    /**
     * Process main resize updates (heavy operations)
     */
    processMainResize() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        if (this.isTransitioning) {
            this.queueResize('main');
            this.isProcessing = false;
            return;
        }

        try {
            const newSize = { width: window.innerWidth, height: window.innerHeight };

            // Notify priority subscribers first (canvas systems)
            this.notifySubscribers('priority', newSize);

            // Then notify regular subscribers
            this.notifySubscribers('main', newSize);

            // Skip WebGL context health check during regular resize to prevent conflicts
            // Context loss will be handled by dedicated event listeners

            console.log('ResizeManager: Processed resize to', newSize);

        } catch (error) {
            console.error('ResizeManager: Error during resize processing:', error);
            this.handleResizeError(error);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Handle orientation change with special handling
     */
    handleOrientationChange() {
        console.log('ResizeManager: Orientation change detected');

        // iOS Safari needs extra delay for orientation change
        setTimeout(() => {
            this.handleResize();
        }, 150);
    }

    /**
     * Check if viewport actually changed (prevents unnecessary updates)
     */
    hasViewportChanged(newSize) {
        const threshold = 10; // Ignore small changes (increased from 5px)
        return Math.abs(newSize.width - this.lastViewportSize.width) > threshold ||
               Math.abs(newSize.height - this.lastViewportSize.height) > threshold;
    }

    /**
     * Subscribe to resize events
     * @param {string} name - Subscriber name
     * @param {Function} callback - Callback function
     * @param {string} priority - 'immediate', 'priority', or 'main'
     */
    subscribe(name, callback, priority = 'main') {
        const subscription = { callback, priority, name };

        if (priority === 'priority') {
            this.prioritySubscribers.set(name, subscription);
        } else {
            this.subscribers.set(name, subscription);
        }

        console.log(`ResizeManager: Subscribed '${name}' with priority '${priority}'`);
        return subscription;
    }

    /**
     * Unsubscribe from resize events
     */
    unsubscribe(name) {
        const removed = this.subscribers.delete(name) || this.prioritySubscribers.delete(name);
        if (removed) {
            console.log(`ResizeManager: Unsubscribed '${name}'`);
        }
        return removed;
    }

    /**
     * Notify subscribers of resize events
     */
    notifySubscribers(type, viewportSize) {
        const targetMap = type === 'priority' ? this.prioritySubscribers : this.subscribers;

        targetMap.forEach((subscription, name) => {
            if (subscription.priority === type || (type === 'immediate' && subscription.priority !== 'main')) {
                try {
                    subscription.callback({
                        type,
                        viewportSize,
                        timestamp: performance.now()
                    });
                } catch (error) {
                    console.error(`ResizeManager: Error in subscriber '${name}':`, error);
                }
            }
        });
    }

    /**
     * Transition management - pause resize handling during DOM transitions
     */
    startTransition(name) {
        this.isTransitioning = true;
        console.log(`ResizeManager: Started transition '${name}', pausing resize handling`);

        // Auto-resume after 5 seconds as safety fallback
        setTimeout(() => {
            if (this.isTransitioning) {
                console.warn('ResizeManager: Auto-resuming after transition timeout');
                this.endTransition(name + '-auto-resume');
            }
        }, 5000);
    }

    endTransition(name) {
        this.isTransitioning = false;
        console.log(`ResizeManager: Ended transition '${name}', resuming resize handling`);

        // Process any queued resizes
        if (this.queuedResizes.length > 0) {
            console.log(`ResizeManager: Processing ${this.queuedResizes.length} queued resizes`);
            this.queuedResizes = [];

            // Trigger a fresh resize to catch up
            setTimeout(() => {
                this.handleResize();
            }, 50);
        }
    }

    /**
     * Queue resize events during transitions
     */
    queueResize(type) {
        this.queuedResizes.push({ type, timestamp: performance.now() });
    }

    /**
     * WebGL context monitoring and recovery
     */
    setupWebGLContextMonitoring() {
        // Monitor for context loss events on canvas elements
        document.addEventListener('webglcontextlost', (event) => {
            console.warn('ResizeManager: WebGL context lost detected', event);
            this.handleWebGLContextLoss(event.target);
        });

        document.addEventListener('webglcontextrestored', (event) => {
            console.log('ResizeManager: WebGL context restored', event);
            this.handleWebGLContextRestored(event.target);
        });
    }

    /**
     * Register WebGL context for monitoring
     */
    registerWebGLContext(canvas, contextRecoveryCallback) {
        this.webglContexts.add(canvas);
        if (contextRecoveryCallback) {
            this.contextLossHandlers.set(canvas, contextRecoveryCallback);
        }
        console.log('ResizeManager: Registered WebGL context for monitoring');
    }

    /**
     * Check WebGL context health after resize
     */
    checkWebGLContextHealth() {
        this.webglContexts.forEach(canvas => {
            if (canvas && canvas.getContext) {
                try {
                    // Don't try to get context again - just check if it's lost
                    const existingContext = canvas.getContext('webgl', { failIfMajorPerformanceCaveat: false }) ||
                                           canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false });

                    if (existingContext && existingContext.isContextLost && existingContext.isContextLost()) {
                        console.warn('ResizeManager: Found lost WebGL context during health check');
                        this.handleWebGLContextLoss(canvas);
                    }
                } catch (error) {
                    console.warn('ResizeManager: Error checking WebGL context health:', error.message);
                }
            }
        });
    }

    /**
     * Handle WebGL context loss
     */
    handleWebGLContextLoss(canvas) {
        console.warn('ResizeManager: Handling WebGL context loss');
        const recoveryHandler = this.contextLossHandlers.get(canvas);

        if (recoveryHandler) {
            try {
                recoveryHandler('lost');
            } catch (error) {
                console.error('ResizeManager: Error in context loss handler:', error);
            }
        }
    }

    /**
     * Handle WebGL context restoration
     */
    handleWebGLContextRestored(canvas) {
        console.log('ResizeManager: Handling WebGL context restoration');
        const recoveryHandler = this.contextLossHandlers.get(canvas);

        if (recoveryHandler) {
            try {
                recoveryHandler('restored');
            } catch (error) {
                console.error('ResizeManager: Error in context restoration handler:', error);
            }
        }
    }

    /**
     * Handle resize processing errors
     */
    handleResizeError(error) {
        console.error('ResizeManager: Resize processing error, attempting recovery:', error);

        // Clear any stuck states
        this.isProcessing = false;

        // Skip WebGL context health check to prevent conflicts
        // this.checkWebGLContextHealth();

        // Retry resize after brief delay
        setTimeout(() => {
            if (!this.isProcessing) {
                this.handleResize();
            }
        }, 500);
    }

    /**
     * Get current viewport information
     */
    getViewportInfo() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio || 1,
            isTransitioning: this.isTransitioning,
            subscriberCount: this.subscribers.size + this.prioritySubscribers.size
        };
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        // Clear timers
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        if (this.rafTimer) {
            cancelAnimationFrame(this.rafTimer);
        }

        // Remove event listeners
        window.removeEventListener('resize', this.handleResize.bind(this));
        window.removeEventListener('orientationchange', this.handleOrientationChange.bind(this));

        // Clear subscribers
        this.subscribers.clear();
        this.prioritySubscribers.clear();
        this.webglContexts.clear();
        this.contextLossHandlers.clear();

        console.log('ResizeManager: Destroyed');
    }
}

// Create singleton instance
const resizeManager = new ResizeManager();

// Export both class and singleton
export default resizeManager;
export { ResizeManager };